import { ConfProductAttrService } from './../conf-product-attr/conf-product-attr.service';
import { Component, OnInit } from '@angular/core';
import { MainService } from 'src/app/services/main.service';
import { CanvasService } from 'src/app/services/canvas.service';
import { DesignService } from 'src/app/services/design.service';
import { CacheService, CacheStoragesEnum } from 'ng2-cache';
import { fabric } from 'fabric';
import { PubSubService } from 'angular7-pubsub';
declare var dragscroll;
@Component({
	selector: 'design-area',
	templateUrl: './design-area.component.html',
	styleUrls: ['./design-area.component.scss']
})
export class DesignAreaComponent implements OnInit {

	public selectedOptionsString;
	public allImageDimensions: any = [];
	public allProductsData: any = [];
	public allImageIds: any = [];
	public canvasRatio;
	public activeDrag = true;
	public activeImageId: any;
	public productType: any;
	public activeDesignAreaId: any;
	public clipX: any = {};
	public clipY: any = {};
	public selected_super_attributes: any = {};
	public lowresolution: any = false;
	displayWarning: boolean = false;
	public resolution_warning: any;
	public print_warning: any;
	public imageSideTitle : any;
	constructor(
		public mainService: MainService,
		private canvasService: CanvasService,
		private cacheService: CacheService,
		private eventService: PubSubService,
		private confProductService: ConfProductAttrService,
		private designService: DesignService,
		) {
		this.eventService.$sub('objectSelectionUpdated', (obj) => {
			this.activeDrag = false;
			setTimeout(function () {
				dragscroll.reset();
			}, 100);
		});
		this.eventService.$sub('objectSelectionCreated', (obj) => {
			this.activeDrag = false;
			setTimeout(function () {
				dragscroll.reset();
			}, 100);

		});
		this.eventService.$sub('objectSelectionCleared', (obj) => {
			this.activeDrag = true;
			setTimeout(function () {
				dragscroll.reset();
			}, 100);
		});

	}

	ngOnInit() {
		this.getProductParams();
		this.loadProduct(this.selected_super_attributes);
		this.subscribeEvents();
		this.getConfiguration();
	}

	ngAfterViewInit() {
		this.eventService.$sub('designLoaded', (data) => {
			if (this.mainService.isGenerateSVGDesign) {
				for (let key of Object.keys(this.canvasService.containerCanvases)) {
					let canvas = this.canvasService.containerCanvases[key];
					let obj, canvasObjects = this.canvasService.getObjects(canvas);
					for (obj of canvasObjects) {
						let properties = { selectable: false };
						this.canvasService.deselectAllObjects();
						if (obj) {
							let params = {
								obj: obj,
								properties: properties,
								crudServiceString: 'this.updateObjectService',
								canvas: canvas
							};
							this.canvasService.objectCRUD(params);
						}

					}
				}
				let designArea = document.getElementsByClassName('design-container');
				for (let i = 0; i < designArea.length; i++) {
					designArea[i].children[1].innerHTML = '<style></style>';
				}
			}
		});
	}


	/**
	 * fetch Product's options
	 * @return Object
	 */
	 getProductParams() {
	 	let super_attributes = <any>document.getElementsByClassName("super_attribute");
	 	for (var i = 0; i < super_attributes.length; i++) {
	 		let super_attribute = super_attributes[i];
	 		if (super_attribute.value) {
	 			this.selected_super_attributes[super_attribute.dataset.attrId] = super_attribute.value;
	 		}
	 	}
	 	return this.selected_super_attributes;
	 }

	/**
	* Events are been published from several components
	* Whichever events are required to be subscribed in this component, this method will handle it
	*/
	subscribeEvents() {

		// For Low resolution Warning
		let self = this;
		this.eventService.$sub('canvasObjectScaled', (obj) => {
			this.lowresolution = this.canvasService.calculateLowResolutionWarning();
		});
		this.eventService.$sub('objectAdded', (obj) => {
			this.lowresolution = this.canvasService.calculateLowResolutionWarning();
		});
		this.eventService.$sub('objectUpdated', (obj) => {
			this.lowresolution = this.canvasService.calculateLowResolutionWarning();
			this.objOutsideDesignArea();
		});
		this.eventService.$sub('objectRemoved', (obj) => {
			this.lowresolution = this.canvasService.calculateLowResolutionWarning();
			this.displayWarning = false;
		});

		// Subscribe Image Side change event to set current image id
		this.eventService.$sub('imageSideChangeBefore', (data) => {
			// this.canvasService.deselectAllObjects();
			if (typeof data == 'object' && data.hasOwnProperty('image_id')) {
				this.setCurrentImageId(data.image_id, data.design_area_id);
			} else {
				this.setCurrentImageId(data);
			}
			this.imageSideTitle = this.canvasService.currentCanvas.image_title;
		});

		// Subscribe product change event to load associated product
		this.eventService.$sub('productChanged', (selectedOption) => {
			this.eventService.$pub('showMainLoader');
			this.loadSelectedAssociatedProduct(selectedOption);
			setTimeout(() => {
		      this.canvasService.forceLoadFirstSide();
		    }, 500);
		});

		// Subscribe product zoom
		this.eventService.$sub('zoomCanvas', (zoom) => {
			this.reGenerateCanvas(zoom);
		});

		// Subscribe product zoom
		this.eventService.$sub('windowResize', () => {
			/**
			 * This method will update canvas based on window size
			 */
			 this.reGenerateCanvas(this.canvasService.zoom);
			});

		this.eventService.$sub('canvasObjectModified', (obj) => {
			this.lowresolution = this.canvasService.calculateLowResolutionWarning();
			this.objOutsideDesignArea();
		});
	}

	/**
	* [Load Product Images, Dimensions and image sides]
	*/
	loadProduct(selectedOptions) {
		let selectedOptionsString = '';
		if (selectedOptions) {
			selectedOptionsString = this.mainService.joinObject(selectedOptions);
		}

		let designId = (this.designService.designId) ? this.designService.designId : '';
		/**
		 * Dynamic Key
		 */
		 let optionCacheKey = '';
		 for (var option of this.mainService.otherOptions) {
		 	let key = Object.keys(option)[0];
		 	let value = Object.values(option)[0];
		 	optionCacheKey += key + '_' + value;
		 }
		 let params = {
		 	'product_id': this.mainService.productId,
		 	'selectedOptions': selectedOptions,
		 	'otherOptions': this.mainService.otherOptions,
		 	'optionCacheKey': optionCacheKey
		 }, url = 'productdesigner/index/loadProduct', cacheKey: string = 'loadProduct' + this.mainService.productId + '-' + this.mainService.baseUrl + selectedOptionsString + designId + optionCacheKey;
		 params = (this.designService.designId) ? Object.assign(params, { designId: this.designService.designId }) : params;
		 this.mainService.getData(url, params, cacheKey).then(data => {
		 	if (data && data.productType) this.mainService.productType = data.productType;
		 	if (data && data.associatedProductId) this.canvasService.associatedProductId = data.associatedProductId;
		 	this.confProductService.defaultSelectedOptionsValues = data.selectedOptionsValues;
		 	this.processLoadProduct(data);
		 	this.mainService.loadedProductData = data;
		 	this.eventService.$pub('loadProduct', data);

		 	if (data.productType == "simple") {
		 		this.cacheService.set("product-tooltip-data", false, { maxAge: 0 });
		 	}

		 }).catch(err => console.log(err));
		}


	/**
	Get Configuration
	**/
	getConfiguration() {
		let configPaths = [
		'productdesigner/dynamic_message/print_area_warning',
		'productdesigner/dynamic_message/low_resolution_warning'
		];
		let params = { configPaths, key: 'warning-messages' }, url = 'productdesigner/index/getConfiguration', cacheKey: string = 'configuration-warning-messages' + this.mainService.baseUrl;
		this.mainService.getData(url, params, cacheKey).then(data => {
			this.print_warning = (data[0] != null) ? data[0] : 'Some objects are outside the printing area and should be adjusted';
			this.resolution_warning = (data[1] != null) ? data[1] : 'Low Resolution Warning';
		}).catch(err => console.log(err));
	}

	/**
	* [Process response data of load Product request]
	* @param {object} data [product image, dimesions, image sides data]
	*/
	processLoadProduct(data) {
		this.productType = data.productType;
		if (data.dimensions.length > 0) {
			this.mainService.loadedProductData = data;
			this.canvasService.allImages = this.allImageDimensions = data.dimensions;
			this.mainService.associatedProductId = data.associatedProductId;
			this.selectedOptionsString = this.mainService.joinObject(data.selectedOptions);
			this.mainService.selectedProductOptions = data.selectedOptions;
			this.allProductsData[this.selectedOptionsString] = data;
			/**
			 * [activeImageId set active image side]
			 */
			 this.canvasService.firstImageId = this.canvasService.activeImageId = this.activeImageId = data.dimensions[0].image_id;
			 this.canvasRatio = data.canvasRatio;
			 let self = this;
			 setTimeout(function () {
			 	self.createCanvas(data);
			 }, 100);
			}
			this.eventService.$pub('processLoadProduct');
		}
	/**
	* [Create canvas based on load product data]
	* @param  data [dimension data]
	*/
	createCanvas(data) {
		/**
		 * [All images dimesions]
		 */
		 this.allImageIds = [];
		 this.canvasService.containerCanvases = [];
		 this.canvasService.allImagesWithIds = {};
		 for (let key in this.allImageDimensions) {
		 	let currentImage = this.allImageDimensions[key];
		 	this.allImageIds.push(currentImage.image_id);
		 	this.canvasService.allImagesWithIds[currentImage.image_id] = currentImage;
		 	let counter = 0;
		 	for (let key in currentImage.dim) {
		 		let dim = currentImage.dim[key];
		 		this.initCanvasRatio(dim, currentImage);
		 		let canvas = new fabric.Canvas('canvas-' + dim.designareaId, {
		 			selection: this.mainService.enableMultipleSelection
		 		});
		 		canvas.setHeight(this.calCulateDimWithCanvasRatio(dim, 'height'));
		 		canvas.setWidth(this.calCulateDimWithCanvasRatio(dim, 'width'));
		 		canvas.renderAll();
		 		this.setCanvasProperties(canvas, dim, currentImage);
		 		if (dim.mask) {
		 			this.applyMakig(canvas, dim);
		 		}else{
		 			this.clipCanvas(canvas, dim);
		 		}
		 		this.eventService.$pub('canvasCreated', canvas);
				/**
				 * [All dimensions of single image]
				 */
				 this.canvasService.containerCanvases['@' + currentImage.image_id + '&' + dim.designareaId] = canvas;
				/**
				 * Set design area black border
				 */
				 this.setDesignAreaBorder(dim, '');
				/**
				 * [if image id is active image side and first dimension]
				 */
				 if (currentImage.image_id == this.activeImageId && counter == 0) {
				 	this.canvasService.currentCanvas = canvas;
				 	this.activeDesignAreaId = dim.designareaId;
				 	this.setDesignAreaBorderCurrentCanvas(dim.designareaId);
				 }
				 counter++;
				}
			}
			this.imageSideTitle = this.canvasService.currentCanvas.image_title;

			this.eventService.$pub('allcanvasCreated', this.allImageIds);
			setTimeout(() => {
				this.eventService.$pub('hideMainLoader');
			}, 300);
		}
	/**
	* [set properites of canvas]
	* @param  canvas       [current canvas]
	* @param  dim          [current dimension]
	* @param  currentImage [current image data]
	*/
	setCanvasProperties(canvas, dim, currentImage) {
		canvas.controlsAboveOverlay = true;
		canvas.preserveObjectStacking = true;
		canvas.stateful = true;
		canvas.designarea_id = dim.designareaId;
		canvas.image_id = dim.image_id;
		canvas.image_side = currentImage.image_side;
		canvas.image_title = currentImage.image_title;
		canvas.dim = dim;
		canvas.size = currentImage.size;
		canvas.url = currentImage.url;
		fabric.Object.NUM_FRACTION_DIGITS = 17;
	}
	/**
	* [Clip canvas based on clip value]
	* @param  canvas [current canvas]
	* @param  dim    [dimension]
	*/
	clipCanvas(canvas, dim) {
		//if(!(this.canvasService.clipX[dim.designareaId] == 0 && this.canvasService.clipY[dim.designareaId] == 0)){
			let position = this.calCulateBorderPosition(dim);
			let rect = new fabric.Rect({
				left: position['left'],
				top: position['top'],
				width: parseFloat(dim.width) / this.canvasService.scaleFactor,
				height: parseFloat(dim.height) / this.canvasService.scaleFactor,
				fill: 'transparent',
				objectCaching: false,
				selectable: false,
				originX: 'left',
				originY: 'top',
			});
		/*canvas.clipTo = function (ctx) {
			ctx.save();
			ctx.transform(canvas.getZoom(), 0, 0, canvas.getZoom(), 0, 0);
			rect.render(ctx);
			ctx.restore();
		};*/
		canvas.clipPath = rect;
	}

	applyMakig(canvas, dim) {
		const self = this;
		if (!dim.pathMasking && dim.mask) {
			fabric.loadSVGFromURL(dim.mask, (svgImgObject, options) => {
				let imgObj = fabric.util.groupSVGElements(svgImgObject, options);
				let weight = canvas.width - this.clipX[dim.designareaId];
				let height = canvas.height - this.clipY[dim.designareaId];
				imgObj.left = this.clipX[dim.designareaId] / 2;
				imgObj.top = this.clipY[dim.designareaId] / 2;
				imgObj.fill = 'transparent';
				imgObj.objectCaching = false;
				imgObj.scaleY = (height) / imgObj.height;
				imgObj.scaleX = (weight) / imgObj.width;

				/*canvas.clipTo = function (ctx) {
					ctx.save();
					ctx.transform(canvas.getZoom(), 0, 0, canvas.getZoom(), 0, 0);
					imgObj.render(ctx);
					ctx.restore();
				};*/
				canvas.clipPath = imgObj;
				canvas.renderAll();
			});
		}
	}
	/**
	* [initiate canvasRatio value based on product dimension]
	* @param  dim          [dimension]
	* @param  currentImage [current image data]
	*/
	initCanvasRatio(dim, currentImage) {
		if (currentImage.enable_handles == true) {
			if (parseFloat(dim.width) + parseFloat(this.canvasRatio) > currentImage.width) {
				this.canvasService.clipX[dim.designareaId] = this.clipX[dim.designareaId] = currentImage.width / parseFloat(dim.width);
			} else {
				this.canvasService.clipX[dim.designareaId] = this.clipX[dim.designareaId] = parseFloat(this.canvasRatio);
			}
			if (parseFloat(dim.height) + parseFloat(this.canvasRatio) > currentImage.height) {
				this.canvasService.clipY[dim.designareaId] = this.clipY[dim.designareaId] = currentImage.height / parseFloat(dim.height);
			} else {
				this.canvasService.clipY[dim.designareaId] = this.clipY[dim.designareaId] = parseFloat(this.canvasRatio);
			}
		} else {
			this.canvasService.clipX[dim.designareaId] = this.clipX[dim.designareaId] = 0;
			this.canvasService.clipY[dim.designareaId] = this.clipY[dim.designareaId] = 0;
		}
	}

	/**
	* [Set black dashed border to all canvases]
	* @param {object} dim [dimension of processed canvas]
	*/
	setDesignAreaBorder(dim, action) {
		let designArea = <HTMLInputElement>document.getElementById('designArea-' + dim.designareaId);
		if (!designArea) {
			return;
		}
		let position = this.calCulateBorderPosition(dim);
		let html = '#designArea-' + dim.designareaId + ':after{height:' + (parseFloat(dim.height) / this.canvasService.scaleFactor + 2) + 'px;width:' + (parseFloat(dim.width) / this.canvasService.scaleFactor + 2) + 'px;border:1px dashed black;position: absolute;left:' + position['left'] + 'px;top:' + position['top'] + 'px;float: left;content:""}';
		if (action == 'update') {
			designArea.children[1].innerHTML = html;
		} else {
			var style = document.createElement('style');
			style.type = 'text/css';
			style.innerHTML = html;
			designArea.appendChild(style);
		}
	}
	calCulateBorderPosition(dim) {
		let position = []
		position['left'] = ((parseFloat(dim.width) + this.clipX[dim.designareaId] - parseFloat(dim.width)) / 2) / this.canvasService.scaleFactor;
		position['top'] = ((parseFloat(dim.height) + this.clipY[dim.designareaId] - parseFloat(dim.height)) / 2) / this.canvasService.scaleFactor;
		return position;
	}
	/**
	* [change canvas on click]
	* @param  imageId      [image id of current side]
	* @param  designAreaId [designAreaId of clicked canvas]
	*/
	setActiveCanvas(imageId, designAreaId) {
		if (imageId == this.activeImageId && designAreaId == this.activeDesignAreaId) return;
		if (designAreaId == '') {
			let designarea = document.querySelectorAll('#productdesigner-image-' + imageId + ' .design-container')
			designAreaId = designarea[0].getAttribute('designareaid');
		}
		this.removeOtherActiveCanvases();
		this.setDesignAreaBorderCurrentCanvas(designAreaId);
		this.changeActiveCanvas(imageId, designAreaId);

		//setTimeout(() => {
			this.eventService.$pub('imageSideChanged', { imageId: imageId, designAreaId: designAreaId });
		//}, 200);
	}
	/**
	* [Change global var current canvas value and published event]
	* @param  imageId      [current image id]
	* @param  designAreaId [current designAreaId]
	*/
	changeActiveCanvas(imageId, designAreaId) {
		this.activeDesignAreaId = designAreaId;
		this.canvasService.currentCanvas = this.canvasService.containerCanvases['@' + imageId + '&' + designAreaId];
		let id = '@' + imageId + '&' + designAreaId;
		let oldActive = this.canvasService.currentCanvas.getActiveObject();
		for (let key of Object.keys(this.canvasService.containerCanvases)) {
			this.canvasService.containerCanvases[key].discardActiveObject().renderAll();
		}
		this.canvasService.currentCanvas.setActiveObject(oldActive).renderAll();
	}
	/**
	* [Change red border to black of all canvases on click of canvas]
	*/
	removeOtherActiveCanvases() {
		let designAreas = document.getElementsByClassName('design-container');
		for (var i = 0; i < designAreas.length; i++) {
			let designArea = designAreas[i];
			if (designArea.children[1]) {
				let html = designArea.children[1].innerHTML.replace("red", "black");
				designArea.children[1].innerHTML = html;
			}
		}
	}
	/**
	* [Set red border of design area ::after element]
	* @param  designAreaId [designAreaId of clicked canvas]
	*/
	setDesignAreaBorderCurrentCanvas(designAreaId) {
		let designArea = <HTMLInputElement>document.getElementById('designArea-' + designAreaId)
		let html = designArea.children[1].innerHTML.replace("black", "red");
		designArea.children[1].innerHTML = html;
	}
	/**
	* [Set current Image id clicked through side changed]
	* @param  image_id [image id of clicked side]
	*/
	setCurrentImageId(image_id, designAreaId: any = '') {
		this.canvasService.activeImageId = this.activeImageId = image_id;
		this.setActiveCanvas(image_id, designAreaId);
	}
	/**
	* [Calculate canvas height, width, left, top with canvasRatio]
	* @param {any}    dim  [dimension value]
	* @param  type [width/height/left/top]
	*/
	calCulateDimWithCanvasRatio(dim: any, type) {
		if (dim && this.clipX && this.clipY) {
			if (type == 'width') {
				let width: any = (parseFloat(dim.width) + this.clipX[dim.designareaId]) / this.canvasService.scaleFactor;
				return parseFloat(width);
			} else if (type == 'height') {
				let height: any = (parseFloat(dim.height) + this.clipY[dim.designareaId]) / this.canvasService.scaleFactor;
				return parseFloat(height);
			} else if (type == 'left') {
				return (dim.x1 - ((parseFloat(dim.width) + this.clipX[dim.designareaId] - parseFloat(dim.width)) / 2)) / this.canvasService.scaleFactor;
			} else if (type == 'top') {
				return (dim.y1 - ((parseFloat(dim.height) + this.clipY[dim.designareaId] - parseFloat(dim.height)) / 2)) / this.canvasService.scaleFactor;
			}
		}
	}
	calCulateImageHeightWidth(imageData, type) {
		if (type == 'width') {
			let width: any = parseFloat(imageData.width) / this.canvasService.scaleFactor;
			return parseFloat(width);
		} else if (type == 'height') {
			let height: any = parseFloat(imageData.height) / this.canvasService.scaleFactor;
			return parseFloat(height);
		}
	}
	/**
	* [load Associated Product combination as per selected options]
	* @param  selectedOptions [Options which are selected from proudct option component]
	*/
	loadSelectedAssociatedProduct(selectedOptions) {
		selectedOptions = (selectedOptions.defaultSelectedOptions) ? selectedOptions.defaultSelectedOptions : selectedOptions;
		let selectedOptionsString = this.mainService.joinObject(selectedOptions);
		if (selectedOptionsString != this.selectedOptionsString) {
			if (!this.allProductsData[selectedOptionsString]) {
				this.loadProduct(selectedOptions);
			} else {
				this.processLoadProduct(this.allProductsData[selectedOptionsString]);
			}
		} else {
			this.eventService.$pub("hideMainLoader");
		}
	}
	/**
	* [Modify current canvas properties as per zoom value]
	* @param  zoom [zoom value]
	*/
	reGenerateCanvas(zoom) {
		this.canvasService.zoom = zoom;
		this.canvasService.scaleFactor = this.canvasService.initScaleFactor();
		this.updateCanvasSize();
	}
	/**
 * [Update canvas size with scaleFactor]
 */

 updateCanvasSize() {
 	for (let key in this.canvasService.containerCanvases) {
 		let canvas = this.canvasService.containerCanvases[key];
 		canvas.setHeight(this.calCulateDimWithCanvasRatio(canvas.dim, 'height'));
 		canvas.setWidth(this.calCulateDimWithCanvasRatio(canvas.dim, 'width'));
 		this.setDesignAreaBorder(canvas.dim, 'update');
 		if (this.canvasService.currentCanvas == canvas) {
 			this.setDesignAreaBorderCurrentCanvas(canvas.dim.designareaId);
 		}
 		if (canvas.dim.mask) {
 			this.applyMakig(canvas, canvas.dim);
 		}else{
 			this.clipCanvas(canvas, canvas.dim);
 		}
 		this.canvasService.resizeCanvasObjects(canvas);
 		canvas.renderAll();
			// Timeout due to delay while updating variables
			let self = this;
			// setTimeout(function () {
				self.eventService.$pub('zoomCanvasUpdated', canvas);
			// }, 50);
		}
	}

	/**
	* [calculate width of drag container]
	* @return 
	*/
	calCulateDragContainer(type) {
		if (!this.activeDrag) {
			return null;
		}
		let element: any = document.querySelector(".byi-output");
		if (type == 'width') {
			return element.clientWidth;
		} else if (type == 'height') {
			return element.clientHeight - 45;
		}
	}

	objOutsideDesignArea() {
		let n = 0;
		let self = this;
		self.canvasService.currentCanvas.forEachObject(function (o) {
			if (o.group) {
				o = o.group;
			}
			var l = o.getBoundingRect().left;
			var t = o.getBoundingRect().top;
			/*var w = (o.getBoundingRect().width < o.width) ? o.getBoundingRect().width : o.width;
			var h = (o.getBoundingRect().height < o.height) ? o.getBoundingRect().height : o.height;*/
			var w: any = o.width * o.scaleX;
			var h: any = o.height * o.scaleY;
			var f = false;
			if (l < ((o.canvas.width - (o.canvas.width - self.canvasService.clipX[o.canvas.designarea_id])) / 2))
				f = true;
			if (t < ((o.canvas.height - (o.canvas.height - self.canvasService.clipY[o.canvas.designarea_id])) / 2))
				f = true;
			if (parseFloat(t) + parseFloat(h) > (o.canvas.height - (self.canvasService.clipY[o.canvas.designarea_id] / 2)))
				f = true;
			if (parseFloat(l) + parseFloat(w) > (o.canvas.width - (self.canvasService.clipX[o.canvas.designarea_id] / 2)))
				f = true;
			if (f) {
				n++;
			}
			if (n > 0) {
				self.displayWarning = true;
			} else {
				self.displayWarning = false;
			}
		});
	}
}
