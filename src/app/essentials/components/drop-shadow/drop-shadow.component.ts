import { Component, OnInit } from '@angular/core';
import { CanvasService } from 'src/app/services/canvas.service';
import { PubSubService } from 'angular7-pubsub';
import { MainService } from 'src/app/services/main.service';
import { TabsService } from 'src/app/services/tabs.service';

@Component({
	selector: '[drop-shadow]',
	templateUrl: './drop-shadow.component.html',
	styleUrls: ['./drop-shadow.component.scss']
})
export class DropShadowComponent implements OnInit {

	offsetX: any;
	offsetY: any;
	blur: any;
	shadowcolor: any;
	hideColorToggleShadow = 1;
	componentHide: any = true;
	selectedColor: any;

	// undo redo
	public prevShadow: any = {};

	constructor(private canvasService: CanvasService, private eventService: PubSubService, public mainService: MainService, public tabsService: TabsService) {
		this.tabsService.registerTabs('drop-shadow', 'plain-text');
		this.tabsService.registerTabs('drop-shadow', 'name-number');
	}

	ngOnInit() {
		this.initData();
		this.offsetX = '0';
		this.offsetY = '0';
		this.blur = '0';
		this.subscribeEvents();

	}

	initData() {
		if (this.mainService.colorData.defaultColor) {
			this.selectedColor = Object.assign({}, this.mainService.colorData.defaultColor);
		}
		let shadow = this.canvasService.getActiveObjectValue('text', 'shadow'),
			activeObj = this.canvasService.getActiveObject();
		if(!shadow || (activeObj != false && activeObj.type == 'textbox')) {
			shadow = this.canvasService.getActiveObjectValue('textbox', 'shadow');
		}
		this.offsetX = (shadow && shadow.offsetX) ? shadow.offsetX : '0';
		this.offsetY = (shadow && shadow.offsetY) ? shadow.offsetY : '0';
	}

	subscribeEvents() {
		let self = this;

		this.eventService.$sub('objectAdded', (obj) => {
			self.componentHide = ((obj.type == "text" || obj.type == "textbox") && obj.ultimatelock != true) ? null : true;
		});

		this.eventService.$sub('objectRemoved', (obj) => {
			self.componentHide = true;
		});
		this.eventService.$sub('objectUpdated', (obj) => {
			obj = (Array.isArray(obj)) ? obj[0] : obj;
			this.updateShadow(obj);
		});

		this.eventService.$sub('objectSelectionCreated', (obj) => {
			if (obj.type == 'activeSelection') {
				let isObjText = obj._objects.indexOf(obj._objects.find(currObj => currObj.type != 'text'));
				if (isObjText == -1) {
					self.componentHide = null;
				} else {
					self.componentHide = true;
				}
			} else {
				self.componentHide = ((obj.type == "text" || obj.type == "textbox") && obj.ultimatelock != true) ? null : true;
			}
			this.updateShadow(obj);

		});
		this.eventService.$sub('objectSelectionUpdated', (obj) => {
			obj = (Array.isArray(obj)) ? obj[0] : obj;
			this.componentHide = ((obj.type == "text" || obj.type == "textbox") && obj.ultimatelock != true) ? null : true;
			if (obj.type == 'activeSelection') {
				let isObjText = obj._objects.indexOf(obj._objects.find(currObj => currObj.type != 'text'));
				if (isObjText == -1) {
					self.componentHide = null;
				} else {
					self.componentHide = true;
				}
			} else {
				this.componentHide = ((obj.type == "text" || obj.type == "textbox") && obj.ultimatelock != true) ? null : true;
			}
			this.updateShadow(obj);
		});
		this.eventService.$sub('objectSelectionCleared', () => {
			this.componentHide = true;
			this.blur = '0';
			if (this.mainService.colorData.defaultColor) {
				this.selectedColor = Object.assign({}, this.mainService.colorData.defaultColor);
			}
			this.initData();
		});
		this.eventService.$sub('imageSideChanged', () => {
			this.initData();
		});
		this.eventService.$sub('closeColorPicker', () => {
			this.hideColorToggleShadow = 1;
		});
	}

	changeShadow(changeShadowY: boolean = false) {
		let selectedObjects = this.canvasService.currentCanvas.getActiveObjects();
		if (selectedObjects.length > 0) {
			let shadow = {
				offsetX: this.offsetX,
				offsetY: this.offsetY,
				blur: this.blur,
				color: this.selectedColor,
			}
			let properties = {
				shadow: shadow
			};
			selectedObjects.filter(obj => {
				obj = Object.assign(obj, properties);
				this.canvasService.currentCanvas.renderAll();
			});
		}
	}

	setPrevValue(key, value) {
		if (!this.prevShadow || this.prevShadow[key] == null) {
			this.prevShadow[key] = value;
		}
	}

	stackToUndo(key) {

		// Init empty shadow object here
		let properties = { shadow: {} };

		// set selecte shadow value(eg. offsetX, offsetY)
		properties.shadow = Object.assign(properties.shadow, this.prevShadow);

		// determine other shadow key(eg. offsetX, offsetY)
		let otherKey = (key == 'offsetX') ? 'offsetY' : 'offsetX',

			// determine other shadow value
			otherKeyVal = (otherKey == 'offsetX') ? this.offsetX : this.offsetY;

		// check if otherKyeVal is null, set it to 0
		// this will only occur on first time
		otherKeyVal = (!otherKeyVal) ? 0 : otherKeyVal;

		// set other shadow property to properties object
		properties.shadow[otherKey] = otherKeyVal;

		// finally pass the property object to rangeSliderUndoRedo
		this.canvasService.rangeSliderUndoRedo(properties);

		// set selected shadow to null
		this.prevShadow[key] = null;
	}

	updateShadow(obj) {
		if (obj.length > 0) {
			if (obj[0]) {
				this.offsetX = (obj[0].shadow && obj[0].shadow.offsetX != undefined) ? obj[0].shadow.offsetX : 0;
				this.offsetY = (obj[0].shadow && obj[0].shadow.offsetY != undefined) ? obj[0].shadow.offsetY : 0;
				this.blur = (obj[0].shadow && obj[0].shadow.blur != undefined) ? obj[0].shadow.blur : 0;
				this.selectedColor = (obj[0].shadow && obj[0].shadow.color != undefined) ? obj[0].shadow.color : this.mainService.colorData.defaultColor.color_code;[0]
			} [0]
		}
		else {
			this.offsetX = (obj.shadow && obj.shadow.offsetX != undefined) ? obj.shadow.offsetX : 0;
			this.offsetY = (obj.shadow && obj.shadow.offsetY != undefined) ? obj.shadow.offsetY : 0;
			this.blur = (obj.shadow && obj.shadow.blur != undefined) ? obj.shadow.blur : 0;
			this.selectedColor = (obj.shadow && obj.shadow.color != undefined) ? obj.shadow.color : this.mainService.colorData.defaultColor.color_code;
		}
	}

	resetShadow() {
		if (!this.canvasService.currentCanvas) return;
		let selectedObjs = this.canvasService.currentCanvas.getActiveObjects();

		selectedObjs.filter(obj => {
			this.offsetX = '0';
			this.offsetY = '0';
			this.blur = '0';
			if (obj) {
				let shadow = {
					offsetX: 0,
					offsetY: 0,
					blur: 0,
					color: this.mainService.colorData.defaultColor.color_code,
				}
				let properties = {
					shadow: shadow
				}
				if (this.mainService.colorData.defaultColor) {
					this.selectedColor = Object.assign({}, this.mainService.colorData.defaultColor.color_code);
				}
				let params = {
					obj: obj,
					properties: properties,
					crudServiceString: 'this.updateObjectService',
				};
				this.canvasService.objectCRUD(params);
			}
		});
	}

	colorPickerToggleShadow() {
		if (this.hideColorToggleShadow == 1) {
			this.hideColorToggleShadow = 0;
		} else if (this.hideColorToggleShadow == 0) {
			this.hideColorToggleShadow = 1;
		}
	}

	changeColorShadow(shadowColor) {
		if (!this.canvasService.currentCanvas) return;

		this.selectedColor = shadowColor;
		let selectedObjs = this.canvasService.currentCanvas.getActiveObjects();

		let shadow = {
			offsetX: this.offsetX,
			offsetY: this.offsetY,
			blur: this.blur,
			color: shadowColor
		}
		let properties = {
			shadow: shadow
		};
		this.mainService.updateObjectProperties(selectedObjs, properties);
	}
}
