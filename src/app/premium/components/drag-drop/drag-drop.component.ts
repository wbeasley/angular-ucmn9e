import { Component, OnInit } from '@angular/core';
import { PubSubService } from 'angular7-pubsub';
import { CanvasService } from 'src/app/services/canvas.service';
import { AddImageService } from 'src/app/services/add-image.service';
import { MainService } from 'src/app/services/main.service';
declare var fabric: any;

@Component({
	selector: '[drag-drop]',
	templateUrl: './drag-drop.component.html',
	styleUrls: ['./drag-drop.component.scss']
})
export class DragDropComponent implements OnInit {

	public images: any;
	public droppedElement: any;
	constructor(
		public canvasService: CanvasService,
		public mainService: MainService,
		private addImageService: AddImageService,
		private pubsub: PubSubService
	) {
		this.subscribeEvents();
	}

	ngOnInit() { }

	subscribeEvents() {
		this.pubsub.$sub('fileUploaded', () => {
			let self = this;
			setTimeout(function () {
				self.initDrag();
			})
		});
		this.pubsub.$sub('allcanvasCreated', () => {
			let self = this;
			setTimeout(function () {
				self.initDrop();
			})
		});
		this.pubsub.$sub('removeOverlay', () => {
			this.removeOverlay();
		})
	}

	initDrag() {
		let self = this;
		this.images = document.querySelectorAll('.byidraggable');
		let tab = (this.images[0]) ? this.images[0].getAttribute('tab') : '',
			errorFlag: boolean = false, imageUploaded: number = this.canvasService.getObjectTypeFromAllCanvas('tab', tab);
		for (let i = 0; i < this.images.length; i++) {
			let img: any = this.images[i];
			img.addEventListener('dragstart', function (e) {
				for (let i = 0; i < self.images.length; i++) {
					let img: any = self.images[i];
					img.classList.remove('img_dragging');
				}
				this.classList.add('img_dragging');
			});
			img.addEventListener('dragend', function (e) {
				for (let i = 0; i < self.images.length; i++) {
					let img: any = self.images[i];
					img.classList.remove('img_dragging');
				}
			});
			if (img.getAttribute("drop") == 'true') {
				if (imageUploaded >= this.canvasService.objectLimit.uploadImageLimit) {
					errorFlag = true;
					break;
				} else {
					self.addDroppedImageToCanvas(self.droppedElement, img);
					imageUploaded++;
					img.setAttribute("drop", null);
				}
			}
		}
		this.removeOverlay();
		if (errorFlag) {
			let eventName = 'displayUploadImageLimitError';			
			this.canvasService.eventService.$pub(eventName);
		}
	}

	initDrop() {
		let self = this;
		window.addEventListener("dragenter", function (e) {
			let canvasContainers = document.querySelectorAll('.design-container');
			for (let i = 0; i < canvasContainers.length; i++) {
				let parentNode: any = canvasContainers[i].parentElement;
				if (parentNode.classList.contains('active')) {
					canvasContainers[i].classList.add('byi-droppable');
					let element = document.createElement("div");
					element.className = 'byi-droppable-overlay';
					element.innerHTML = '<span class="upload-icon"><svg class="icon icon-upload" viewBox="0 0 30 30"><use xlink:href="assets/img/sprite.svg#icon-upload"></use></svg></span><span>drag it here.</span>';
					if (canvasContainers[i] && (!canvasContainers[i].firstElementChild.classList.contains("byi-droppable-overlay"))) {
						canvasContainers[i].prepend(element);
					}
				}
			}
			let imageUploadContainers = document.querySelector('.byi-tooltip-imageUploadComponent');
			if (imageUploadContainers) {
				imageUploadContainers.classList.add('byi-droppable');
			}
		}, false);
		window.addEventListener("dragover", function (e) {

			e.preventDefault();
		}, false);
		window.addEventListener("drop", function (e: any) {
			let canvasContainers = document.querySelectorAll('.design-container');
			for (let i = 0; i < canvasContainers.length; i++) {
				canvasContainers[i].classList.remove('byi-droppable');
				if (canvasContainers[i].firstElementChild.classList.contains("byi-droppable-overlay")) {
					canvasContainers[i].firstElementChild.remove();
				}
			}
			let imageUploadContainers = document.querySelector('.byi-tooltip-imageUploadComponent');
			if (imageUploadContainers) {
				imageUploadContainers.classList.remove('byi-droppable');
			}
			if (e.target) {
				if (e.target.type == "file") {
					return;
				} else {
					e.preventDefault();
				}
			}
		}, false);
		window.addEventListener("dragleave", function (e) {
			let canvasContainers = document.querySelectorAll('.design-container');
			for (let i = 0; i < canvasContainers.length; i++) {
				if (e.relatedTarget == canvasContainers[i] || e.relatedTarget == undefined) {
					canvasContainers[i].classList.remove('byi-droppable');
					if (canvasContainers[i].firstElementChild.classList.contains("byi-droppable-overlay")) {
						canvasContainers[i].firstElementChild.remove();
					}
				}
			}
			let imageUploadContainers = document.querySelector('.byi-tooltip-imageUploadComponent');
			if (e.relatedTarget == imageUploadContainers || e.relatedTarget == undefined) {
				if (imageUploadContainers) {
					imageUploadContainers.classList.remove('byi-droppable');
				}
			}
			e.preventDefault();
		}, false);
		let canvasContainers = document.querySelectorAll('.design-container');
		for (let i = 0; i < canvasContainers.length; i++) {
			let canvasContainer = canvasContainers[i];

			canvasContainer.addEventListener('dragenter', function (e: any) {
				e.target.classList.add('over');
			}, false);
			canvasContainer.addEventListener('dragover', function (e: any) {
				if (e.preventDefault) {
					e.preventDefault();
				}
				e.dataTransfer.dropEffect = 'copy';
				return false;
			}, false);
			canvasContainer.addEventListener('dragleave', function (e: any) {
				let canvasContainers = document.querySelectorAll('.design-container');
				for (let i = 0; i < canvasContainers.length; i++) {
					canvasContainers[i].classList.remove('byi-droppable');
				}

				let imageUploadContainers = document.querySelector('.byi-tooltip-imageUploadComponent');
				if (e.relatedTarget == imageUploadContainers) {
					if (imageUploadContainers) {
						imageUploadContainers.classList.remove('byi-droppable');
					}
				}
				e.target.classList.remove('over');
			}, false);
			canvasContainer.addEventListener('drop', function (e: any) {
				e.stopPropagation();
				e.preventDefault();
				if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
					self.pubsub.$pub('getActiveTabId', 3);
					self.pubsub.$pub('introTabActive', 3);
					self.droppedElement = e;
					self.pubsub.$pub('UploadDropImage', e);
					return false;
				}
				self.addDroppedImageToCanvas(e, null);
				self.removeOverlay();
				return false;
			}, false);
		}

	}

	removeOverlay() {
		let canvasContainers = document.querySelectorAll('.design-container');
		for (let i = 0; i < canvasContainers.length; i++) {
			canvasContainers[i].classList.remove('byi-droppable');
			if (canvasContainers[i].firstElementChild.classList.contains("byi-droppable-overlay")) {
				canvasContainers[i].firstElementChild.remove();
			}
		}
		let imageUploadContainers = document.querySelector('.byi-tooltip-imageUploadComponent');
		if (imageUploadContainers) {
			imageUploadContainers.classList.remove('byi-droppable');
		}
	}

	addDroppedImageToCanvas(e, img) {
		let canvasID = null;
		if (e.currentTarget) {
			canvasID = e.currentTarget.getAttribute("selection_area");
		} else {
			let parent = e.target.parentElement;
			do {
				canvasID = (parent && parent.getAttribute('selection_area')) ? parent.getAttribute('selection_area') : null;
				parent = (parent && parent.parentElement) ? parent.parentElement : null;
			} while (canvasID == null && parent);
			// canvasID = e.target.parentElement.parentElement.getAttribute("selection_area");
		}
		// 
		if (!canvasID)
			return;
		let canvas = this.canvasService.containerCanvases[canvasID];
		if (!img) {
			img = document.querySelector('img.img_dragging')
		}
		if (!img)
			return;
		let imgUrl = img.getAttribute('url');
		if (!img)
			return;
		let tab = img.getAttribute('tab');
		let dragprice = img.getAttribute('dragprice');
		img.classList.remove('img_dragging');
		this.pubsub.$pub('changeImageSide', { canvas: canvas });
		if (tab == 'clipart') {
			this.pubsub.$pub('addClipartImage', { img: imgUrl, price: dragprice, canvas: canvas });
		} else if (tab == 'upload') {
			this.pubsub.$pub('addUploadImage', { img: imgUrl, canvas: canvas });
		}
	}
}
