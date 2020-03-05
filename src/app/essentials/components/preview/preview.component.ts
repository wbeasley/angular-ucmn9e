import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { PubSubService } from 'angular7-pubsub';
import { MainService } from 'src/app/services/main.service';
import { CanvasService } from 'src/app/services/canvas.service';
import { TranslateService } from '@ngx-translate/core';
import { LoaderComponent } from './../loader/loader.component';

@Component({
	selector: '[preview]',
	templateUrl: './preview.component.html',
	styleUrls: ['./preview.component.scss']
})
export class PreviewComponent implements OnInit {
	@ViewChild('loaderComponent') loaderComponent: LoaderComponent;
	modalRef: BsModalRef;
	public allImageIds: any;
	public activeImageId: any;
	public indexOfActiveImage: any;
	public enablePrev: any;
	public enableNext: any;
	public previewImages: any = {};
	zipfile: any = [];
	public firstTimeNext: boolean = true;

	constructor(
		public mainService: MainService,
		private eventService: PubSubService,
		private canvasService: CanvasService,
		private translate: TranslateService,
	) {
		// call to method that will create initial events
		this.initiateEvents();
	}

	ngOnInit() {
	}

	initiateEvents() {
		this.eventService.$sub('allcanvasCreated', (allImageIds) => {
			this.allImageIds = allImageIds;
			this.changePreviewSide(allImageIds[0], false);
		});
		this.eventService.$sub('objectUpdated', () => {
			this.mainService.objectModification = true;
		});
		this.eventService.$sub('objectRemoved', () => {
			this.mainService.objectModification = true;
			this.previewImages[this.canvasService.activeImageId] = '';
			this.mainService.generatedImage[this.canvasService.activeImageId] = '';
		});
		this.eventService.$sub('objectAdded', () => {
			this.mainService.objectModification = true;
		});
		this.eventService.$sub('canvasBackgroundChange', () => {
			this.mainService.objectModification = true;
		});
		this.eventService.$sub('backgroundPatternsApplied', () => {
			this.mainService.objectModification = true;
		});
	}

	async createPreview(template: TemplateRef<any>) {
		this.loaderComponent.showMainLoader = true;
		await this.getCanvasDataUrl(true, '');
		this.loaderComponent.showMainLoader = false;
		this.modalRef = this.mainService.openThisModal(template, 'byi-preview-modal modal-lg');
	}

	changePreviewSide(image_id, generatePreview) {
		this.activeImageId = image_id;
		this.indexOfActiveImage = this.allImageIds.indexOf(image_id);
		this.updateNextPrev();
		if (generatePreview) {
			this.getCanvasDataUrl(false, image_id);
		}
	}

	changeNextPrevPreviewSide(type) {
		if (this.mainService.objectModification == true || this.firstTimeNext == true) {
			this.mainService.objectModification = true;
			this.firstTimeNext = false;
		}

		this.indexOfActiveImage = this.allImageIds.indexOf(this.activeImageId);
		let updatedImageId;
		if (type == 'prev') {
			updatedImageId = this.allImageIds[this.indexOfActiveImage - 1];
		} else if (type == 'next') {
			updatedImageId = this.allImageIds[this.indexOfActiveImage + 1];
		}
		if (updatedImageId) {
			this.changePreviewSide(updatedImageId, true);
		}
	}

	updateNextPrev() {
		if (this.allImageIds[this.indexOfActiveImage - 1]) {
			this.enablePrev = 1;
		} else {
			this.enablePrev = 0;
		}
		if (this.allImageIds[this.indexOfActiveImage + 1]) {
			this.enableNext = 1;
		} else {
			this.enableNext = 0;
		}
	}

	async getCanvasDataUrl(isFirst, currentImageId) {
		if (isFirst) {
			currentImageId = this.canvasService.activeImageId;
		}
		let response: any;

		if (!this.previewImages[currentImageId] || this.previewImages[currentImageId] == '' || this.mainService.objectModification == true) {
			response = await this.mainService.getCanvasDataUrl(isFirst, currentImageId, false);
		} else {
			response = this.mainService.generatedImage[currentImageId];
		}
		this.previewImages[currentImageId] = response.base.url;

		this.changePreviewSide(currentImageId, false);
	}

	downloadFunction() {
		let imageIds: any = this.canvasService.allImagesWithIds;
		let images = [];
		for (let id in imageIds) {
			images.push(this.canvasService.getCanvasDataUrl(id));
		}
		let params = {
			'dataUrl': images,
			'product_image_data': this.canvasService.allImagesWithIds,
			'previewImages': 1
		}
		this.mainService.post('productdesigner/index/download', params).then((data: any) => {
			this.zipfile = data.zipfile;
			this.mainService.downloadFiles(this.zipfile, 'zip');
		}).catch(err => {
			console.log(this.translate.instant("Error in loading download"), err);
		});
	}
}
