import { Component, OnInit } from '@angular/core';
import { CanvasService } from 'src/app/services/canvas.service';
import { PubSubService } from 'angular7-pubsub';
import { MainService } from 'src/app/services/main.service';
import { TabsService } from 'src/app/services/tabs.service';

@Component({
	selector: '[stroke]',
	templateUrl: './stroke.component.html',
	styleUrls: ['./stroke.component.scss']
})
export class StrokeComponent implements OnInit {

	outline: any;
	colorarr: any = [];
	hideColorToggleOutline = 1;
	componentHide: any = true;
	selectedColor: any;

	// for undoRedo
	public prevStrokeWidth: any = null;

	constructor(private canvasService: CanvasService, private eventService: PubSubService, public mainService: MainService, public tabsService: TabsService) {
		this.tabsService.registerTabs('stroke', 'plain-text');
		this.tabsService.registerTabs('stroke', 'name-number');
	}


	ngOnInit() {
		this.outline = '0';
		this.subscribeEvents();
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
			this.updateOutline(obj);
		});

		this.eventService.$sub('objectSelectionCreated', (obj) => {
			if (obj.type == 'activeSelection') {
				let isObjText = obj._objects.indexOf(obj._objects.find(currObj => (currObj.type != 'text' && currObj.type != 'textbox')));
				if (isObjText == -1) {
					self.componentHide = null;
				} else {
					self.componentHide = true;
				}
			} else {
				self.componentHide = ((obj.type == "text" || obj.type == "textbox") && obj.ultimatelock != true) ? null : true;
			}
			this.updateOutline(obj);
		});
		this.eventService.$sub('objectSelectionUpdated', (obj) => {
			obj = (Array.isArray(obj)) ? obj[0] : obj;
			this.componentHide = ((obj.type == "text" || obj.type == "textbox") && obj.ultimatelock != true) ? null : true;
			if (obj.type == 'activeSelection') {
				let isObjText = obj._objects.indexOf(obj._objects.find(currObj => (currObj.type != 'text' && currObj.type != 'textbox')));
				if (isObjText == -1) {
					self.componentHide = null;
				} else {
					self.componentHide = true;
				}
			} else {
				this.componentHide = ((obj.type == "text" || obj.type == "textbox") && obj.ultimatelock != true) ? null : true;
			}
			this.updateOutline(obj);

		});
		this.eventService.$sub('objectSelectionCleared', () => {
			this.componentHide = true;
			this.outline = '0';
			this.selectedColor = Object.assign({}, this.mainService.colorData.defaultColor);
		});
		this.eventService.$sub('closeColorPicker', () => {
			this.hideColorToggleOutline = 1;
		});
	}

	changeOutline() {
		if (!this.canvasService.currentCanvas) return;
		let selectedObjs = this.canvasService.currentCanvas.getActiveObjects(), properties: any = {};

		selectedObjs.filter(obj => {
			obj.strokeWidth = this.outline / 10;
			properties.stroke = this.selectedColor;
			properties.dirty = true;
			this.canvasService.currentCanvas.renderAll();
		});
	}

	setPrevValue(val) {
		if (this.prevStrokeWidth == null) this.prevStrokeWidth = val / 10;
	}

	stackToUndo() {
		this.canvasService.rangeSliderUndoRedo({ 'strokeWidth': this.prevStrokeWidth });
		this.prevStrokeWidth = null;
	}

	updateOutline(obj) {
		if (obj.length > 0) {
			if (obj[0] && this.outline != obj.strokeWidth) {
				this.outline = obj.strokeWidth * 10;
				obj.dirty = true;
				this.selectedColor = (obj[0].stroke) ? obj[0].stroke : this.mainService.colorData.defaultColor.color_code;
			}
		}
		else {
			this.outline = obj.strokeWidth * 10;
			this.selectedColor = (obj.stroke) ? obj.stroke : this.mainService.colorData.defaultColor.color_code;
		}
	}

	colorPickerToggleOutline() {
		if (this.hideColorToggleOutline == 1) {
			this.hideColorToggleOutline = 0;
		} else if (this.hideColorToggleOutline == 0) {
			this.hideColorToggleOutline = 1;
		}
	}

	changeColorOutline(outlineColor) {
		if (!this.canvasService.currentCanvas) return;
		this.selectedColor = outlineColor;
		let obj = this.canvasService.currentCanvas.getActiveObjects(), properties: any = {};
		if (obj) {
			properties.stroke = outlineColor;
			properties.dirty = true;
			this.mainService.updateObjectProperties(obj, properties);
		}
	}

	resetOutline() {
		if (!this.canvasService.currentCanvas) return;
		let obj = this.canvasService.currentCanvas.getActiveObjects(), properties: any = {};
		if (obj) {
			properties.strokeWidth = 0;
			properties.stroke = this.mainService.colorData.defaultColor.color_code;
			properties.dirty = true;
			this.outline = '0';
			this.mainService.updateObjectProperties(obj, properties);
		}
	}
}
