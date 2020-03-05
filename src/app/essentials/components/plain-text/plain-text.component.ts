import { FontService } from './../font/font.service';
import { Component, OnInit, Input, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CanvasService } from 'src/app/services/canvas.service';
import { MainService } from 'src/app/services/main.service';
import { TabsService } from 'src/app/services/tabs.service';
import { PubSubService } from 'angular7-pubsub';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { LoaderComponent } from './../loader/loader.component';

declare var fabric: any;

@Component({
	selector: '[plain-text]',
	templateUrl: './plain-text.component.html',
	styleUrls: ['./plain-text.component.scss']
})
export class PlainTextComponent implements OnInit {
	public subTabsData: any;
	canvasText: any;
	showGreenTick: true;
	getCurrentTabName: any;
	defaultFontFamily: any;
	defaultFontSize: any;
	defaultColor: any;
	textLimitEnable: any;
	limitAlert: any;
	currentTab: any = 1;
	public accordianId: any = 0;
	@Input() loadContent;
	@ViewChild("loaderComponent") loaderComponent: LoaderComponent;
	public textInput: HTMLElement;

	constructor(
		private mainService: MainService,
		public fontService: FontService,
		private canvasService: CanvasService,
		private eventService: PubSubService,
		private translate: TranslateService,
		private tabsService: TabsService,
		public cdr: ChangeDetectorRef
	) {
		this.eventService.$sub('getSubTabs', (mainTabId) => {
			if (mainTabId == this.currentTab && !this.subTabsData) {
				this.getSubTabs(mainTabId);
			}
			this.getCurrentTabName = this.mainService.getAllTabs[this.currentTab]['label'];
		});
	}

	ngOnInit() {
		if (this.loadContent && this.loadContent == true) {
			this.loaderComponent.showSubLoader = false;
			this.init();
		} else {
			this.loaderComponent.showSubLoader = true;
			this.cdr.detectChanges();
		}
	}

	async init() {
		this.subscribeEvents();
		if (!this.fontService.fontarr || this.fontService.fontarr.length <= 0) {
			this.loaderComponent.showSubLoader = true;
			this.cdr.detectChanges();
			if (!this.fontService.fontLoadRequested)
				await this.fontService.getFonts(1, true);
			else
				this.loaderComponent.showSubLoader = false;
		}
		if (this.fontService.fontarr && this.fontService.fontarr.length > 0) {
			if (this.loaderComponent.showSubLoader === true)
				this.loaderComponent.showSubLoader = false;
			this.prepareFontValues();
		}

		this.getColors();
	}

	ngAfterViewInit() {
		let ele = document.getElementById('textInput');
		if (ele && ele.id) this.textInput = ele;
	}

	prepareFontValues() {
		this.defaultFontFamily = Object.assign({}, this.fontService.defaultFontFamily);
		this.defaultFontSize = this.fontService.defaultFontSize;
		this.textLimitEnable = this.fontService.textLimitEnable;
		this.canvasService.objectLimit = Object.assign(this.canvasService.objectLimit, { textLimitCounter: parseInt(this.fontService.textLimitCounter) });
		this.canvasService.objectLimit = Object.assign(this.canvasService.objectLimit, { textLimitEnable: parseInt(this.fontService.textLimitEnable) });
		this.limitAlert = this.fontService.limitAlert;
		this.initData();
	}

	getColors() {
		if (!this.defaultColor) {
			this.defaultColor = this.mainService.colorData.defaultColor;
		}
		this.eventService.$sub('getColors').subscribe(colorData => {
			this.defaultColor = colorData.defaultColor;
		}, err => console.log(err));
	}

	subscribeEvents() {
		this.eventService.$sub('displayTextLimitError', () => {
			this.displayTextLimitError();
		});
		this.eventService.$sub('objectSelectionCleared', () => {
			this.initData();
		});
		this.eventService.$sub('objectSelectionCreated', (obj) => {
			// for mobile
			let selectedObjs = this.mainService.canvasService.currentCanvas.getActiveObjects(),
				self = this;
			if (selectedObjs.length > 1 && this.mainService.isResponsive) {
				let anyTextObj = (obj._objects.indexOf(obj._objects.find(currObj => (currObj.type == 'text' || currObj.type == 'textbox'))) >= 0) ? true : false,
					nonTextObj = (obj._objects.indexOf(obj._objects.find(currObj => (currObj.type != 'text' && currObj.type != 'textbox'))) >= 0) ? true : false;
				if (anyTextObj) {
					let tabName = (nonTextObj) ? 'common' : 'plain-text';
					setTimeout(function () {
						self.showChild(tabName);
					}, 100);
					this.eventService.$pub('getActiveTabId', this.currentTab);
				}
			} else {
				if (obj.tab == 'text') {
					
					this.canvasText = obj.text;
					if (this.mainService.isResponsive) {
						this.tabsService.backTab();
						this.eventService.$pub('getActiveTabId', this.currentTab);
						this.showGreenTick = ((obj.type == "text" || obj.type == "quoteText") && obj.ultimatelock == true) ? null : true;
					} else {
						if (this.textInput) this.textInput.focus();
						this.eventService.$pub('getActiveTabId', this.currentTab);
					}

				} else {
					
					this.canvasText = '';
				}
			}

		});
		this.eventService.$sub('objectSelectionUpdated', (obj) => {
			if (obj.tab == 'text') {
				
				this.canvasText = obj.text;
				if (this.mainService.isResponsive) {
					this.tabsService.backTab();
					this.eventService.$pub('getActiveTabId', this.currentTab);
					this.showGreenTick = ((obj.type == "text" || obj.type == "quoteText") && obj.ultimatelock == true) ? null : true;
				} else {
					if (this.textInput) this.textInput.focus();
					this.eventService.$pub('getActiveTabId', this.currentTab);
				}

			} else {
				
				this.canvasText = '';
			}
		});
		this.eventService.$sub('objectUpdated', (obj) => {
			obj = (Array.isArray(obj)) ? obj[0] : obj;
			if(obj.type == 'textbox') {
				this.canvasText = obj.text;
			}
		});
		this.eventService.$sub('objectRemoved', (obj) => {
			if (obj.tab == 'text' && obj.type == 'text') {
				this.eventService.$pub('getActiveTabId', this.currentTab);
			}
		});
		this.eventService.$sub('imageSideChanged', () => {
			this.initData();
		});
		this.eventService.$sub('fontDataLoaded', () => {
			if (!this.defaultFontFamily) {
				this.prepareFontValues();
			}
		});

	}

	initData() {
		
		this.canvasText = (this.canvasService.getActiveObjectValue('text', 'text') != false) ? this.canvasService.getActiveObjectValue('text', 'text') : '';
		if(this.canvasText == '') {
			
			this.canvasText = (this.canvasService.getActiveObjectValue('textbox', 'text') != false) ? this.canvasService.getActiveObjectValue('textbox', 'text') : '';
		}
	}

	async getSubTabs(mainTabId) {
		let data = this.mainService.tabsFlow[mainTabId];
		this.subTabsData = this.mainService.setSubTabsData(data, mainTabId);
		if (this.subTabsData && this.subTabsData.length > 0) {
			this.accordianId = this.subTabsData[0].id;
		}
		if (this.loaderComponent && this.loaderComponent.showSubLoader) this.loaderComponent.showSubLoader = false;
	}

	addText() {

		let obj = this.canvasService.getActiveObject(), properties: any = {};

		if ((this.canvasText.length == 0 && !obj) || obj.text == this.canvasText) {
			return;
		}
		if (this.canvasText.length == 0 && obj) {
			let params = {
				obj: obj,
				properties: properties,
				crudServiceString: 'this.removeObjectService',
			};
			this.canvasService.objectCRUD(params);
			return;
		}

		if (obj && obj.tab == 'text') {
			properties.text = this.canvasText;
			let params = {
				obj: obj,
				properties: properties,
				crudServiceString: 'this.updateObjectService',
			};
			this.canvasService.objectCRUD(params);
		}
		else {
			if (this.fontService.textLimitEnable == true || this.fontService.textLimitEnable == "1") {
				let objCount = this.canvasService.getObjectTypeFromAllCanvas('tab', 'text');
				objCount = (objCount) ? objCount : 0;
				if (objCount >= this.fontService.textLimitCounter) {
					this.displayTextLimitError();
					
					this.canvasText = '';
					return;
				}
			}
			let fontColor = (this.defaultColor.color_code) ? this.defaultColor.color_code : null;
			this.eventService.$sub('changedColor', (data) => {
				fontColor = data ? data : fontColor;
			});

			let fontFamily = (this.defaultFontFamily.font_label) ? this.defaultFontFamily.font_label : null;
			let font_file = (this.defaultFontFamily.font_file) ? this.defaultFontFamily.font_file : null;
			let properties: any = {
				left: 10,
				top: 20,
				opacity: 1,
				fontSize: (this.defaultFontSize) ? parseInt(this.defaultFontSize) : 16,
				objType: 'text',
				strokeWidth: 0,
				tab: "text"
			};
			if (fontColor && fontColor != null) properties.fill = fontColor;
			if (fontFamily && fontFamily != null) properties.fontFamily = fontFamily;
			if (font_file && font_file != null) properties.font_file = font_file;
			let textObj = new fabric.Text(this.canvasText);

			let params = {
				obj: textObj,
				properties: properties,
				crudServiceString: 'this.insertObjectService',
				isCenter: true,
			};
			this.canvasService.objectCRUD(params);
		}
	}

	displayTextLimitError() {
		Swal.fire({
			title: this.translate.instant('Alert'),
			text: this.fontService.limitAlert,
			type: "warning",
			confirmButtonText: this.translate.instant('OK'),
		});
	}

	showChild(childTabs = 'plain-text') {
		this.tabsService.showChildTabs(childTabs);
	}
}
