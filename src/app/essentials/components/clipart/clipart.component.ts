import { LoaderComponent } from './../loader/loader.component';
import { Component, OnInit, ViewChild, Input, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CacheService, CacheStoragesEnum } from 'ng2-cache';
import { MainService } from 'src/app/services/main.service';
import { TabsService } from 'src/app/services/tabs.service';
import { PubSubService } from 'angular7-pubsub';
import { AddImageService } from 'src/app/services/add-image.service';
import { FormatCurrency } from 'src/app/_helper/formatCurrency';
import { CanvasService } from 'src/app/services/canvas.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { PlacholderLoaderService } from '../placeholder-loader/placholder-loader.service';
declare const fabric: any;

@Component({
	selector: '[clipart]',
	templateUrl: './clipart.component.html',
	styleUrls: ['./clipart.component.scss']
})
export class ClipartComponent implements OnInit {
	public clipartCategoriesCacheKey: any = "";
	public clipArtcategories: any = [];
	public subTabsData: any;
	public getCurrentTabName: any;
	public SelectedClipartCat: any;
	public clipArtmedia: any = [];
	public clipArtmediaCacheKey: any;
	public limit: any = 12;
	public loadmore: any = 1;
	public isEnableloadmore: any = false;
	public currentClipArtId: any;
	public tempData: any = [];
	public finalArray: any = [];
	public currentTab: any = 2;
	public accordianId: any = 0;
	public priceFormat: any;
	public clipartAlert: any;
	public clipartHtml: any = "";
	public checkClipartScroll: boolean = false;
	public searchText: any = "";
	showAllFonts: boolean = false;
	@Input() loadContent;
	// Loader
	@ViewChild('loaderComponent') loaderComponent: LoaderComponent;
	@ViewChild('subtabLoader') subtabLoader: LoaderComponent;
	@ViewChild('scrollToBottom') private ScrollContainer: ElementRef;
	@ViewChild('mainSection') private mainSection: ElementRef;

	// infinite scroll
	public customPlaceholderArr: any = [];
	public showPlaceholder: boolean;
	public allowPlaceholderLoader;

	constructor(
		private cacheService: CacheService,
		public mainService: MainService,
		public pubsub: PubSubService,
		private translate: TranslateService,
		private addImageService: AddImageService,
		public tabsService: TabsService,
		public canvasService: CanvasService,
		public cdr: ChangeDetectorRef,
		public placholderLoaderService: PlacholderLoaderService
	) {

	}

	/**
	 * 
	 * @param mainTabId 
	 */
	async getSubTabs(mainTabId) {
		let data = this.mainService.tabsFlow[mainTabId];
		this.subTabsData = this.mainService.setSubTabsData(data, mainTabId);
		if (this.subTabsData && this.subTabsData.length > 0) {
			this.accordianId = this.subTabsData[0].id;
		}
		if (this.subtabLoader && this.subtabLoader.showSubLoader) this.subtabLoader.showSubLoader = false;
	}


	ngOnInit() {
		this.pubsub.$sub('displayClipartLimitError', () => {
			this.displayClipartLimitError();
		});
		this.pubsub.$sub('getSubTabs', (mainTabId) => {
			if (mainTabId == this.currentTab && !this.subTabsData) {
				this.getSubTabs(mainTabId);
			}
			this.getCurrentTabName = this.mainService.getAllTabs[this.currentTab]['label'];
		});
		this.clipartCategoriesCacheKey = 'clipartCategories-' + this.mainService.productId + '-' + this.mainService.baseUrl;
		this.subscribeEvents();

		if (this.loadContent == true) {
			this.getCliparts();
			if (!this.pubsub.events.addClipartImage) {
				this.pubsub.$sub('addClipartImage', (data) => {
					this.addClipartToCanvas(data.img, data.price, data);
				});
			}
		}

		this.pubsub.$sub('closeFullView', (showAllFonts) => {
			this.showAllFonts = showAllFonts;
			this.showFonts(this.showAllFonts);
		});
		this.allowPlaceholderLoader = this.mainService.isResponsive;
		this.mainService.prepareTempArrForPlaceholder(this.limit);


	}


	ngAfterViewInit() {
		this.cdr.detectChanges();
		if (!this.loadContent) this.subtabLoader.showSubLoader = true;
		if (this.loadContent) {
			this.loaderComponent.showSubLoader = true;
		}
		this.cdr.detectChanges();
	}

	subscribeEvents() {
		this.pubsub.$sub('objectSelectionUpdated', (obj) => {
			if (obj.tab == 'clipart') {
				if (this.mainService.isResponsive) {
					this.pubsub.$pub('getActiveTabId', this.currentTab);
					let self = this;
					setTimeout(function () {
						let currentSelectedObj = self.canvasService.getActiveObjectFromAllCanvases();
						if (currentSelectedObj && currentSelectedObj.tab == obj.tab) {
							self.tabsService.showChildTabs('clipart');
						}
					}, 100)
				} else {
					this.pubsub.$pub('getActiveTabId', this.currentTab);
				}

			}
		});
		this.pubsub.$sub('objectSelectionCreated', (obj) => {
			let showSubChilds: boolean = false, childTabs;
			if (obj.type == 'activeSelection') {
				let nonClipartObj = obj._objects.indexOf(obj._objects.find(currObj => currObj.tab == 'clipart'));
				if (nonClipartObj != -1) {
					showSubChilds = true;
					let findNonImgObj = (obj._objects.indexOf(obj._objects.find(currObj => currObj.objType != 'image')) >= 0) ? true : false,
						findNonSvg = (obj._objects.indexOf(obj._objects.find(currObj => currObj.isSvg != true)) >= 0) ? true : false,
						findNonPng = (obj._objects.indexOf(obj._objects.find(currObj => currObj.isSvg == true)) >= 0) ? true : false;
					if (!findNonImgObj && (findNonSvg && !findNonPng) || (findNonPng && !findNonSvg)) {
						childTabs = 'clipart';
					} else {
						childTabs = 'common';
					}
				}
			}
			else if (obj.tab == 'clipart') {
				showSubChilds = true;
				childTabs = 'clipart';
			}
			if (showSubChilds == true) {
				if (this.mainService.isResponsive) {

					let self = this;
					setTimeout(function () {
						let currentSelectedObj = self.canvasService.getActiveObjectFromAllCanvases();
						if (currentSelectedObj && currentSelectedObj.tab == obj.tab) {
							self.tabsService.showChildTabs('clipart');
						}
					}, 100)
				}
				this.pubsub.$pub('getActiveTabId', this.currentTab);
			}
		});
		this.pubsub.$sub('objectRemoved', (obj) => {
			if (obj.tab == 'clipart') {
				this.pubsub.$pub('getActiveTabId', this.currentTab);
			}
		});
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

	/**
	 * 
	 * @param price 
	 */
	formatCurrency(price: any) {
		if (price != null) {
			return FormatCurrency(price, this.priceFormat, '');
		}
	}

	getCliparts() {
		this.mainService.clipartRequest = false;
		let params = { 'limit': this.limit, 'search': '', 'product_id': this.mainService.productId, 'page': this.loadmore, 'type': 'clipart' },
			url = 'productdesigner/cliparts/getClipartCategories',
			cacheKey: string = this.clipartCategoriesCacheKey;
		this.mainService.getData(url, params, cacheKey).then(data => {
			this.mainService.clipartRequest = true;
			this.cacheService.set(this.clipartCategoriesCacheKey, data, { maxAge: 15 * 60 });
			let defaultCacheData = {
				clipart_images: data.default_clipart_images,
				priceFormat: data.priceFormat,
				loadMoreFlag: data.loadMoreFlag,
				page: 1
			};
			let defaultCategoryCacheKey = "clipartImages - " + data.default_category_id + this.loadmore + this.limit;;
			this.cacheService.set(defaultCategoryCacheKey, defaultCacheData, { maxAge: 15 * 60 });
			this.processClipartsData(data);
		}).catch(err => console.log(err));
	}

	/**
	 * 
	 * @param value 
	 */
	getNumberArray(value: number) {
		var items: number[] = [];
		for (var i = 1; i <= value; i++) {
			items.push(i);
		}
		return items;
	}

	/**
	 * 
	 * @param data 
	 */
	async processClipartsData(data) {
		this.priceFormat = data.priceFormat;
		this.clipArtcategories = data.clipArtcategories;
		this.isEnableloadmore = (data.loadMoreFlag == 0) ? false : true;
		this.setImagesData(data.default_clipart_images, true);
		this.currentClipArtId = data.default_category_id;
		this.SelectedClipartCat = {
			id: data.default_category_id,
			name: data.default_clipart_label
		};
		// this.clipartLimitEnable = data.clipart_limit;
		this.canvasService.objectLimit = Object.assign(this.canvasService.objectLimit, { clipartLimitEnable: parseInt(data.clipart_limit) });
		this.canvasService.objectLimit = Object.assign(this.canvasService.objectLimit, { clipartImageLimit: parseInt(data.clipart_upload_limit) });
		this.clipartAlert = data.clipart_alert;
	}

	/**
	 * 
	 * @param ImgData 
	 */
	setImagesData(ImgData, resetMedia) {
		if (resetMedia === true) this.clipArtmedia = [];
		for (let i = 0; i < ImgData.length; i++) {
			this.clipArtmedia.push(ImgData[i]);
		}
		this.pubsub.$pub('fileUploaded');
		if (this.loadContent && this.loaderComponent && this.loaderComponent.showSubLoader) {
			this.loaderComponent.showSubLoader = false;
			this.cdr.detectChanges();
		}
	}

	/**
	 * 
	 * @param data 
	 */
	processClipartsMedia(data, resetMedia) {
		this.priceFormat = data.priceFormat;
		this.isEnableloadmore = (data.loadMoreFlag == 0) ? false : true;
		this.setImagesData(data.clipart_images, resetMedia);
		if (this.loadContent && this.loaderComponent && this.loaderComponent.showMainLoader)
			this.loaderComponent.showSubLoader = false;
		this.showPlaceholder = false;
		if (this.checkClipartScroll && resetMedia === false) {
			this.cdr.detectChanges();
			this.scrollToBottom();
		}
	}

	/**
	 * 
	 * @param $event 
	 */
	searchCliprt($event) {
		if (!$event || !$event.target || !$event.target.value) {
			this.loadmore = 1;
		};
		this.searchText = $event.target.value.toString();
		this.getClipArtImages(this.currentClipArtId, null, this.searchText);
	}

	/**
	 * get clipart by category or by search
	 * 
	 * @param clipartId 
	 * @param cacheKey 
	 * @param searchText 
	 */
	getClipArtImages(clipartId, cacheKey = null, searchText = "", resetMedia: boolean = true) {

		// show placeholder loader
		if (this.mainService.isResponsive && !this.showAllFonts)
			this.showPlaceholder = true;
		else
			this.loaderComponent.showSubLoader = true;
		this.cdr.detectChanges();
		// prepare params and url
		let params = {
			'clipart_id': clipartId,
			'limit': this.limit,
			'search': searchText,
			'product_id': this.mainService.productId,
			'page': this.loadmore
		}, url = 'productdesigner/cliparts/getClipartImages';
		cacheKey = "clipartImages - " + clipartId + searchText + this.loadmore + this.limit;

		// if cahcekey is not null that means user has changed clipart category		
		this.mainService.getData(url, params, cacheKey).then(data => {
			this.cacheService.set(cacheKey, data, { maxAge: 15 * 60 });
			this.processClipartsMedia(data, resetMedia);
		}).catch(err => console.log(err));

	}

	/**
	 * 
	 * @param clipArtCat 
	 */
	changeClipartCat(clipArtCat) {
		this.clipArtmedia = [];
		this.loadmore = 1;
		this.clipartHtml = "";
		this.SelectedClipartCat = clipArtCat;
		this.currentClipArtId = clipArtCat.id;
		this.clipArtmediaCacheKey = 'clipartMedia' + '-' + clipArtCat.id + '-' + this.loadmore;
		this.getClipArtImages(this.currentClipArtId, this.clipArtmediaCacheKey);
	}

	loadMoreClipArt() {
		this.loadmore++;
		this.clipArtmediaCacheKey = 'clipartMedia' + '-' + this.currentClipArtId;
		this.cacheService.set(this.clipArtmediaCacheKey, '');
		this.checkClipartScroll = true;
		this.getClipArtImages(this.currentClipArtId, this.clipArtmediaCacheKey, this.searchText, false);
	}

	/**
	 * 
	 * @param img 
	 * @param clipartPrice 
	 */
	addClipartToCanvas(img, clipartPrice, data) {
		let properties: any = { tab: 'clipart', price: clipartPrice };
		if (data.canvas) {
			properties.canvas = data.canvas;
		}
		this.addImageService.addImage(img, properties);
		this.showFonts(true);
	}

	displayClipartLimitError() {
		Swal.fire({
			title: this.translate.instant('Error'),
			text: this.translate.instant(this.clipartAlert),
			type: "warning",
			confirmButtonText: this.translate.instant('OK'),
		});
	}

	/**
	 * 
	 * @param showAllFonts 
	 */
	showFonts(showAllFonts) {
		this.showAllFonts = !showAllFonts;
		this.allowPlaceholderLoader = showAllFonts;
		this.pubsub.$pub('showFonts', { showAllFonts: this.showAllFonts, title: 'Clipart' });
	}

	/**
	 * 
	 * @param currentObj 
	 */
	getDefaultImage(currentObj) {
		let found = this.clipArtmedia.find((clipartMediaObj) => (clipartMediaObj.image_id == currentObj.image_id && clipartMediaObj.clipart_id && currentObj.clipart_id));
		found.image_path = found.medium_url;
		this.clipArtmedia[this.clipArtmedia.indexOf(found)] = found;
	}
}
