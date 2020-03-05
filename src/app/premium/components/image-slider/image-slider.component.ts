import { Component, Input, Output, AfterViewInit, ViewChild, ChangeDetectorRef, EventEmitter } from '@angular/core';
import { NguCarousel, NguCarouselConfig } from '@ngu/carousel';
import { CanvasService } from "src/app/services/canvas.service";
import { PubSubService } from 'angular7-pubsub';
import { MainService } from 'src/app/services/main.service';

@Component({
	selector: '[image-slider]',
	templateUrl: './image-slider.component.html',
	styleUrls: ['./image-slider.component.scss']
})
export class ImageSliderComponent {

	@Input() canvasImages;
	@Input() activeSlide;
	public enableNext = 1;
	public enablePrev = 0;

	public enableNextResponsive = 1;
	public enablePrevResponsive = 0;
	public activeSideMobile;

	@Output() changeSlider = new EventEmitter<string>();
	public carouselConfig: NguCarouselConfig;
	public carouselConfigMobile: NguCarouselConfig;

	@ViewChild('myCarousel') myCarousel: NguCarousel<any>;
	@ViewChild('myCarouselResponsive') myCarouselResponsive: NguCarousel<any>;


	constructor(private cdr: ChangeDetectorRef, private eventService: PubSubService, private canvasService: CanvasService, public mainService: MainService) {
		this.subscribeEvents();
		this.initCarousel();
	}

	subscribeEvents() {
		let self = this;

		this.eventService.$sub('objectAdded', (obj) => {
			self.reflectThumbnails(obj);
		});

		this.eventService.$sub('objectRemoved', (obj) => {
			self.reflectThumbnails(obj);
		});
		this.eventService.$sub('objectUpdated', (obj) => {
			self.reflectThumbnails(obj);
		});
		this.eventService.$sub('canvasObjectModified', (obj) => {
			self.reflectThumbnails(obj);
		});
		this.eventService.$sub('backgroundPatternsApplied', (obj) => {
			self.reflectThumbnails(obj);
		});
		this.eventService.$sub('backgroundPatternsUpdate', () => {
			self.reflectThumbnails(null);
		});
		this.eventService.$sub('zoomCanvasUpdated', () => {
			setTimeout(function(){
				self.reflectThumbnails(null);
			},500);
		});
		this.eventService.$sub('canvasBackgroundChange', (obj) => {
			self.reflectThumbnails(obj);
		});

		this.eventService.$sub('changeSlider', (data) => {
			self.canvasImages = data.canvasImages;
			self.changeSlide(data.image_id, data.slide);
		});

		this.eventService.$sub('windowResize', () => {
			this.initCarousel();
			// this.canvasService.deselectAllObjects();
		});


	}
	reflectThumbnails(object) {
		let obj = object && object.length > 0 ? object[0] : object;
		if (obj && obj.imageDesignId) {
			let imageId = obj.imageDesignId.split("&");
			let canvas = this.canvasService.containerCanvases[obj.imageDesignId];
			this.previewThumbnail(canvas, imageId);

		} else {
			let canvas = this.canvasService.currentCanvas;
			let canvasimageid = '@' + canvas.image_id + '&' + canvas.designarea_id;
			let imageId = canvasimageid.split("&");
			this.previewThumbnail(canvas, imageId);

		}
	}

	previewThumbnail(canvas, imageId) {
		// get canvas containar height and width
		let element: any = document.querySelector(".product-designer-main-content.active");
		let offsetHeight = element.offsetHeight;
		let offsetWidth = element.offsetWidth;

		let imageElement = this.mainService.isResponsive == true ? document.querySelector(".ngucarousel-items .item.active .product-thumbnail-mobile") : document.querySelector(".ngucarousel-items .item.active .product-thumbnail");
		let imageTile = document.querySelector(".byi-image-sides .ngucarousel .ngucarousel-items .item.active .tile");

		let imageHeight = imageElement.clientHeight;
		let imageWidth = imageElement.clientWidth;

		var marginTop = canvas.dim.y1 / this.canvasService.scaleFactor;
		var marginLeft = canvas.dim.x1 / this.canvasService.scaleFactor;

		let additionalLeft = (imageTile.clientWidth - imageElement.clientWidth) / 2;

		let smallImgMarginTop = ((marginTop * imageHeight) / offsetHeight);
		let smallImgMarginLeft = ((marginLeft * imageWidth) / offsetWidth) + additionalLeft;

		var multiply_width = imageWidth;
		var multiplier_value = multiply_width * canvas.width / offsetWidth;

		let dataurl = canvas.toDataURL({
			format: "png",
			multiplier: multiplier_value / canvas.width,
			//multiplier: 1,
			quality: 1.0
		});
		let image: any = this.canvasService.allImages.filter(data => '@' + data.image_id == imageId[0]);
		if (image.length > 0) {
			// image[0].dataurl = dataurl;
			let dataurlArr: any = (image[0].hasOwnProperty('dataurl') && image[0].dataurl) ? image[0].dataurl : [];
			dataurlArr[imageId[1]] = dataurl;

			let positionArr: any = (image[0].hasOwnProperty('dataurl') && image[0].positionleft) ? image[0].positionleft : [];
			positionArr[imageId[1]] = smallImgMarginLeft + 'px';

			let marginArr: any = (image[0].hasOwnProperty('dataurl') && image[0].positiontop) ? image[0].positiontop : [];
			marginArr[imageId[1]] = smallImgMarginTop + 'px';

			let marginPostArr: any = (image[0].hasOwnProperty('dataurl') && image[0].margin) ? image[0].margin : [];
			marginPostArr[imageId[1]] = this.mainService.loadedProductData.designerProductType ? 'auto' : '' ;

			image[0] = Object.assign(image[0], { dataurl: dataurlArr, positionleft: positionArr, positiontop: marginArr,margin : marginPostArr});
		}
	}
	ngAfterViewInit() {
		let images = this.canvasImages;
		this.enableNext = images.length <= 2 ? 0 : 1;
		this.enableNextResponsive = images.length <= 2 ? 0 : 1;

		this.cdr.detectChanges();
	}
	changeSlide(image_id, slide) {
		this.activeSlide = image_id;
		let data: any = {
			image_id: image_id,
			slide: slide,
		};
		this.changeSlider.emit(data);
	}
	onmoveFn($event) {
		if ($event.isFirst) {
			this.enablePrev = 0;
			this.enableNext = 1;
		} else if ($event.isLast) {
			this.enableNext = 0;
			this.enablePrev = 1;
		} else {
			this.enablePrev = 1;
			this.enableNext = 1;
		}
	}

	onmoveFnResponsive($event) {
		if ($event.isFirst) {
			this.enablePrevResponsive = 0;
			this.enableNextResponsive = 1;
		} else if ($event.isLast) {
			this.enableNextResponsive = 0;
			this.enablePrevResponsive = 1;
		} else {
			this.enablePrevResponsive = 1;
			this.enableNextResponsive = 1;
		}
	}

	initCarousel() {
		this.carouselConfigMobile = {
			grid: { xs: 2, sm: 2, md: 2, lg: 2, all: 0 },
			load: 1,
			interval: { timing: 4000, initialDelay: 1000 },
			loop: false,
			touch: true,
			velocity: 0.2
		}
		this.carouselConfig = {
			grid: { xs: 2, sm: 2, md: 2, lg: 2, all: 0 },
			load: 1,
			interval: { timing: 4000, initialDelay: 1000 },
			loop: false,
			vertical: { enabled: true, height: 228 },
			touch: false,
			velocity: 0.2
		}
		// if (this.mainService.isResponsive) {
		// } else {
		// }

	}

}
