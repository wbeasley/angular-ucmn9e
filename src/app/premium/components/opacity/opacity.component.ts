import { Component, OnInit } from '@angular/core';
import { CanvasService } from 'src/app/services/canvas.service';
import { MainService } from 'src/app/services/main.service';
import { TabsService } from 'src/app/services/tabs.service';
import { PubSubService } from 'angular7-pubsub';

@Component({
	selector: '[opacity]',
	templateUrl: './opacity.component.html',
	styleUrls: ['./opacity.component.scss']
})
export class OpacityComponent implements OnInit {

	opacity: any;
	componentHide: any = true;

	prevOpacityVal: any = null;
	constructor(private canvasService: CanvasService, private eventService: PubSubService, public mainService: MainService, public tabsService: TabsService) {
		this.tabsService.registerTabs('opacity', 'plain-text');
		this.tabsService.registerTabs('opacity', 'clipart');
		this.tabsService.registerTabs('opacity', 'image-upload');
		this.tabsService.registerTabs('opacity', 'name-number');
		this.tabsService.registerTabs('opacity', 'common');
	}

	ngOnInit() {
		this.initData();
		this.eventService.$sub('objectSelectionCreated', (obj) => {
			this.componentHide = (this.canvasService.getActiveObject() && obj.ultimatelock != true) ? null : true;
			this.updateOpacity(obj);
		});

		this.eventService.$sub('objectSelectionUpdated', (obj) => {
			obj = (Array.isArray(obj)) ? obj[0] : obj;
			this.updateOpacity(obj);
			this.componentHide = (this.canvasService.getActiveObject() && obj.ultimatelock != true) ? null : true;
		});
		this.eventService.$sub('objectUpdated', (obj) => {
			obj = (Array.isArray(obj)) ? obj[0] : obj;
			this.updateOpacity(obj);
		});
		this.eventService.$sub('objectSelectionCleared', (obj) => {
			this.initData();
			this.componentHide = (this.canvasService.getActiveObject() && this.canvasService.getActiveObject().ultimatelock != true) ? null : true;
		});
		this.eventService.$sub('objectAdded', (obj) => {
			this.componentHide = (this.canvasService.getActiveObject() && obj.ultimatelock != true) ? null : true;
		});
		this.eventService.$sub('objectRemoved', (obj) => {
			this.componentHide = (this.canvasService.getActiveObject() && obj.ultimatelock != true) ? null : true;
		});
	}

	initData() {
		this.opacity = this.canvasService.getActiveObjectValue('text', 'opacity') ? this.canvasService.getActiveObjectValue('text', 'opacity') : 1.0;
		if(this.opacity == 1.0) {
			this.opacity = this.canvasService.getActiveObjectValue('textbox', 'opacity') ? this.canvasService.getActiveObjectValue('textbox', 'opacity') : 1.0;
		}
	}

	changeOpacity() {
		let selectedObjs = this.canvasService.currentCanvas.getActiveObjects(), properties: any = {};
		properties.opacity = (this.opacity / 10);
		selectedObjs.filter(obj => {
			obj = Object.assign(obj, properties);
			this.canvasService.currentCanvas.renderAll();
		});
	}

	setPrevValue(val) {
		if (this.prevOpacityVal == null) this.prevOpacityVal = val / 10;
	}

	stackToUndo() {
		this.canvasService.rangeSliderUndoRedo({ 'opacity': this.prevOpacityVal });
		this.prevOpacityVal = null;
	}

	updateOpacity(obj) {
		if (obj.length > 0) {
			if (obj[0]) {
				this.opacity = obj[0].opacity * 10;
			}
		}
		else {
			this.opacity = obj.opacity * 10;
		}
	}

	resetOpacity() {
		this.opacity = 1 * 10;
		this.changeOpacity();
	}
}
