import { Component, OnInit, ViewChild } from '@angular/core';
import { PubSubService } from 'angular7-pubsub';
import { CanvasService } from 'src/app/services/canvas.service';
import { RightPanelService } from '../right-panel/right-panel.service';
declare var fabric: any;

@Component({
	selector: 'layer-management',
	templateUrl: './layer-management.component.html',
	styleUrls: ['./layer-management.component.scss']
})
export class LayerManagementComponent implements OnInit {
	isEnableLayer: any = false;
	layerArray: any = [];
	objCounter: any = 0;
	showLayer: any = false;
	currentObjId: any;
	hideShowClass: any = false;
	isImageSideChange: boolean = false;
	uniqueObj = [];

	constructor(
		public canvasService: CanvasService,
		private eventService: PubSubService,
		public rightPanelService: RightPanelService
	) {

	}

	ngOnInit() {
		this.subscribeEvents();
	}

	initData() {
		this.rightPanelService.enableForMultipleObject();
		this.checkForLayers();
	}

	subscribeEvents() {
		this.eventService.$sub('objectAdded', (object) => {
			this.initData();
			this.updateLayers();
		});
		this.eventService.$sub('objectSelectionCreated', (object) => {
			this.initData();
			this.currentObjId = object.id;
		});
		this.eventService.$sub('objectUpdated', () => {
			this.initData();
		});
		this.eventService.$sub('canvasObjectModified', () => {
			this.initData();
		});
		this.eventService.$sub('imageSideChanged', () => {
			this.initData();
		});
		this.eventService.$sub('backgroundPatternsApplied', () => {
			this.updateLayers();
		});
		this.eventService.$sub('allcanvasCreated', (object) => {
			this.updateLayers();
		});

		this.eventService.$sub('imageSideChangeBefore', (object) => {
			this.isImageSideChange = true;
			this.updateLayers();
		});

		this.eventService.$sub('objectSelectionUpdated', (object) => {
			this.currentObjId = object.id;
		});

		this.eventService.$sub('objectSelectionCleared', () => {
			this.currentObjId = '';
			this.showLayer = false;
		});

		this.eventService.$sub('objectRemoved', (removedObject) => {
			this.updateLayers();
		});

		this.eventService.$sub('closeLayer', () => {
			this.showLayer = false;
		});
	}

	updateLayers() {
		this.layerArray = [];
		for (let key of Object.keys(this.canvasService.containerCanvases)) {
			let canvas = this.canvasService.containerCanvases[key];
			if (canvas != undefined) {
				let getObjs = this.canvasService.getObjects(canvas);
				if (getObjs.length > 0) {
					getObjs.filter(object => {
						object = (object.imageSrc) ? Object.assign(object, { src: object.imageSrc }) : object;
						this.layerArray.push(object);
					});

				}
			}
		}

		this.isEnableLayer = (this.layerArray.length > 0) ? true : false;
		// this.showLayer = (this.isEnableLayer == false) ? false : '';
		if (this.isEnableLayer == false) this.showLayer = false;
		this.layerArray = (this.isEnableLayer == false) ? [] : this.layerArray;
		this.checkForLayers();
	}

	checkSelectable(obj) {
		return (obj.selectable) ? true : false;
	}

	hideShow(obj) {
		let properties = {};
		if (obj.opacity == 0 || obj.opacity == undefined) {
			this.hideShowClass = false;
			properties = { opacity: 1, hasControls: true, hasBorders: true };
		} else {
			this.hideShowClass = true;
			properties = { opacity: 0, hasControls: false, hasBorders: false };
		}
		let params = {
			obj: obj,
			properties: properties,
			crudServiceString: 'this.updateObjectService',
		};

		let allObj = this.canvasService.getObjects();
		let found = allObj.indexOf(allObj.find(currObj => (currObj == obj)));
		if (found == -1) {
			params = Object.assign(params, { setActive: false });
		}
		this.canvasService.objectCRUD(params);
	}

	lockObject(obj) {
		let properties = {};
		if (obj.selectable == false) {
			properties = { selectable: true };
		} else {
			properties = { selectable: false };
			this.canvasService.deselectAllObjects();
		}
		if (obj) {
			let params = {
				obj: obj,
				properties: properties,
				crudServiceString: 'this.updateObjectService',
			};
			let allObj = this.canvasService.getObjects();
			let found = allObj.indexOf(allObj.find(currObj => (currObj == obj)));
			if (found == -1) {
				params = Object.assign(params, { setActive: false });
			}
			this.canvasService.objectCRUD(params);
		}
	}

	showLayers() {
		if (this.showLayer == false) {
			this.showLayer = true;
		} else {
			this.showLayer = false;
		}
	}

	deleteObj(object) {
		let self = this;
		for (let key of Object.keys(this.canvasService.containerCanvases)) {
			let canvas = this.canvasService.containerCanvases[key];
			if (canvas != undefined) {
				let objs = this.canvasService.getObjects(canvas);
				objs.forEach(function (obj, index) {
					if (object.id == obj.id) {
						let params = {
							obj: object,
							canvas: canvas,
							properties: null,
							crudServiceString: 'this.removeObjectService',
						};
						self.canvasService.objectCRUD(params);
						// self.canvasService.currentCanvas.discardActiveObject();
						// self.canvasService.currentCanvas.requestRenderAll();
					}
				});
			}
		}
	}

	selectThisObject(object) {
		// if selected object is not present in current canvas
		// we will find that canvas and update the same
		if (object.selectable == true) {
			if (this.canvasService.getObjects().indexOf(object) == -1) {

				// local vars
				let allCanvas = this.canvasService.containerCanvases, allObj, found, canvas, index = 0;

				// traversal
				for (let key in allCanvas) {
					allObj = allCanvas[key].getObjects();
					found = allObj.indexOf(object);
					if (found >= 0) {
						canvas = allCanvas[key];//Object.assign({}, allCanvas[key]);
						break;
					}
					index++;
				}

				// if we found image id and index after traversal finished,
				// proceed to change side
				if (found >= 0) {
					this.eventService.$pub('changeImageSide', { canvas: canvas, index: index });
					canvas.setActiveObject(object).renderAll();
				}

				// otherwise select object in current canvas
			} else {
				this.canvasService.currentCanvas.setActiveObject(object).renderAll();
			}
		}
	}

	checkForLayers() {
		let allObj = this.canvasService.getObjects(), index, isCurrentCanvasObj;
		this.layerArray.filter(obj => {
			index = allObj.indexOf(obj);
			if (index == -1 || allObj.length == 1) {
				obj.disableSendToBack = true;
				obj.disableBringToFront = true;
			}
			else if (index == 0) {
				obj.disableSendToBack = true;
				if (obj.hasOwnProperty('disableBringToFront')) delete obj.disableBringToFront;
			} else if (index == allObj.length - 1) {
				obj.disableBringToFront = true;
				if (obj.hasOwnProperty('disableSendToBack')) delete obj.disableSendToBack;
			} else {
				if (obj.hasOwnProperty('disableBringToFront')) delete obj.disableBringToFront;
				if (obj.hasOwnProperty('disableSendToBack')) delete obj.disableSendToBack;
			}
		});
	}
}
