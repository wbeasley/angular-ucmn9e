import { Component, OnInit } from '@angular/core';
import { MainService } from 'src/app/services/main.service';
import { CacheService, CacheStoragesEnum } from 'ng2-cache';
import { CanvasService } from 'src/app/services/canvas.service';
import { TabsService } from 'src/app/services/tabs.service';
import { PubSubService } from 'angular7-pubsub';

@Component({
	selector: '[object-position]',
	templateUrl: './object-position.component.html',
	styleUrls: ['./object-position.component.scss']
})
export class ObjectPositionComponent implements OnInit {
	enable: any = 0;
	canvas: any;
	positionY: any = 0;
	positionX: any = 0;
	obj: any;
	componentHide: any = true;
	posleft: any;
	postop: any;

	// max allowed values
	public maxX: number;
	public maxY: number;
	public minX: number = 0;
	public minY: number = 0;

	// for undo redo
	public preObjPositionValues: any = [];

	constructor(
		public mainService: MainService,
		private cacheService: CacheService,
		public canvasService: CanvasService,
		private pubsub: PubSubService, public tabsService: TabsService
	) {
		this.tabsService.registerTabs('object-position', 'plain-text');
		this.tabsService.registerTabs('object-position', 'clipart');
		this.tabsService.registerTabs('object-position', 'image-upload');
		this.tabsService.registerTabs('object-position', 'name-number');
		this.tabsService.registerTabs('object-position', 'common');
	}

	ngOnInit() {
		this.maxX = 100;
		this.maxY = 100;
		this.pubsub.$sub('objectAdded', (obj) => {
			this.setXYPostion(obj);
			this.componentHide = (this.canvasService.getActiveObject() && obj.ultimatelock != true) ? null : true;
		});

		this.pubsub.$sub('objectUpdated', (obj) => {
			obj = (Array.isArray(obj)) ? obj[0] : obj;
			// obj = (obj.hasOwnProperty('_objects') && obj._objects.length) ? obj._objects : obj;
			this.setXYPostion(obj);
		});
		this.pubsub.$sub('canvasObjectModified', (obj) => {
			obj = (Array.isArray(obj)) ? obj[0] : obj;
			// obj = (obj.hasOwnProperty('_objects') && obj._objects.length) ? obj._objects : obj;
			this.setXYPostion(obj);
		});
		this.pubsub.$sub('canvasObjectScaled', (obj) => {
			this.setXYPostion(obj);
		});
		this.pubsub.$sub('objectSelectionUpdated', (obj) => {
			this.setXYPostion(obj);
			this.componentHide = (this.canvasService.getActiveObject() && obj.ultimatelock != true) ? null : true;
		});
		this.pubsub.$sub('objectSelectionCreated', (obj) => {
			this.componentHide = (this.canvasService.getActiveObject() && obj.ultimatelock != true) ? null : true;
			this.setXYPostion(obj);
		});
		this.pubsub.$sub('objectSelectionCleared', () => {
			this.componentHide = (this.canvasService.getActiveObject()) ? null : true;
		});
		this.pubsub.$sub('objectRemoved', (obj) => {
			obj = (Array.isArray(obj)) ? obj[0] : obj;
			this.setXYPostion(obj);
			this.componentHide = (this.canvasService.getActiveObject()) ? null : true;
		});
		this.pubsub.$sub('alignment', (data) => {
			if (data.option == 'right' || data.option == 'left' || data.option == 'alignHorizontalCenter')
				this.posleft = data.newVal;
			else
				this.postop = data.newVal;
			console.log(this.posleft);
		});
	}

	setXYPostion(obj) {
		this.setMaxLeftTop(obj);
		if (obj.originY == 'center') {
			this.positionX = obj.left - obj.width / 2;
		}
		else {
			this.positionX = obj.left;
		}
		if (obj.originY == 'center') {
			this.positionY = obj.top - obj.height / 2;
		}
		else {
			this.positionY = obj.top;
		}
	}

	setMaxLeftTop(obj) {
		let clipX = this.canvasService.clipX[this.canvasService.currentCanvas.dim.designareaId] / 2,
			clipY = this.canvasService.clipY[this.canvasService.currentCanvas.dim.designareaId] / 2;
		this.minX = clipX;
		this.minY = clipY;
		let objWidth = obj.width;
		let objHeight = obj.height;
		this.maxX = this.canvasService.currentCanvas.width - (objWidth * obj.scaleX) - clipX;
		this.maxY = this.canvasService.currentCanvas.height - (objHeight * obj.scaleY) - clipX;
	}

	// changePositionY() {
	// 	// let selectedObj = this.canvasService.currentCanvas.getActiveObjects(),
	// 	// 	position: any = null;
	// 	// selectedObj.filter(currObj => {
	// 	// 	position = this.positionY;
	// 	// 	if (currObj.originY == 'center') {
	// 	// 		position = this.positionY + currObj.height / 2;
	// 	// 	}
	// 	// 	currObj.top = position;
	// 	// });
	// 	// this.canvasService.currentCanvas.renderAll();
	// 	let selectedObj = this.canvasService.currentCanvas.getActiveObjects(),
	// 		position: any = null;
	// 	// this.canvasService.deselectAllObjects();
	// 	selectedObj.filter(currObj => {
	// 		position = this.positionY;
	// 		if (currObj.originY == 'center') {
	// 			position = this.positionY + currObj.height / 2;
	// 		}
	// 		currObj.top = position;
	// 	});
	// 	this.canvasService.currentCanvas.renderAll();
	// 	//this.pubsub.$pub('selectThisObjects', selectedObj);
	// }

	changePositionY() {
		let activeObj = this.canvasService.getActiveObject();
		if (!activeObj) return;
		let params = {
			obj: activeObj,
			properties: Object.assign({}, { top: this.positionY }),
			crudServiceString: 'this.updateObjectService',
			setActive: false,
			preventDeselection: false
		};
		this.canvasService.objectCRUD(params);
	}
	// changePositionX() {
	// 	let selectedObj = this.canvasService.currentCanvas.getActiveObjects(), activeObj = this.canvasService.currentCanvas.getActiveObject(),
	// 		position: any = null, params = {
	// 			obj: null, properties: null, crudServiceString: 'this.updateObjectService', setActive: false
	// 		};
	// 	//this.canvasService.deselectAllObjects();
	// 	selectedObj.filter(currObj => {
	// 		position = this.positionX;
	// 		if (currObj.originX == 'center') {
	// 			position = this.positionX + currObj.height / 2;
	// 		}
	// 		params.obj = currObj;
	// 		params.properties = Object.assign({}, { left: position });
	// 		activeObj.left = position;
	// 		// currObj.left = position;

	// 	});
	// 	// this.canvasService.objectCRUD(params);
	// 	this.canvasService.currentCanvas.renderAll();
	// 	// this.pubsub.$pub('selectThisObjects', selectedObj);
	// }

	changePositionX() {
		let activeObj = this.canvasService.getActiveObject();
		if (!activeObj) return;
		let params = {
			obj: activeObj,
			properties: Object.assign({}, { left: this.positionX }),
			crudServiceString: 'this.updateObjectService',
			setActive: false,
			preventDeselection: false
		};
		this.canvasService.objectCRUD(params);
	}
	clear() {
		let canvas = this.canvasService.currentCanvas;
		let selectedObj = canvas.getActiveObject(), posmiddle, poscenter, params = {
			obj: selectedObj,
			properties: null,
			crudServiceString: 'this.updateObjectService',
			setActive: false,
			preventDeselection: false
		};
		posmiddle = (canvas.height / 2) - (selectedObj.height * selectedObj.scaleY / 2);
		poscenter = (canvas.width / 2) - (selectedObj.width * selectedObj.scaleX / 2);

		params.properties = Object.assign({}, { top: posmiddle, left: poscenter });
		this.canvasService.objectCRUD(params);

		this.positionX = poscenter;
		this.positionY = posmiddle;
	}
	// clear() {
	// 	let canvas = this.canvasService.currentCanvas;
	// 	let selectedObj = canvas.getActiveObjects(), posmiddle, poscenter, params = {
	// 		obj: null,
	// 		properties: null,
	// 		crudServiceString: 'this.updateObjectService',
	// 		setActive: false
	// 	}, self = this;
	// 	this.canvasService.deselectAllObjects();
	// 	selectedObj.filter(obj => {
	// 		let posmiddle = (canvas.height / 2) - (obj.height * obj.scaleY / 2);
	// 		var poscenter = (canvas.width / 2) - (obj.width * obj.scaleX / 2);
	// 		let properties = {};

	// 		if (obj) {
	// 			if (obj.originX == 'center') {
	// 				poscenter = canvas.width / 2;
	// 			}
	// 			if (obj.originY == 'center') {
	// 				posmiddle = canvas.height / 2;
	// 			}
	// 			properties = { top: posmiddle, left: poscenter };
	// 			params.obj = obj;
	// 			params.properties = Object.assign({}, properties);
	// 			self.canvasService.objectCRUD(params);
	// 		}
	// 	});
	// 	// this.canvasService.currentCanvas.renderAll();
	// 	this.pubsub.$pub('selectThisObjects', selectedObj);

	// 	this.positionX = '';
	// 	this.positionY = '';
	// 	// obj.setCoords();
	// 	// canvas.setActiveObject(obj);

	// 	// let params = {
	// 	// 	obj: obj,
	// 	// 	properties: properties,
	// 	// 	crudServiceString: 'this.updateObjectService',
	// 	// };
	// 	// canvasService.objectCRUD(params);
	// }

}
