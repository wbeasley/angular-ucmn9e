import { PriceService } from 'src/app/essentials/components/price/price.service';
import { Injectable } from '@angular/core';
import { MainService } from 'src/app/services/main.service';
import { CanvasService } from "src/app/services/canvas.service";
import { PubSubService } from 'angular7-pubsub';
import { TranslateService } from '@ngx-translate/core';
import { fabric } from 'fabric';

@Injectable({
	providedIn: 'root'
})
export class DesignService {

	public designId;
	public generateSVG;
	sameImageIdcanvasArray: any = [];

	// additionalOptions(eg nameNumber)
	public additionalOptions: any = {};

	// if design is already loaded flag
	public isDesignLoaded: boolean = false;

	cnavasCount: any = 0;
	constructor(
		public mainService: MainService,
		private eventService: PubSubService,
		private canvasService: CanvasService,
		private translate: TranslateService,
		public priceService: PriceService
		) {
		let params = this.mainService.getUrlParams(['design']);
		this.designId = params['design'];
		let self = this;
		this.eventService.$sub('allcanvasCreated', (allImageIds) => {
			if (self.designId && self.isDesignLoaded == false) {
				self.loadDesign(self.designId);
				self.isDesignLoaded = true;
			}
		});

	}
	/**
	 * Save current design
	 */
	 saveDesignData(data) {
	 	return new Promise(async (resolve, reject) => {
	 		let imageId = this.canvasService.firstImageId;
	 		let images = this.canvasService.getCanvasDataUrl(imageId);
	 		let containerCanvasesJson = this.canvasService.getCanvasToJson();
	 		this.mainService.lastSavedData.json_objects = JSON.stringify(containerCanvasesJson);
	 		data.sweetAlert = data.hasOwnProperty('sweetAlert') ? data.sweetAlert : true;
	 		let sidesAndParentImageIDs = this.fetchImageSidesParentIdsWithId(this.canvasService.allImagesWithIds);
	 		let params = {
	 			'dataUrl': images,
	 			'product_image_data': this.canvasService.allImagesWithIds[imageId],
	 			'product_id': this.mainService.productId,
	 			'canvasJson': btoa(unescape(encodeURIComponent(JSON.stringify(containerCanvasesJson)))),
	 			'customer_id': this.mainService.loggedInUserId,
	 			'scaleFactor': this.canvasService.scaleFactor,
	 			'associated_product_id': this.mainService.associatedProductId,
	 			'title': data.hasOwnProperty('title') ? data.title : '',
	 			'canvas_dataurl_file': data.hasOwnProperty('canvas_dataurl_file') ? data.canvas_dataurl_file + '.txt' : '',
	 			'sidesAndParentImageIDs': sidesAndParentImageIDs,
	 			'prices': this.mainService.otherPrices,
	 			'additional_price': this.priceService.additionalPrice,
	 			'customOptionsPrice': (data.customOptionsPrice) ? data.customOptionsPrice : '',
	 			'cartData': data.hasOwnProperty('cartData') ? data.cartData : null,
	 			'customer_comments': data.hasOwnProperty('addnote') ? data.addnote : null,
	 			'additionalOptions': this.additionalOptions
	 		}, url = 'productdesigner/Designs/SaveDesign?isAjax=true';
	 		if (data.hasOwnProperty('designId') && data.designId != null) params = Object.assign(params, { design_id: data.designId });
	 		if (data.hasOwnProperty('qty') && data.qty != null) params = Object.assign(params, { qty: data.qty });
	 		this.eventService.$pub("showMainLoader");
	 		this.mainService.post(url, params).then((resp: any) => {
	 			this.eventService.$pub("hideMainLoader");
	 			if (resp && resp.status == "success") {
	 				if (data.hasOwnProperty('closeThisModal')) {
	 					data.closeThisModal.hide();
	 				}
	 				if (resp.hasOwnProperty('titleExists') && resp.titleExists == true) {
	 					resolve({ titleExists: true, designId: resp.design_id });
	 				}
	 				else if (data.sweetAlert == true) {
	 					this.canvasService.clearHistory();
	 					this.eventService.$pub('undoRedo');
	 					if (!data.hasOwnProperty('disablePopup'))
	 						this.mainService.swal(this.translate.instant("Success"), this.translate.instant("Design saved successfully"), "success");
	 					resp.product_id = this.mainService.productId;
	 					if (params.hasOwnProperty('design_id')) resp = Object.assign(resp, { clearCache: true });
	 					this.eventService.$pub('designSaved', resp);
	 				}
	 			}
	 			resolve(resp);
	 		});
	 	});
	 }
	 fetchImageSidesParentIdsWithId(allImagesWithIds) {
	 	let sides = {};
	 	let parentImageIds = {};
	 	for (let index in allImagesWithIds) {
	 		let image = allImagesWithIds[index];
	 		sides[image.image_id] = image.image_side;
	 		parentImageIds[image.image_id] = image.parent_image_id;
	 	}
	 	return [sides, parentImageIds];
	 }

	/**
	 * Load design based on design Id
	 */
	 loadDesign(designId) {
	 	let params = { 'designId': designId, 'productId': this.mainService.productId },
	 	url = 'productdesigner/Designs/LoadDesign', cacheKey: string = 'LoadDesign' + designId + this.mainService.baseUrl;
	 	this.mainService.getData(url, params, cacheKey, null, true).then(designData => {
	 		if (designData.status == 'success') {
	 			this.canvasService.clearCanvas();
	 			designData.currentProductId = this.mainService.associatedProductId;
	 			this.eventService.$pub('loadTheseFonts', JSON.parse(designData.json_objects));
	 			this.canvasService.loadDesign(designData);
	 			this.mainService.lastSavedData.json_objects = designData.json_objects;
	 			if (designData.hasOwnProperty('prices')) {
	 				let self = this;
	 				setTimeout(() => {
	 					let pricesObj: any = atob(designData.prices);
	 					pricesObj = JSON.parse(pricesObj);
	 					self.priceService.extraPriceToBeAdded.customOptionsPrice = (pricesObj.customOptionsPrice != '') ? parseFloat(pricesObj.customOptionsPrice) : 0;
	 					pricesObj.qty = parseInt(pricesObj.qty);
	 					if (pricesObj.qty > 1) {
	 						self.priceService.extraPriceToBeAdded.productPrice = self.priceService.defaultPrice * (pricesObj.qty - 1);
	 					}
	 					self.priceService.totalQty = pricesObj.qty;
	 					self.priceService.addThisPrice();
	 				}, 500);
	 			}
	 			let self = this;
	 			setTimeout(() => {
	 				self.eventService.$pub('designLoaded', designData);
	 			}, 500);
	 		}
	 	}).catch(err => console.log(err));
	 }	

	 saveAllSidesCanvasData() {
	 	return new Promise((resolve, reject) => {
	 		let containerCanvasesKeys = Object.keys(this.canvasService.containerCanvases);
	 		let containerCanvasesKeysFlag = 0;
	 		let data = {
	 			containerCanvasesKeys: containerCanvasesKeys,
	 			containerCanvasesKeysFlag: containerCanvasesKeysFlag,
	 			timestamp: this.getCurrentDateTimeStamp()
	 		}
	 		this.saveSingleSideData(data, resolve);
	 	});
	 }
	/**
	 * Save single canvas data URL
	 */
	 saveSingleSideData(data, resolve) {
	 	let self = this;
	 	let response = this.canvasService.fetchSingleCanvasDataURL(data);
	 	if (response.status == 'pending' && Object.keys(response.canvasDataUrls).length > 0) {
	 		let url = 'productdesigner/Designs/SaveSingleSideData', params = {};
	 		params['canvasData'] = (Object.keys(response.canvasDataUrls).length > 0) ? btoa(JSON.stringify(response.canvasDataUrls)) : '';
	 		params['flag'] = data.containerCanvasesKeysFlag;
	 		params['timestamp'] = data.timestamp;
	 		this.mainService.post(url, params).then((resp: any) => {
	 			if (resp.status == 'success') {
	 				if (data.containerCanvasesKeysFlag == 0) {
	 					self.generateSVG = resp.generateSVG;
	 				}
	 				data.containerCanvasesKeysFlag++;
	 				this.saveSingleSideData(data, resolve);
	 			}
	 		});
	 	} else if (response.status == 'pending') {
	 		data.containerCanvasesKeysFlag++;
	 		this.saveSingleSideData(data, resolve);
	 	} else if (response.status == 'completed') {
	 		response.timestamp = data.timestamp;
	 		resolve(response);
	 	}
	 }
	/**
	 * Return current timestamp
	 */
	 getCurrentDateTimeStamp() {
	 	let today = new Date();
	 	let dd: any = today.getDate();
	 	let mm: any = today.getMonth() + 1;
	 	let yyyy = today.getFullYear();
	 	if (dd < 10) {
	 		dd = '0' + dd;
	 	}
	 	if (mm < 10) {
	 		mm = '0' + mm;
	 	}
	 	let to_day = mm + dd + yyyy;
	 	return to_day + today.getTime();
	 }

	 async generateSVGDesign() {
	 	this.eventService.$pub('showMainLoader');
	 	let imagesId = [];
	 	let canvasArr = this.canvasService.allImages;
	 	let index, array1 = {}, key: any, canvasSVgArr = {};
	 	for (let i = 0; i < canvasArr.length; i++) {
	 		for (let j = 0; j < canvasArr[i].dim.length; j++) {
	 			index = "@" + canvasArr[i].dim[j].image_id + "&" + canvasArr[i].dim[j].designareaId;
	 			if (!array1[canvasArr[i].image_id]) {
	 				array1[canvasArr[i].image_id] = [];
	 			}
	 			array1[canvasArr[i].image_id].push(this.canvasService.containerCanvases[index]);
	 		}
	 	}
	 	let imgIdIndex = 0;
	 	for (key in array1) {
	 		let canvas = new fabric.Canvas();
	 		let imgId = imagesId[imgIdIndex];
	 		let currentImgUrl = this.canvasService.allImagesWithIds[this.canvasService.activeImageId]['url'];
	 		let height = this.canvasService.allImages[imgIdIndex].height;
	 		let width = this.canvasService.allImages[imgIdIndex].width;
	 		imgIdIndex++;
	 		let obj = array1[key];
	 		this.cnavasCount = 0;

	 		await this.addObjTOCanvas(obj, canvas);
	 		let mainCanvas = canvas;
	 		if (mainCanvas && mainCanvas.getObjects().length > 0) {
	 			let canvasSVG = mainCanvas.toSVG();
	 			mainCanvas = "";
	 			let params = {
	 				designId: atob(this.designId),
	 				imageId: key,
	 				canvasSVG: btoa(unescape(encodeURIComponent(JSON.stringify(canvasSVG))))
	 			},
	 			url = 'productdesigner/index/generateSvg';
	 			await this.mainService.getData(url, params, null).then(response => {
	 				if (response.status == 'success' && imgIdIndex == Object.keys(array1).length) {
	 					this.eventService.$pub('hideMainLoader');
	 					this.mainService.swal('Success', 'SVG Images have been generated successfully. Click ok to redirect back', 'success')
	 					.then(() => {
	 						window.history.back();
	 					}).catch(() => this.eventService.$pub('hideMainLoader'));
	 				}
	 			}).catch(err => {
	 				console.log(err);
	 			});
	 		}
	 	}
	 	this.eventService.$pub('hideMainLoader');
	 	this.mainService.swal('Success', 'SVG Images have been generated successfully. Click ok to redirect back', 'success')
	 	.then(() => {
	 		window.history.back();
	 	}).catch(() => this.eventService.$pub('hideMainLoader'));
	 }

	 addObjTOCanvas(obj, canvas) {
	 	for (let i = 0; i < obj.length; i++) {
	 		canvas.setHeight(obj[i].size.origHeight);
	 		canvas.setWidth(obj[i].size.origWidth);
	 		let mul = this.canvasService.fetchOutPutScaleFactor(obj[i]);
	 		let canvasMul = mul / this.canvasService.scaleFactor;

	 		let actiualCanvasWidth = (obj[i].size.origWidth * obj[i].width) / (obj[i].size.toolWidth / this.canvasService.scaleFactor);
	 		let leftmul = actiualCanvasWidth / obj[i].width;
	 		let leftcanvasMul = leftmul / this.canvasService.scaleFactor;
	 		let actiualCanvasHeight = (obj[i].size.origHeight * obj[i].height) / (obj[i].size.toolHeight / this.canvasService.scaleFactor);
	 		let topmul  = actiualCanvasHeight / obj[i].height;
	 		let topcanvasMul = topmul / this.canvasService.scaleFactor;

	 		obj[i].getObjects().forEach((data) => {
	 			data.top *= topmul;
	 			data.left *= leftmul;
	 			data.left = (parseInt(obj[i].dim.x1) * leftcanvasMul) + parseInt(data.left);
	 			data.top = (parseInt(obj[i].dim.y1) * topcanvasMul) + parseInt(data.top);
	 			if (data.tab == "text") {
	 				var fontFamily = data.fontFamily;
	 				fabric.fontPaths[fontFamily] = fontFamily + '.ttf';
	 			}

	 			var clippingRect = new fabric.Rect({
	 				width: parseInt(obj[i].dim.width) * leftcanvasMul,
	 				height: parseInt(obj[i].dim.height) * topcanvasMul,
	 				top: parseInt(obj[i].dim.y1) * topcanvasMul,
	 				left: parseInt(obj[i].dim.x1) * leftcanvasMul,
	 				absolutePositioned: true
	 			});

	 			data.scaleX *= leftmul;
	 			data.scaleY *= topmul;
	 			data.clipPath = clippingRect;
	 			canvas.add(data);

	 			canvas.renderAll();

	 		});

	 	}
	 	return canvas;
	 }

	 loadSvgToString(oldCanvas, newCanvas): Promise<any> {
	 	return new Promise(async (resolve, reject) => {
	 		let self = this;
	 		if (oldCanvas && oldCanvas.getObjects().length > 0) {
	 			let svgData = oldCanvas.toSVG();
	 			fabric.loadSVGFromString(svgData, function (objects, options) {
	 				var svgobj = new fabric.Group(objects);
	 				svgobj.left = parseInt(oldCanvas.dim.x1);
	 				svgobj.top = parseInt(oldCanvas.dim.y1);
	 				svgobj.height = parseInt(oldCanvas.dim.height);
	 				svgobj.width = parseInt(oldCanvas.dim.width);
	 				newCanvas.add(svgobj).renderAll();
	 				resolve(newCanvas);
	 			});
	 		}
	 	});
	 }
	 async beforeSaveSingleSide(){
	 	return new Promise((resolve, reject) => {
	 		let containerCanvasFlag = 0;
	 		let containerCanvasesKeys = Object.keys(this.canvasService.containerCanvases);
	 		this.setBackgroundImage(containerCanvasesKeys,containerCanvasFlag,resolve);
	 	});
	 }
	 afterSaveSingleSide(){
	 	let containerCanvasFlag = 0;
	 	let containerCanvasesKeys = Object.keys(this.canvasService.containerCanvases);
	 	this.removeBackgroundImage(containerCanvasesKeys,containerCanvasFlag);
	 }
	 removeBackgroundImage(containerCanvasesKeys,containerCanvasFlag){
	 	let key = containerCanvasesKeys[containerCanvasFlag];
	 	let self = this;
	 	if(key){
	 		let canvas = this.canvasService.containerCanvases[key];
	 		let object = this.fetchPatternObjectFromCanvas(canvas);
	 		if (!object) {
	 			containerCanvasFlag++;
	 			this.removeBackgroundImage(containerCanvasesKeys,containerCanvasFlag);
	 		}else{
	 			object.opacity = 1;
	 			canvas.backgroundImage = null;
	 			containerCanvasFlag++;
	 			this.removeBackgroundImage(containerCanvasesKeys,containerCanvasFlag);
	 		}
	 	}
	 }
	 setBackgroundImage(containerCanvasesKeys,containerCanvasFlag,resolve){
	 	let key = containerCanvasesKeys[containerCanvasFlag];
	 	let self = this;
	 	if(key){
	 		let canvas = this.canvasService.containerCanvases[key];
	 		let object = this.fetchPatternObjectFromCanvas(canvas);
	 		if (!object) {
	 			containerCanvasFlag++;
	 			this.setBackgroundImage(containerCanvasesKeys,containerCanvasFlag,resolve);
	 		}else{
	 			let dataURL = object.toDataURL({
	 				format: "png",
	 				multiplier: this.canvasService.fetchOutPutScaleFactor(canvas),
	 				quality: 1.0
	 			});
	 			object.opacity = 0;
	 			canvas.renderAll();
	 			fabric.Image.fromURL(dataURL, function(img) {
	 				img.scaleToWidth((canvas.width - self.canvasService.clipX[canvas.designarea_id]));
	 				canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
	 				containerCanvasFlag++;
	 				self.setBackgroundImage(containerCanvasesKeys,containerCanvasFlag,resolve);
	 			});
	 		}
	 	}else{
	 		resolve();
	 	}
	 	
	 }
	 fetchPatternObjectFromCanvas(canvas) {
	 	let objects = canvas.getObjects();
	 	let object = objects.filter(obj => obj.isPattern == true);
	 	if (object.length > 0) {
	 		return object[0];
	 	}
	 	return false;
	 }

	}
