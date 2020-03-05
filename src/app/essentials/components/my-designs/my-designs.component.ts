import { CacheService } from 'ng2-cache';
import { LoaderComponent } from './../loader/loader.component';
import { Component, OnInit, ViewChild, ChangeDetectorRef, Input, ElementRef } from '@angular/core';
import { MainService } from 'src/app/services/main.service';
import { DesignService } from 'src/app/services/design.service';
import { PubSubService } from 'angular7-pubsub';
import Swal from 'sweetalert2';
@Component({
	selector: '[my-designs]',
	templateUrl: './my-designs.component.html',
	styleUrls: ['./my-designs.component.scss']
})
export class MyDesignsComponent implements OnInit {
	public subTabsData: any;
	getCurrentTabName: any;
	currentTab: any = 5;
	customerId: any;
	customerDesigns: any = [];
	searchText: any = '';
	page: any = '1';
	componentHide: any = true;
	isEnableloadmore: boolean = false;
	totalpages: any;
	public accordianId: any = 0;
	public checkDesignScroll: boolean = false;
	limit: any = 12;
	getDesignResponse: boolean = true;
	// Loader
	@ViewChild('loaderComponent') loaderComponent: LoaderComponent;
	@ViewChild('subtabLoader') subtabLoader: LoaderComponent;
	@ViewChild('scrollToBottom') private ScrollContainer: ElementRef;

	@Input() loadContent;

	// Infinite Scroll
	public showPlaceholder: boolean;
	public cacheKey: string;

	/**
	 * 
	 * @param mainService 
	 * @param designService 
	 * @param pubsub 
	 * @param cdr 
	 * @param cacheService 
	 */
	constructor(
		public mainService: MainService,
		private designService: DesignService,
		private pubsub: PubSubService,
		private cdr: ChangeDetectorRef,
		private cacheService: CacheService
	) {
		this.pubsub.$sub('getSubTabs', (mainTabId) => {
			if (mainTabId == this.currentTab && !this.subTabsData) {
				this.getSubTabs(mainTabId);
			}
			this.getCurrentTabName = this.mainService.getAllTabs[this.currentTab]['label'];
		});

	}

	ngOnInit() {
		this.initValues();
		if (this.loadContent && this.loadContent == true) {
			this.subscribeEvents();
		}
		this.mainService.prepareTempArrForPlaceholder(this.limit);
		this.pubsub.$sub('closeFullView', (showAllFonts) => {
			this.showAllFonts = showAllFonts;
			this.showFonts(showAllFonts);
		});
	}

	ngAfterViewInit() {
		this.mainService.showHideSubLoader(this.subtabLoader, true);
		this.showPlaceholder = this.mainService.showHidePlaceholder(this.showPlaceholder);
		this.cdr.detectChanges();
		if (this.mainService.userLoggedIn != true) {
			this.mainService.showHideSubLoader(this.subtabLoader, true);
			this.showPlaceholder = this.mainService.showHidePlaceholder(this.showPlaceholder);
		}
	}

	initValues() {
		this.customerId = null;
		this.customerDesigns = [];
		this.isEnableloadmore = false;
		this.totalpages = 0;
		this.checkDesignScroll = false;
	}

	subscribeEvents() {
		let self = this;
		this.pubsub.$sub('designSaved', (design) => {
			if (!this.mainService.userLoggedIn) return;
			if (design && design.hasOwnProperty('clearCache') && design.clearCache == true) {
				this.cacheService.remove(this.cacheKey);
				this.cdr.detectChanges();
				this.getDesigns();
			}
			let data = [];
			data['id'] = design[0].designId;
			data['product_id'] = design[0].product_id;
			data['path'] = design[0].images.base.url;
			data['title'] = design[0].title;
			self.customerDesigns.push(data);
		});
		this.pubsub.$sub('customerLoggedIn', () => {
			this.cdr.detectChanges();
			this.getDesigns(true, true, true);
		});
		this.pubsub.$sub('customerLoggedOut', () => {
			this.initValues();
		});
	}

	/**
	 * 
	 * @param resetDesign 
	 */
	getDesigns(resetDesign: boolean = true, initLoad: boolean = false, waitForResponse: boolean = false) {
		if (this.loadContent) {
			this.mainService.showHideSubLoader(this.loaderComponent, true);
			this.showPlaceholder = this.mainService.showHidePlaceholder(false);
		}
		let params = {
			'product_id': this.mainService.productId,
			'searchText': this.searchText,
			'page': this.page,
			'limit': this.limit
		},
			url = 'productdesigner/designs/getdesigns';
		this.cacheKey = 'getDesigns' + this.searchText + this.page + this.mainService.baseUrl + this.mainService.loggedInUserId;

		if (waitForResponse == true) {
			this.cacheKey = null;
		}

		this.mainService.getData(url, params, this.cacheKey).then((designData: any) => {
			if (resetDesign) this.customerDesigns = [];
			this.customerId = designData.customer_id;
			this.customerDesigns = this.customerDesigns.concat(designData.getMyDesigns);
			this.isEnableloadmore = (designData.loadMoreFlag == 0) ? false : true;
			this.totalpages = designData.totalpages;
			this.checkDesignScroll = true;
		}).catch(err => console.log(err))
			.finally(() => {
				if (this.subtabLoader.showSubLoader) this.subtabLoader.showSubLoader = false;
				if (this.loaderComponent.showSubLoader) this.loaderComponent.showSubLoader = false;
				this.showPlaceholder = false;
				this.cdr.detectChanges();
				if (resetDesign === false) this.scrollToBottom();
			});
	}

	scrollToBottom(): void {
		try {
			if (!this.mainService.isResponsive)
				this.ScrollContainer.nativeElement.scrollTop = this.ScrollContainer.nativeElement.scrollHeight;
			else
				this.ScrollContainer.nativeElement.scrollLeft = (this.ScrollContainer.nativeElement.scrollWidth - 300);
		} catch (err) { }
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

	/**
	 * 
	 * @param id 
	 * @param index 
	 */
	deleteDesign(id, index) {
		Swal.fire({
			title: 'Are you sure?',
			text: "Your design will be deleted permanently!",
			type: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, delete it!',
			allowOutsideClick: false
		}).then((result) => {
			if (result.value) {
				this.customerDesigns.splice(index, 1);
				let params = { 'design_id': id },
					url = 'productdesigner/designs/deletedesign';
				this.mainService.post(url, params, true).then(designData => {
					this.cacheService.remove(this.cacheKey);
				}).catch(err => console.log(err));
			}
		});
	}

	
	loadMoreDesigns() {
		this.page++;
		this.getDesigns(false);
		if (this.page == this.totalpages)
			this.isEnableloadmore = false;

	}

	searchDesigns() {
		if (!this.mainService.userLoggedIn) return;
		this.customerDesigns = [];
		this.page = 1;
		this.getDesigns();
	}

	loadDesign(designId) {
		this.designService.loadDesign(btoa(designId));
	}

	login() {
		this.pubsub.$pub('openLoginModal', false);
	}

	getDefaultImage(currentObj) {
		let found = this.customerDesigns.find((customDesignObj) => (customDesignObj.id == currentObj.id && customDesignObj.product_id && currentObj.product_id));
		found.path = this.mainService.defaultPlaceholderImage;
		this.customerDesigns[this.customerDesigns.indexOf(found)] = found;
	}

	showAllFonts: boolean = false;
	showFonts(showAllFonts) {
		this.showAllFonts = !showAllFonts;
		this.pubsub.$pub('showFonts', { showAllFonts: this.showAllFonts, title: 'Show all Designs' });
	}
}
