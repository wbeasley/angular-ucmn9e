import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { MainService } from 'src/app/services/main.service';
import { CanvasService } from 'src/app/services/canvas.service';
import { CacheService, CacheStoragesEnum } from 'ng2-cache';
import { PubSubService } from 'angular7-pubsub';
import { TabsService } from 'src/app/services/tabs.service';

@Component({
	selector: 'tabs',
	templateUrl: './tabs.component.html',
	styleUrls: ['./tabs.component.scss']
})

export class TabsComponent implements OnInit {

	public mainTabs: any = [];
	public tabsDataCacheKey: any;
	public allTabsDataCacheKey: any;
	public responsiveClass: any;
	public totalTabClass: any;
	public title: string = '';
	public toggleIntro: boolean = true;
	activeTabId: any;
	showAllFonts: any;
	tooltipData: any = [];
	introTabId: any = 0;

	fullViewCloseIcon: boolean = true;
	constructor(
		public mainService: MainService,
		public canvasService: CanvasService,
		private cacheService: CacheService,
		private pubsub: PubSubService,
		private tabsService: TabsService,
		public cdr: ChangeDetectorRef
	) {
		this.tabsDataCacheKey = 'tabsData' + this.mainService.productId + '-' + this.mainService.baseUrl;
		this.allTabsDataCacheKey = 'allTabsData' + this.mainService.productId + '-' + this.mainService.baseUrl;
		this.toggleResponsiveClass(false);
		this.pubsub.$sub('windowResize', () => {
			this.toggleResponsiveClass(true);
		});
		this.pubsub.$sub('objectSelectionCleared', () => {
			if (this.mainService.isResponsive && this.activeTabId != 6 && !this.canvasService.currentCanvas.backgroundColor) {
				this.closeTab();
			} else if (this.mainService.isResponsive && this.activeTabId == 6 && !this.canvasService.currentCanvas.backgroundColor) {
				this.tabsService.backTab();
			}
		});
		this.pubsub.$sub('backgroundPatternsApplied', () => {
			if (!this.canvasService.currentCanvas.backgroundColor) {
				if (this.mainService.isResponsive) {
					this.closeTab();
				}
			}
		});
		this.pubsub.$sub('closeTab', () => {
			this.toggleIntro = true;
			this.closeTab();
		});

		this.pubsub.$sub('showFonts', (resp) => {
			this.showAllFonts = resp.showAllFonts;
			this.title = resp.title;
			this.fullViewCloseIcon = true;
			if(resp.hasOwnProperty('preventCloseIcon') && resp.preventCloseIcon == true) {
				this.fullViewCloseIcon = false;
			}

		});
		this.pubsub.$sub('toggleResponsiveClass', () => {
			this.toggleResponsiveClass(true);
		});
	}

	getSelectedObjTabId(obj) {
		obj = (obj && Array.isArray(obj)) ? obj[0] : obj;
		if (!obj) {
			return 0;
		}
		let tab = obj.tab, tabId: number = 0;
		switch (tab) {
			case 'text':
				tabId = 1;
				break;
			case 'clipart':
				tabId = 2;
				break;
			case 'upload':
				tabId = 3;
				break;
			case 'namenumber':
				tabId = 6;
				break;
		}
		return tabId;
	}

	ngOnInit() {
		this.getTabs();
		let self = this;

		this.pubsub.$sub('objectSelectionCreated', (obj) => {
			obj = (obj && obj.hasOwnProperty('_objects') && obj._objects && obj._objects.length) ? obj._objects : obj;
			let id = this.getSelectedObjTabId(obj);
			let self = this;
			if (id != 0) {
				this.activeTabId = this.getTabId(id);
				setTimeout(() => {
					self.pubsub.$pub('activeTabOnLoadDesign', id);
					if (self.mainService.isResponsive) {
						setTimeout(() => {

							this.toggleResponsiveClass(true);
						}, 100);
					}
				}, 500);
			}
		});

		this.pubsub.$sub('getActiveTabId', (id) => {
			if (id != "" && id != 0) {
				self.activeTabId = self.getTabId(id);
			} else {
				/*For Tooltip enable*/
				self.activeTabId = 0;
			}
		});

		this.pubsub.$sub('introTabActive', (id) => {
			self.activeTabId = self.getTabId(id);
			self.introTabId = id;
		});
		this.pubsub.$sub('imageSideChanged', () => {
			this.toggleResponsiveClass(true);
		});
		this.pubsub.$sub('objectRemoved', () => {
			this.toggleResponsiveClass(true);
		});
		this.pubsub.$sub('allcanvasCreated', () => {
			this.toggleResponsiveClass(true);
		});
	}
	ngAfterViewInit() {
		this.toggleResponsiveClass(true);
	}

	getTabId(findId) {
		let response = 0;
		this.mainService.tabsFlow.forEach(function (object, index) {
			object.forEach(function (subObj, inx) {
				if (subObj == findId) {
					response = index;
				}
			});
		});
		return response;
	}

	getTabs() {
		let params = { 'product_id': this.mainService.productId, 'isAdmin': this.mainService.isAdmin }, url = 'productdesigner/Tabs/getTabs', cacheKey: string = this.tabsDataCacheKey;
		this.mainService.getData(url, params, cacheKey).then(data => {
			this.cacheService.set(this.tabsDataCacheKey, data, { maxAge: 15 * 60 });
			this.setTabsData(data);
		}).catch(err => console.log(err));


	}
	async fetchTabData(index, currentTab: any) {
		this.closeFullView(true);
		this.toggleResponsiveClass(true);
		this.tabsService.backTab();
		this.cdr.detectChanges();
		this.activeTabId = currentTab;
		this.pubsub.$pub('getSubTabs', currentTab);
		let self = this;
		if (this.introTabId > 0) {
			setTimeout(() => {
				self.pubsub.$pub('introTabActive', self.introTabId);
				self.introTabId = 0;
			}, 50);
		}
	}
	setTabsData(data) {
		this.mainService.getAllTabs = data.allTabsData;
		this.mainService.productTooltipData = data.productTooltipData;
		let self = this;

		/*Tabs Flow*/
		let keys = Object.keys(data.subTabsData);
		for (var i = 0; i < Object.keys(data.subTabsData).length; i++) {
			this.mainService.tabsFlow[keys[i]] = data.subTabsData[keys[i]];
		}

		setTimeout(function () {
			self.pubsub.$pub('getSubTabs', data.tabsData[0]);
			self.pubsub.$pub('tabsDataFetched');
		}, 500);

		this.mainTabs = data.tabsData;
		let tempData = [];
		let allTabs = this.mainService.getAllTabs;
		for (var i = 0; i < this.mainTabs.length; i++) {
			if (this.mainTabs[i] == allTabs[this.mainTabs[i]]['id']) {
				tempData.push({ id: allTabs[this.mainTabs[i]]['id'], label: allTabs[this.mainTabs[i]]['custom_label'], component: allTabs[this.mainTabs[i]]['component'], isAdmin: allTabs[this.mainTabs[i]]['is_admin'] });
			}
		}

		if (data.tooltipStatus != 0 && !this.mainService.isAdmin) {
			this.activeTabId = 0;
		} else if (!this.mainService.isResponsive) {
			this.activeTabId = data.tabsData[0];
		}

		this.mainTabs = tempData;
		this.totalTabClass = 'nav-item-' + this.mainTabs.length;
	}

	toggleResponsiveClass(add: any) {
		if (add && this.mainService.isResponsive) {
			this.responsiveClass = 'byi-idea-mob';
		} else {
			this.responsiveClass = '';
		}
	}

	closeTab() {
		this.toggleResponsiveClass(false);
		// There is no tab ID equals 0 so it will close the tab
		this.activeTabId = 0;
		this.tabsService.backTab();
	}
	closeFontFamilyView() {
		this.pubsub.$pub('closeFullView', true);
	}
	closeFullView(showAllFonts) {
		this.pubsub.$pub('closeFullView', showAllFonts);
	}
}
