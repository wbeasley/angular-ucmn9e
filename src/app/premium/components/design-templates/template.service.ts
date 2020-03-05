import { Injectable } from '@angular/core';
import { MainService } from 'src/app/services/main.service';
import { CanvasService } from "src/app/services/canvas.service";
import { PubSubService } from 'angular7-pubsub';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
	providedIn: 'root'
})
export class TemplateService {

	public templateId;
	public templateTitle;
	public isPreLoaded;
	public selectedTemplateCategories = [];

	// if design is already loaded flag
	public isDesignLoaded: boolean = false;

	constructor(
		public mainService: MainService,
		private eventService: PubSubService,
		private canvasService: CanvasService,
		private translate: TranslateService
	) {
		let params = this.mainService.getUrlParams(['template']);
		this.templateId = params['template'];
		let self = this;
		this.eventService.$sub('allcanvasCreated', (allImageIds) => {
			if (self.templateId && self.isDesignLoaded == false) {
				self.loadTemplate(self.templateId);
				self.isDesignLoaded = true;
			}
		});
	}

	/**
* Save Template
*/
	saveTemplate(data) {
		return new Promise((resolve, reject) => {
			let imageId = this.canvasService.firstImageId;
			let images = this.canvasService.getCanvasDataUrl(imageId);
			let containerCanvasesJson = this.canvasService.getCanvasToJson();
			data.sweetAlert = data.hasOwnProperty('sweetAlert') ? data.sweetAlert : true;
			let params = {
				'templateId': this.templateId,
				'dataUrl': images,
				'product_image_data': this.canvasService.allImagesWithIds[imageId],
				'product_id': this.mainService.productId,
				'canvasJson': btoa(unescape(encodeURIComponent(JSON.stringify(containerCanvasesJson)))),
				'associated_product_id': this.mainService.associatedProductId,
				'title': data.hasOwnProperty('title') ? data.title : '',
				'isPreLoaded': this.isPreLoaded,
				'status': data.hasOwnProperty('status') ? data.status : 1,
				'selectedTemplateCategories': data.hasOwnProperty('selectedTemplateCategories') ? data.selectedTemplateCategories : ''
			}, url = 'designtemplates/designtemplates/SaveTemplate?isAjax=true';
			this.eventService.$pub("showMainLoader");
			this.mainService.post(url, params).then((resp: any) => {
				this.eventService.$pub("hideMainLoader");
				if (resp && resp.status == "success" && data.sweetAlert == true) {
					this.canvasService.clearHistory();
					this.eventService.$pub('undoRedo');
					this.mainService.swal(this.translate.instant("Success"), resp.message, "success");
					resp.product_id = this.mainService.productId;
					this.eventService.$pub('designSaved', resp);
				} else if (resp && resp.status == 'error' && resp.hasOwnProperty('isExists') && resp.isExists == true && data.sweetAlert == true) {
					this.mainService.swal(this.translate.instant("Success"), resp.message, "success");
				}
				resolve(resp);
			});
		});
	}
	loadTemplate(templateId) {
		let params = { 'templateId': templateId },
			url = 'designtemplates/designtemplates/LoadTemplate', cacheKey: string = 'LoadTemplate' + templateId + this.mainService.baseUrl;
		cacheKey = (this.mainService.isAdmin == true) ? null : cacheKey;
		this.mainService.getData(url, params, cacheKey, null, true).then(templateData => {
			if (templateData.status == 'success') {
				this.eventService.$pub('loadTheseFonts', JSON.parse(templateData.json_objects));
				this.setTemplateData(templateData);
				this.canvasService.clearCanvas();
				templateData.currentProductId = this.mainService.associatedProductId;
				let templateJsonData = this.setFlag(JSON.parse(templateData.json_objects));
				templateData.json_objects = templateJsonData;
				this.canvasService.loadDesign(templateData);
				this.mainService.lastSavedData.json_objects = templateData.json_objects;
			}

		}).catch(err => console.log(err));
	}
	setTemplateData(templateData) {
		this.eventService.$pub('setTemplateData', templateData);
		if (templateData.isPreLoaded == 'true') {
			this.isPreLoaded = true;
		}
		else {
			this.isPreLoaded = false;
		}
	}

	setFlag(jsonObjects) {
		let objects: any = null;
		for (let canvasKey in jsonObjects) {
			objects = (jsonObjects[canvasKey] && jsonObjects[canvasKey].hasOwnProperty('objects') && jsonObjects[canvasKey].objects.length) ? jsonObjects[canvasKey].objects : null;
			if (objects == null) continue;
			objects.filter(object => {
				object = Object.assign(object, { templateObj: true });
			});
		}
		return JSON.stringify(jsonObjects);
	}
}
