import { Component, OnInit, Input, ViewChild, ChangeDetectorRef, ElementRef } from '@angular/core';
import { MainService } from 'src/app/services/main.service';
import { CanvasService } from 'src/app/services/canvas.service';
import { TabsService } from 'src/app/services/tabs.service';
import { BackgroundPatternsService } from './background-patterns.service';
import { PubSubService } from 'angular7-pubsub';
import { TranslateService } from '@ngx-translate/core';
import { CacheService, CacheStoragesEnum } from 'ng2-cache';
import { LoaderComponent } from 'src/app/essentials/components/loader/loader.component';

@Component({
	selector: '[background-patterns]',
	templateUrl: './background-patterns.component.html',
	styleUrls: ['./background-patterns.component.scss']
})
export class BackgroundPatternsComponent implements OnInit {

	@Input() loadContent;
	@ViewChild("loaderComponent") loaderComponent: LoaderComponent;
	public subTabsData: any;
	public accordianId: any = 0;
	public getCurrentTabName: any;
	currentTab: any = 8;

	public searchText: any;
	public currentPatternId: any;
	public SelectedPatternCat: any;
	public patternCategories: any = [];
	public patternMedia: any = [];
	public patternCategoriesCacheKey: any;
	public patternMediaCacheKey: any;
	public limit: any = 12;
	public showAllFonts: boolean = false;
	public isEnableloadmore: any = false;
	public loadmore: any = 1;
	public priceFormat: any;
	public checkPatternScroll: boolean = false;

	// infinite scroll
	public customPlaceholderArr: any = [];
	public showPlaceholder: boolean;
	public allowPlaceholderLoader;

	@ViewChild('subtabLoader') subtabLoader: LoaderComponent;
	@ViewChild('scrollToBottom') private ScrollContainer: ElementRef;
	@ViewChild('mainSection') private mainSection: ElementRef;
	constructor(
		private cacheService: CacheService,
		private backgroundPatternsService: BackgroundPatternsService,
		private mainService: MainService,
		private canvasService: CanvasService,
		private eventService: PubSubService,
		private translate: TranslateService,
		private tabsService: TabsService,
		public cdr: ChangeDetectorRef
	) {
	}
	ngOnInit() {
		this.patternCategoriesCacheKey = 'patternCategories-' + this.mainService.productId + '-' + this.mainService.baseUrl;
		this.subscribeEvents();
		if (this.loadContent == true) {
			this.getPatterns();
		}
		this.allowPlaceholderLoader = this.mainService.isResponsive;
		this.mainService.prepareTempArrForPlaceholder(this.limit);
	}
	subscribeEvents() {
		this.eventService.$sub('getSubTabs', (mainTabId) => {
			if (mainTabId == this.currentTab && !this.subTabsData) {
				this.getSubTabs(mainTabId);
			}
			this.getCurrentTabName = this.mainService.getAllTabs[this.currentTab]['label'];
		});
		this.eventService.$sub('closeFullView', (showAllFonts) => {
			this.showAllFonts = showAllFonts;
			this.showFonts(this.showAllFonts);
		});
		this.eventService.$sub('backgroundPatternsApplied', (canvas) => {
			let object = this.backgroundPatternsService.fetchPatternObjectFromCanvas(canvas);
			if (object) {
				let self = this;
				if (this.mainService.isResponsive) {
					setTimeout(function () {
						self.tabsService.showChildTabs('patterns');
					}, 500);
				}
				self.eventService.$pub('getActiveTabId', this.currentTab);
			}
		});
		this.eventService.$sub('objectSelectionCleared', () => {
			let object = this.backgroundPatternsService.fetchPatternObjectFromCanvas(this.canvasService.currentCanvas);
			if (object) {
				let self = this;
				setTimeout(function () {
					self.tabsService.showChildTabs('patterns');
				}, 500);
				self.eventService.$pub('getActiveTabId', this.currentTab);
			}
		});
	}
	async getSubTabs(mainTabId) {
		let data = this.mainService.tabsFlow[mainTabId];
		this.subTabsData = this.mainService.setSubTabsData(data, mainTabId);
		if (this.subTabsData && this.subTabsData.length > 0) {
			this.accordianId = this.subTabsData[0].id;
		}
		if (this.loaderComponent && this.loaderComponent.showSubLoader) this.loaderComponent.showSubLoader = false;
	}
	getPatterns() {
		let params = { 'limit': this.limit, 'search': '', 'product_id': this.mainService.productId, 'page': this.loadmore, 'type': 'pattern' },
			url = 'productdesigner/cliparts/getClipartCategories',
			cacheKey: string = this.patternCategoriesCacheKey;
		this.mainService.getData(url, params, cacheKey).then(data => {
			this.cacheService.set(this.patternCategoriesCacheKey, data, { maxAge: 15 * 60 });
			let defaultCacheData = {
				clipart_images: data.default_clipart_images,
				priceFormat: data.priceFormat,
				loadMoreFlag: data.loadMoreFlag,
				page: 1
			};
			let defaultCategoryCacheKey = "patternImages - " + data.default_category_id + this.loadmore + this.limit;;
			this.cacheService.set(defaultCategoryCacheKey, defaultCacheData, { maxAge: 15 * 60 });
			this.processPatternsData(data);
		}).catch(err => console.log(err));
	}

	async processPatternsData(data) {
		this.priceFormat = data.priceFormat;
		this.patternCategories = data.clipArtcategories;
		this.isEnableloadmore = (data.loadMoreFlag == 0) ? false : true;
		this.setImagesData(data.default_clipart_images, true);
		this.currentPatternId = data.default_category_id;
		this.SelectedPatternCat = {
			id: data.default_category_id,
			name: data.default_clipart_label
		};
	}


	changePatternCat(patternCat) {
		this.patternMedia = [];
		this.loadmore = 1;
		this.SelectedPatternCat = patternCat;
		this.currentPatternId = patternCat.id;
		this.patternMediaCacheKey = 'patternMedia' + '-' + patternCat.id + '-' + this.loadmore;
		this.getPatternImages(this.currentPatternId, this.patternMediaCacheKey);
	}
	getPatternImages(patternId, cacheKey = null, searchText = "", resetMedia: boolean = true) {

		// show placeholder loader
		if (this.mainService.isResponsive && !this.showAllFonts)
			this.showPlaceholder = true;
		else
			this.loaderComponent.showSubLoader = true;
		this.cdr.detectChanges();
		// prepare params and url
		let params = {
			'clipart_id': patternId,
			'limit': this.limit,
			'search': searchText,
			'product_id': this.mainService.productId,
			'page': this.loadmore
		}, url = 'productdesigner/cliparts/getClipartImages';
		cacheKey = "patternImages - " + patternId + searchText + this.loadmore + this.limit;

		this.mainService.getData(url, params, cacheKey).then(data => {
			this.cacheService.set(cacheKey, data, { maxAge: 15 * 60 });
			this.processPattersMedia(data, resetMedia);
		}).catch(err => console.log(err));

	}
	processPattersMedia(data, resetMedia) {
		this.priceFormat = data.priceFormat;
		this.isEnableloadmore = (data.loadMoreFlag == 0) ? false : true;
		this.setImagesData(data.clipart_images, resetMedia);
		if (this.loadContent && this.loaderComponent && this.loaderComponent.showMainLoader)
			this.loaderComponent.showSubLoader = false;
		this.showPlaceholder = false;
		if (this.checkPatternScroll && resetMedia === false) {
			this.cdr.detectChanges();
			this.scrollToBottom();
		}
	}
	scrollToBottom(): void {
		try {
			if (!this.mainService.isResponsive)
				this.ScrollContainer.nativeElement.scrollTop = this.ScrollContainer.nativeElement.scrollHeight;
			else if (this.mainService.isResponsive && !this.allowPlaceholderLoader)
				this.mainSection.nativeElement.scrollTop = this.mainSection.nativeElement.scrollHeight;
			else {
				let scrollWidth = this.ScrollContainer.nativeElement.scrollWidth;
				scrollWidth = scrollWidth - ((scrollWidth * 25) / 100);
				this.ScrollContainer.nativeElement.scrollLeft = scrollWidth;
			}
		} catch (err) { }
	}
	setImagesData(ImgData, resetMedia) {
		if (resetMedia === true) this.patternMedia = [];
		for (let i = 0; i < ImgData.length; i++) {
			this.patternMedia.push(ImgData[i]);
		}
		if (this.loadContent && this.loaderComponent && this.loaderComponent.showSubLoader) {
			this.loaderComponent.showSubLoader = false;
			this.cdr.detectChanges();
		}
	}
	getNumberArray(value: number) {
		var items: number[] = [];
		for (var i = 1; i <= value; i++) {
			items.push(i);
		}
		return items;
	}
	showFonts(showAllFonts) {
		this.showAllFonts = !showAllFonts;
		this.allowPlaceholderLoader = showAllFonts;
		this.eventService.$pub('showFonts', { showAllFonts: this.showAllFonts, title: 'Background Patterns' });
	}
	loadMorePattern() {
		this.loadmore++;
		this.patternMediaCacheKey = 'patternMedia' + '-' + this.currentPatternId;
		this.cacheService.set(this.patternMediaCacheKey, '');
		this.checkPatternScroll = true;
		this.getPatternImages(this.currentPatternId, this.patternMediaCacheKey, this.searchText, false);
	}

	addPatternToCanvas(img) {
		let params = {
			backgroundImage: img
		};
		this.backgroundPatternsService.applyPattern(params);
	}
	redirectToUpload() {
		this.mainService.processToolTip('forceClose');
		this.mainService.forceDisableTooltip = true;
		this.eventService.$pub('getActiveTabId', 3);
	}

	searchPattern($event) {
		if (!$event || !$event.target || !$event.target.value) {
			this.loadmore = 1;
		};
		this.searchText = $event.target.value.toString();
		this.getPatternImages(this.currentPatternId, null, this.searchText);
	}

}
