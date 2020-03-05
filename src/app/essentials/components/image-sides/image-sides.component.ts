import { Component, OnInit, Input,  EventEmitter } from '@angular/core';
import { CanvasService } from 'src/app/services/canvas.service';
import { MainService } from 'src/app/services/main.service';
import { PubSubService } from 'angular7-pubsub';

@Component({
	selector: 'image-sides',
	templateUrl: './image-sides.component.html',
	styleUrls: ['./image-sides.component.scss']
})
export class ImageSidesComponent {
	public indexOfActiveImage: any;
	public enableNext: any = true;
	public enablePrev: any;
	public imagesLength;
	public pointerCount = 1;
	@Input() activeImageId;

	constructor(
		private eventService: PubSubService,
		public canvasService: CanvasService,
		public mainService: MainService,
		) { }

	ngOnInit() {

		this.eventService.$sub('changeImageSide', (data) => {
			if (data && data.hasOwnProperty('canvas')){
				let index = data.hasOwnProperty('index') ? data.hasOwnProperty('index') : null;
				this.changeImageSide(data.canvas['image_id'], index, data.canvas['designarea_id']);
			}
		});
		this.eventService.$sub('changeSide', (changeSideObj) => {
			this.changeImageSide(changeSideObj.image_id, changeSideObj.index);
		});
	}
	ngAfterViewInit() {
		this.imagesLength = (this.canvasService.allImages.length > 5) ? 5 : this.canvasService.allImages.length;
	}
	changeImageSider(event){
		this.changeImageSide(event.image_id,event.slide)
	}
	/**
	 * [changeImageSide Change image side]
	 * @param  image_id [image id of desired side]
	 */
	 changeImageSide(image_id, index, designAreaId: any = null) {
	 	if(index != null){
	 		this.indexOfActiveImage = index;
	 		this.updateNextPrev();
	 	}
	 	let eventData = (designAreaId == null) ? image_id : { image_id: image_id, design_area_id: designAreaId };
	 	this.eventService.$pub('imageSideChangeBefore', eventData);

	 }

	 changeNextPrevSide(type) {
	 	let self = this;
	 	this.indexOfActiveImage = this.canvasService.allImages.indexOf(this.canvasService.allImages.find(obj => (obj.image_id == self.activeImageId)));
	 	let index;
	 	if (type == 'prev') {
	 		index = this.indexOfActiveImage - this.pointerCount;
	 	} else if (type == 'next') {
	 		index = this.indexOfActiveImage + this.pointerCount;
	 	}
	 	let updatedImageId = this.canvasService.allImages.find(function (x, i) {
	 		return i == index
	 	}).image_id;
	 	if (updatedImageId) {
	 		this.changeImageSide(updatedImageId, index);
	 	}
	 }

	 updateNextPrev() {
	 	let self = this;
	 	if (!this.canvasService.allImages.length) return;
	 	let prevImage = this.canvasService.allImages.find(function (x, i) {
	 		return i == self.indexOfActiveImage - self.pointerCount
	 	});
	 	let nextImage = this.canvasService.allImages.find(function (x, i) {
	 		return i == self.indexOfActiveImage + self.pointerCount
	 	});
	 	if (prevImage) {
	 		this.enablePrev = 1;
	 	} else {
	 		this.enablePrev = 0;
	 	}
	 	if (nextImage) {
	 		this.enableNext = 1;
	 	} else {
	 		this.enableNext = 0;
	 	}
	 }

	}
