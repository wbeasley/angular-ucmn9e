import { FontService } from './font.service';
import { Component, OnInit, ViewChild, ChangeDetectorRef, ElementRef } from '@angular/core';
import { CanvasService } from 'src/app/services/canvas.service';
import { PubSubService } from 'angular7-pubsub';
import { MainService } from 'src/app/services/main.service';
import { TabsService } from 'src/app/services/tabs.service';
import { LoaderComponent } from './../loader/loader.component';
import { PlacholderLoaderService } from '../placeholder-loader/placholder-loader.service';
declare let introJs: any;

@Component({
	selector: '[font]',
	templateUrl: './font.component.html',
	styleUrls: ['./font.component.scss']
})
export class FontComponent implements OnInit {
	fontFamily: any = 'select font style';
	isDisplay: boolean = false;
	fontSizeArray: any = ['12', '14', '16', '18', '20', '22'];
	fontSize: any;
	fontStyle: any;
	fontStyleArr: any = [];
	textAlign: any;

	colorarr: any = [];
	hideColorToggleFont = 1;
	selectedColor: any;
	componentHide: any = true;
	// Resolve sync issue for load fonts and load colors

	isColorLoaded: boolean = false;
	isToggle: any = false;
	fontImg: any = [];
	imageExists: boolean = true;
	notImg: boolean = false;
	public enableForMultiLine: boolean;
	showAllFonts: boolean = false;
	backArrow: boolean = false;
	loadPlaintext: boolean = false;
	openAccordian: boolean = false;

	public loadmore: any = 0;
	public isEnableloadmore: any = false;
	public checkFontScroll: boolean = false;

	// infinite scroll
	public customPlaceholderArr: any = [];
	public showPlaceholder: boolean;
	public allowPlaceholderLoader;

	// for undo-redo
	public prevFontSize: any;

	@ViewChild("loaderComponent") loaderComponent: LoaderComponent;
	@ViewChild('scrollToBottom') private ScrollContainer: ElementRef;

	constructor(
		private canvasService: CanvasService,
		private eventService: PubSubService,
		public mainService: MainService,
		public tabsService: TabsService,
		public fontService: FontService,
		private cdr: ChangeDetectorRef,
		public placholderLoaderService: PlacholderLoaderService
	) {
		this.tabsService.registerTabs('font', 'plain-text');
		this.tabsService.registerTabs('font', 'name-number');
		this.enableDisableAlignment();
	}

	enableDisableAlignment() {
		this.enableForMultiLine = this.enableForMultipleObject();
	}

	enableForSingleObj(): boolean {
		let obj = this.canvasService.getActiveObject();
		if (obj == false) return false;
		return true;
	}

	enableForMultipleObject(): boolean {
		let totalAddedObjects: any = (this.canvasService.currentCanvas && this.canvasService.currentCanvas.getActiveObject() && (this.canvasService.currentCanvas.getActiveObject().type == "text" || this.canvasService.currentCanvas.getActiveObject().type == "textbox")) ? this.canvasService.currentCanvas.getActiveObject()._textLines.length : 0;
		if (this.enableForSingleObj() === true && totalAddedObjects > 1) return null;
		return true;
	}

	async ngOnInit() {
		this.allowPlaceholderLoader = this.mainService.isResponsive;
		this.loadMoreFont(true);
		this.subscribeEvents();
		this.eventService.$sub('closeFullView', (backArrow) => {
			this.showAllFonts = backArrow;
			this.showFonts(this.showAllFonts);
		});
	}

	ngAfterViewChecked() {
		try {
			if (this.checkFontScroll) {
				this.scrollToBottom();
				this.checkFontScroll = false;
			}
		} catch (err) { }
	}

	scrollToBottom(): void {
		try {
			if (!this.mainService.isResponsive)
				this.ScrollContainer.nativeElement.scrollTop = this.ScrollContainer.nativeElement.scrollHeight;
		} catch (err) { }
	}

	updateProperties() {
		if (!this.canvasService.currentCanvas) return;
		let selectedObjs = this.canvasService.currentCanvas.getActiveObjects();
		this.isEnableloadmore = this.fontService.isEnableloadmore;
		selectedObjs.filter(obj => {
			if ((obj.type != "text" && obj.type != "textbox")) {
				this.resetFontProperties();
				return
			};
			if (this.fontService.isFontLoaded === true) {
				if (obj.fontFamily && this.fontService.activeFontFamily.font_label != obj.fontFamily) {
					this.fontService.activeFontFamily.font_label = obj.fontFamily;
				}
				if (obj.fontSize && this.fontSize != obj.fontSize) {
					this.fontSize = obj.fontSize;
				}
			}
			if (obj.textAlign && this.textAlign != obj.textAlign) {
				this.textAlign = obj.textAlign;
			}
			this.fontStyleArr = [];
			if (obj.fontWeight == 'bold') {
				this.fontStyleArr.push('bold');
			}
			if (obj.fontStyle == 'italic') {
				this.fontStyleArr.push('italic');
			}
			if (obj.underline == true) {
				this.fontStyleArr.push('underline');
			}

			if (obj) {
				this.selectedColor = obj.fill;
				obj.dirty = true;
			}

			// sort and set selected font as first in the list
			if (!this.isToggle && !this.mainService.isResponsive) this.sortFontFamilyList();
		});
	}

	sortFontFamilyList(obj: any = null) {
		obj = (obj == null) ? this.canvasService.getActiveObject() : obj;
		if (!obj) return;
		let originalIndex = this.fontService.fontarr.findIndex(data => data.font_label === obj.fontFamily)
		if (originalIndex != -1) {
			let tmp = this.fontService.fontarr[0];
			this.fontService.fontarr[0] = this.fontService.fontarr[originalIndex];
			this.fontService.fontarr[originalIndex] = tmp;
		}
	}

	resetFontProperties() {
		if (this.mainService.colorData.defaultColor && this.mainService.colorData.defaultColor.color_code) {
			this.eventService.$pub('changedColor', this.mainService.colorData.defaultColor.color_code);
			this.selectedColor = this.mainService.colorData.defaultColor.color_code;
		}
	}


	async loadMoreFont(resetArr: boolean = false) {
		this.showPlaceholder = true;
		this.loadmore++;

		if (!this.fontService.fontLoadRequested) {
			await this.fontService.getFonts(this.loadmore, resetArr);
		}
		if (this.fontService.fontarr && this.fontService.fontarr.length) {
			this.updateProperties();
			this.loadFonts();
			this.checkFontScroll = true;
			this.showPlaceholder = false;
		}
	}

	subscribeEvents() {
		let self = this;

		this.eventService.$sub('objectAdded', (obj) => {
			self.componentHide = ((obj.type == "text" || obj.type == "textbox") && obj.ultimatelock != true) ? null : true;
			self.openAccordian = ((obj.type == "text" || obj.type == "textbox")) ? true : null;
			this.cdr.detectChanges();
		});
		this.eventService.$sub('objectRemoved', (obj) => {
			if (obj && ((obj.type == "text" || obj.type == "textbox") || Array.isArray(obj) && obj[0] && (obj[0].type == 'text' || obj[0].type == 'textbox'))) {
				this.resetFontProperties();
				self.openAccordian = null;
				
				self.componentHide = true;
			}
		});
		this.eventService.$sub('objectUpdated', (obj) => {
			this.enableDisableAlignment();
			this.updateProperties();
		});

		this.eventService.$sub('objectSelectionCreated', (obj) => {
			this.hideShowComponent(obj);
			if (self.componentHide == null) {
				this.sortFontFamilyList();
			}
			this.cdr.detectChanges();
			this.updateProperties();
		});
		this.eventService.$sub('objectSelectionUpdated', (obj) => {
			this.hideShowComponent(obj);
			this.updateProperties();
		});
		this.eventService.$sub('objectSelectionCleared', () => {
			this.enableDisableAlignment();
			
			this.componentHide = true;
			this.openAccordian = null;
			this.updateProperties();
		});
		this.eventService.$sub('imageSideChanged', () => {
			this.updateProperties();
		});
		this.eventService.$sub('canvasObjectScaled', () => {
			this.changeFontScale();
		});
		this.eventService.$sub('closeColorPicker', () => {
			this.hideColorToggleFont = 1;

		});
		this.eventService.$sub('canvasObjectModified', (obj) => {
			this.enableDisableAlignment();
			this.componentHide = ((obj.type == "text" || obj.type == "textbox") && obj.ultimatelock != true) ? null : true;
			self.openAccordian = ((obj.type == "text" || obj.type == "textbox")) ? true : null;
			this.updateProperties();
		});
		this.eventService.$sub('closeFontWrapper', () => {
			this.isToggle = false;
		});
		this.eventService.$sub('loadTheseFonts', async (jsonObjects) => {
			this.fetchFontListFromJsonObjects(jsonObjects);
		});
	}

	hideShowComponent(obj) {
		this.enableDisableAlignment();
		/*if(self.canvasService.getObjectType(obj,"text") && !Array.isArray(obj)){*/
		if (obj.type == 'activeSelection') {
			let isObjText = obj._objects.indexOf(obj._objects.find(currObj => (currObj.type != 'text' && currObj.type != 'textbox')));
			if (isObjText == -1) {
				
				this.componentHide = null;
				this.openAccordian = true;
			} else {
				
				this.componentHide = true;
				this.openAccordian = null;
			}
		} else {
			
			this.componentHide = ((obj.type == "text" || obj.type == "textbox") && obj.ultimatelock != true) ? null : true;
			this.openAccordian = ((obj.type == "text" || obj.type == "textbox")) ? true : null;
		}
	}
	async fetchFontListFromJsonObjects(jsonObjects) {
		let fontList: any = [];
		for (let canvasKey in jsonObjects) {
			if (jsonObjects[canvasKey] && jsonObjects[canvasKey].hasOwnProperty('objects') && jsonObjects[canvasKey].objects.length) {
				jsonObjects[canvasKey].objects.filter(obj => {
					if ((obj.type == 'text' || obj.type == 'textbox') && obj.hasOwnProperty('fontFamily') && obj.fontFamily) {
						fontList.push(obj.fontFamily);
					}
				})
			}
		}
		if (fontList.length) {
			this.fontService.loadTheseFonts = fontList;
			await this.fontService.getFonts(this.loadmore, true);
			let selectedObj = this.canvasService.getActiveObject();
			this.canvasService.deselectAllObjects();
			this.loadFonts();
			setTimeout(() => {
				if (selectedObj)
					this.applyFonts(selectedObj);
			}, 200);
		}
	}

	loadFonts() {
		//to load fontfile 
		let fonts: any = this.fontService.fontarr;
		if (fonts) {
			let style = document.createElement('style');
			style.type = 'text/css';

			let fontFamily = '';
			fonts.filter(fontObj => {
				fontFamily = fontObj.font_file;
				let css = " @font-face{ font-family:'" + fontObj.font_label + "'; src:url('" + fontFamily + "'); }";
				let length = document.getElementsByTagName('style').length - 1;
				if (document.getElementsByTagName('style')[length].getAttribute("class") == "font-css") {
					style.innerHTML += css;
				} else {
					style.setAttribute("class", "font-css");
					style.innerHTML += css;
				}
			});

			document.getElementsByTagName('head')[0].appendChild(style);
		}
	}

	applyFonts(selectedObj) {
		let allObj = this.canvasService.getObjects();
		allObj.filter(obj => {
			this.canvasService.currentCanvas.setActiveObject(obj).renderAll();
		});
		this.canvasService.currentCanvas.setActiveObject(selectedObj).renderAll();
	}

	changeFontFamily(object) {
		this.fontService.activeFontFamily = Object.assign({}, object);
		let selectedObjs = this.canvasService.currentCanvas.getActiveObjects(), properties: any = {};

		properties.fontFamily = this.fontService.activeFontFamily.font_label;
		properties.font_file = this.fontService.activeFontFamily.font_file;
		properties.dirty = true;
		this.mainService.updateObjectProperties(selectedObjs, properties);
		this.showFonts(true);
	}

	changeFontSize() {
		let selectedObjs = this.canvasService.currentCanvas.getActiveObjects(), properties: any = {};
		selectedObjs.filter(currObj => {
			currObj.fontSize = this.fontSize;
		});
		this.canvasService.currentCanvas.renderAll();
		// properties.fontSize = this.fontSize;
		// this.mainService.updateObjectProperties(selectedObjs, properties);
	}

	setPrevValue(val) {
		if (this.prevFontSize == null) this.prevFontSize = val;
	}

	stackToUndo() {
		this.canvasService.rangeSliderUndoRedo({ 'fontSize': this.prevFontSize });
		this.prevFontSize = null;
	}

	changeFontStyle(fontStyle) {

		// variable declaration
		let selectedObjs = this.canvasService.currentCanvas.getActiveObjects(),
			found: number = this.fontStyleArr.indexOf(fontStyle);

		// if obj is found and specified font style exists in our stored fontStyleArr obj
		// remove the same from object, else push it into the object
		if (selectedObjs && found >= 0) {
			this.fontStyleArr.splice(found, 1);
		} else {
			this.fontStyleArr.push(fontStyle);
		}

		// style variable here works as a flag variable
		// that will toggle the font style,(apply/remove based on found variable)
		let style = (found >= 0) ? 'normal' : fontStyle, properties: any = {};

		// set property object
		switch (fontStyle) {
			case "bold":
				properties.fontWeight = style;
				break;
			case "italic":
				properties.fontStyle = style;
				break;
			case "underline":
				properties.underline = (style == 'normal') ? false : true;
				break;
		}
		// For underline
		properties.dirty = true;

		// Update canvas text object with new properties
		this.mainService.updateObjectProperties(selectedObjs, properties);
	}

	setTextAlign(align) {
		let obj = this.canvasService.getActiveObject(), properties: any = {};
		if (obj) {
			properties.textAlign = align;
			this.textAlign = align;
			let params = {
				obj: obj,
				properties: properties,
				crudServiceString: 'this.updateObjectService',
			};
			this.canvasService.objectCRUD(params);
		}
	}

	colorPickerToggleFont(event) {
		if (this.hideColorToggleFont == 1) {
			this.hideColorToggleFont = 0;
		} else if (this.hideColorToggleFont == 0) {
			this.hideColorToggleFont = 1;
		}
	}

	changeFontColor(color) {
		this.selectedColor = color;
		this.eventService.$pub('changedColor', color);
		let obj = this.canvasService.currentCanvas.getActiveObjects(), properties: any = {};
		if (obj) {
			properties.fill = color;
			properties.dirty = true;
			this.mainService.updateObjectProperties(obj, properties);
		}
	}

	changeFontScale() {
		let obj: any = this.canvasService.currentCanvas.getActiveObjects();
		if (obj && obj.length > 0) {
			obj = obj[0];
		}
		if (obj && (obj.type != "text" && obj.type != "textbox")) {
			return;
		}
		let scaleY = obj.scaleY, properties: any = {}, newfontsize: any = (obj.fontSize * obj.scaleX);
		properties.fontSize = parseInt(newfontsize, 10);
		this.fontSize = parseInt(newfontsize, 10);
		properties.scaleX = 1;
		properties.scaleY = 1;
		obj.set(properties);
		this.canvasService.currentCanvas.renderAll();
	}

	isToggleOpen() {
		this.isToggle = !this.isToggle;
		if (!this.isToggle) {
			setTimeout(() => {
				this.sortFontFamilyList();
			}, 200);
		}
	}

	showFonts(showAllFonts) {
		this.showAllFonts = !showAllFonts;
		this.eventService.$pub('showFonts', { showAllFonts: this.showAllFonts, title: 'Change Font Family' });
	}
}
