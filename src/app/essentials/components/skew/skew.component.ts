import { Component, OnInit } from '@angular/core';
import { MainService } from 'src/app/services/main.service';
import { TabsService } from 'src/app/services/tabs.service';
import { CanvasService } from 'src/app/services/canvas.service';
import { PubSubService } from 'angular7-pubsub';

@Component({
	selector: '[skew]',
	templateUrl: './skew.component.html',
	styleUrls: ['./skew.component.scss']
})
export class SkewComponent implements OnInit {

	// Variable Declaration
	public opacity_enable: any;
	public skew_enable: any;
	public canvas: any;
	public opacity: any;
	public skewX: any = 0;
	public skewY: any = 0;
	public componentHide: any = true;

	// fixed values
	public minDegree: number = 0;
	public maxDegree: number = 180;

	// for undo redo
	public preSkewValues: any = {};


	constructor(
		public mainService: MainService,
		private eventService: PubSubService,
		private canvasService: CanvasService,
		public tabsService: TabsService
	) {
		this.tabsService.registerTabs('skew', 'plain-text');
		this.tabsService.registerTabs('skew', 'clipart');
		this.tabsService.registerTabs('skew', 'image-upload');
		this.tabsService.registerTabs('skew', 'name-number');
		this.tabsService.registerTabs('skew', 'common');
	}

	ngOnInit() {
		this.subscribeEvents();
	}

	subscribeEvents() {
		this.eventService.$sub('objectSelectionCreated', (obj) => {
			this.setSkew(obj);
			this.componentHide = (this.canvasService.getActiveObject() && obj.ultimatelock != true) ? null : true;
		});
		this.eventService.$sub('objectSelectionCleared', () => {
			this.componentHide = (this.canvasService.getActiveObject()) ? null : true;
		});
		this.eventService.$sub('objectAdded', (obj) => {
			if (!obj.hasOwnProperty('skewX') && !obj.skewX) {
				this.skewX = 0;
			} if (!obj.hasOwnProperty('skewY') && !obj.skewY) {
				this.skewY = 0;
			}
			this.componentHide = (this.canvasService.getActiveObject() && obj.ultimatelock != true) ? null : true;
		});
		this.eventService.$sub('objectRemoved', (obj) => {
			this.componentHide = (this.canvasService.getActiveObject()) ? null : true;
		});
		this.eventService.$sub('objectSelectionUpdated', (obj) => {
			this.setSkew(obj);
			this.componentHide = (this.canvasService.getActiveObject() && obj.ultimatelock != true) ? null : true;
		});
		this.eventService.$sub('objectUpdated', (obj) => {
			this.setSkew(obj);
		});
	}

	setPrevValue(key, value) {
		if (!this.preSkewValues || this.preSkewValues[key] == null) {
			this.preSkewValues[key] = value;
		}
	}

	stackToUndo(key) {
		// Init empty shadow object here
		let properties = {};

		// set selecte shadow value(eg. offsetX, offsetY)
		properties = Object.assign({}, this.preSkewValues);

		// determine other shadow key(eg. offsetX, offsetY)
		let otherKey = (key == 'skewX') ? 'skewY' : 'skewX',

			// determine other shadow value
			otherKeyVal = (otherKey == 'skewX') ? this.skewX : this.skewY;

		// check if otherKyeVal is null, set it to 0
		// this will only occur on first time
		otherKeyVal = (!otherKeyVal) ? 0 : otherKeyVal;

		// set other shadow property to properties object
		properties[otherKey] = otherKeyVal;

		// finally pass the property object to rangeSliderUndoRedo
		this.canvasService.rangeSliderUndoRedo(properties);

		// set selected shadow to null
		this.preSkewValues[key] = null;
	}

	/**
	 * Change skew values on object updatation(eg. object added/removed/modified etc)
	 * 
	 * @param obj 
	 */
	setSkew(obj) {
		if (obj.length > 0) {
			if (obj[0]) {
				this.skewX = (obj[0].skewX != 0 && obj[0].skewX != undefined) ? obj[0].skewX : 0;
				this.skewY = (obj[0].skewY != 0 && obj[0].skewY != undefined) ? obj[0].skewY : 0;
			}
		}
		else {
			this.skewX = (obj.skewX != 0 && obj.skewX != undefined) ? obj.skewX : 0;
			this.skewY = (obj.skewY != 0 && obj.skewY != undefined) ? obj.skewY : 0;
		}
	}


	changeSkewX() {
		this.skewX = (this.skewX < this.minDegree) ? this.minDegree : this.skewX;
		let selectedObjs = this.canvasService.currentCanvas.getActiveObjects();
		/*this.canvasService.deselectAllObjects();*/
		selectedObjs.filter(currObj => {
			currObj.skewX = this.skewX;
		});
		/*this.eventService.$pub('selectThisObjects', selectedObjs);*/
		this.canvasService.currentCanvas.renderAll();
	}

	/**
	 * Change SkewX value
	 */
	changeSkewY() {
		this.skewY = (this.skewY > this.maxDegree) ? this.maxDegree : this.skewY;
		let selectedObjs = this.canvasService.currentCanvas.getActiveObjects();

		selectedObjs.filter(currObj => {
			currObj.skewY = this.skewY;
		});
		this.canvasService.currentCanvas.renderAll();
	}

	/**
	 * Reset Skew
	 */
	clear() {
		this.skewX = 0;
		this.skewY = 0;
		if (this.canvasService.hasCanvasObjectOrBackgroundAll()) {
			this.changeSkewX();
			this.changeSkewY();
		}
	}
}
