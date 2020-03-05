import { LoaderComponent } from 'src/app/essentials/components/loader/loader.component';
import { Component, OnInit, ViewChild, ChangeDetectorRef, ElementRef } from '@angular/core';
import { CanvasService } from 'src/app/services/canvas.service';
import { MainService } from 'src/app/services/main.service';
import { ImageEffectsService } from './image-effects.service';
import { TabsService } from 'src/app/services/tabs.service';
import { CacheService, CacheStoragesEnum } from 'ng2-cache';
import { PubSubService } from 'angular7-pubsub';
declare var fabric: any;

@Component({
	selector: '[image-effects]',
	templateUrl: './image-effects.component.html',
	styleUrls: ['./image-effects.component.scss']
})
export class ImageEffectsComponent implements OnInit {
	@ViewChild('colorPickerContainer') colorPickerContainer: ElementRef;
	svgColorArr: any = [];
	colorarr: any = [];
	fill1: any;
	hideColorToggle = 1;
	fillcolor: any;
	isSvgColorsDisplay: boolean = false;
	EffectDataCacheKey: any;
	imageEffects: any;
	defaultColor: any;
	selectedItem: any;
	selectedResponsiveItem: any;
	effectArray: any = [];
	displayEffects: any = true;
	componentHide: any = true;
	addTransition: any = 0;
	openAccordian: boolean = false;
	openAccordianEffect: boolean = false;
	sliderValue: any = [];
	sliderHistory: any = [];
	defaultSliderData: any = [];
	// Loader
	isLeft: boolean = false;
	@ViewChild('loaderComponent') loaderComponent: LoaderComponent;
	@ViewChild('svgColorContainer') svgColorContainer: ElementRef;
	@ViewChild('colorContainer') colorContainer: ElementRef;

	constructor(
		private cacheService: CacheService,
		public mainService: MainService,
		private eventService: PubSubService,
		private canvasService: CanvasService,
		private cdr: ChangeDetectorRef,
		private imageEffectsService: ImageEffectsService,
		public tabsService: TabsService
	) {
		this.tabsService.registerTabs('image-effects', 'clipart');
		this.tabsService.registerTabs('image-effects', 'image-upload');
		this.getColors();
		this.EffectDataCacheKey = 'imageEffect' + this.mainService.productId + '-' + this.mainService.baseUrl;
	}

	getColors() {
		if (!this.defaultColor) {
			this.defaultColor = this.mainService.colorData.defaultColor;
			this.colorarr = this.mainService.colorData.color;
		}
		this.eventService.$sub('getColors').subscribe(colorData => {
			this.defaultColor = colorData.defaultColor;
			this.colorarr = colorData.color;
			if (this.loaderComponent) {
				this.loaderComponent.showSubLoader = false;
			}
		}, err => console.log(err));

	}
	ngOnInit() {
		let params = {}, url = 'productdesigner/Index/getImageEffects', cacheKey: string = this.EffectDataCacheKey;
		this.mainService.getData(url, params, cacheKey).then(data => {
			this.cacheService.set(this.EffectDataCacheKey, data, { maxAge: 15 * 60 });
			this.imageEffects = data.effects;
			this.prepareInitialData();
		}).catch(err => console.log(err));
		this.subscribeEvents();
	}

	setEffects(obj) {
		this.effectArray = [];
		obj.filters.filter(object => {
			if (object.type == "HueRotation") {
				this.sliderHistory[object.type] = object["rotation"];
			} else if (object.type.toLowerCase() != undefined && object.type != "Pixelate") {
				this.sliderHistory[object.type] = object[object.type.toLowerCase()];
			} else {
				this.sliderHistory[object.type] = object["blocksize"];
			}

			if (object.type == "HueRotation") {
				this.effectArray.push('Hue');
				if (this.sliderValue["Hue"] != undefined && object.sliderValue != null) {
					this.sliderValue['Hue'] = object.sliderValue;
				} else if (object.sliderValue == null && object.type.toLowerCase() != undefined) {
					this.sliderValue["Hue"] = object["rotation"];
				}
			} else if (object.type == "Convolute") {
				let emboss = [1, 1, 1, 1, 0.7, -1, -1, -1, -1];
				let sharpen = [0, -1, 0, -1, 5, -1, 0, -1, 0];
				if (JSON.stringify(emboss) == JSON.stringify(object.matrix)) {
					this.effectArray.push('Emboss');
				}
				if (JSON.stringify(sharpen) == JSON.stringify(object.matrix)) {
					this.effectArray.push('Sharpen');
				}
			} else {

				this.effectArray.push(object.type);

				if (this.sliderValue[object.type] != undefined && object.sliderValue != null) {
					this.sliderValue[object.type] = object.sliderValue;
				} else if (object.sliderValue == null && object.type.toLowerCase() != undefined) {
					this.sliderValue[object.type] = object[object.type.toLowerCase()];
				}

			}
		});
	}

	prepareInitialData() {
		if (this.imageEffects) {
			this.imageEffects.filter((imageEffectObj, i) => {
				if (imageEffectObj.slider_value != null) {
					let val = imageEffectObj.slider_value;
					let key = imageEffectObj.effect_name;
					this.sliderValue[key] = val;
					this.defaultSliderData[key] = val;
				}
			});
		}
	}
	isApplyOneFilter: boolean = false;
	changeEffect(effect, sliderValue: any = null, sliderIndex: any = null, type: any = null) {
		let checkObj = this.mainService.canvasService.currentCanvas.getActiveObjects();

		if (checkObj[0].filters.length == 0) {
			if (!this.isApplyOneFilter) {
				this.eventService.$pub('showMainLoader');
			}
		} else {
			this.isApplyOneFilter = true;
		}
		let obj = this.canvasService.currentCanvas.getActiveObject();
		let canvas = this.canvasService.currentCanvas;
		this.selectedItem = effect;
		if (sliderValue == null) {
			sliderValue = this.defaultSliderData[effect];
			this.sliderValue[effect] = sliderValue;
			this.sliderHistory[effect] = sliderValue;

			if (this.effectArray.indexOf(effect) < 0) {
				if (type == null) {

					this.effectArray.push(effect);
				}
			} else {
				this.sliderHistory[effect] = null;
				this.effectArray.splice(this.effectArray.indexOf(effect), 1);
			}
		} else {
			if (this.effectArray.indexOf(effect) < 0) {
				this.effectArray.push(effect);
			}
			this.sliderHistory[effect] = sliderValue;
		}
		let selectedObjs = this.mainService.canvasService.currentCanvas.getActiveObjects();
		// selectedObjs.filter(object => {
		// 	let properties = {
		// 		effectArray: this.effectArray,
		// 		effect: effect,
		// 		imageEffects: this.imageEffects,
		// 		sliderValue: sliderValue,
		// 		sliderHistory: this.sliderHistory
		// 	}
		// 	let params = {
		// 		obj: object,
		// 		properties: properties,
		// 		crudServiceString: 'this.imageEffectsService',
		// 	};
		// 	this.canvasService.objectCRUD(params);

		// });
		let properties = {
			effectArray: this.effectArray,
			effect: effect,
			imageEffects: this.imageEffects,
			sliderValue: sliderValue,
			sliderHistory: this.sliderHistory
		}
		let params = {
			obj: selectedObjs,
			properties: properties,
			crudServiceString: 'this.imageEffectsService',
		};
		this.canvasService.objectCRUD(params);

		setTimeout(() => {
			this.eventService.$pub('hideMainLoader');
		}, 1000);

	}

	resetEffects(effect) {
		this.changeEffect(effect, null, null, 'reset');
	}

	ngAfterViewInit() {
		if (this.loaderComponent) {
			this.loaderComponent.showSubLoader = true;
		}
		this.cdr.detectChanges();
	}

	subscribeEvents() {
		this.eventService.$sub('objectSelectionCleared', () => {
			this.componentHide = true;
			this.openAccordian = null;
			this.openAccordianEffect = null;

		});
		let self = this;

		this.eventService.$sub('objectSelectionCreated', (obj) => {
			this.enableComponent(obj);
			this.showHideComponent(obj);
			if (obj.tab == "clipart" || obj.tab == "upload") {
				this.openAccordian = true;
			}
			if (this.isSvgColorsDisplay) {
				this.colorChange();
				if (this.mainService.isResponsive) {

					setTimeout(() => {
						this.eventService.$pub('toggleResponsiveClass');
					}, 400);
				}
			}

			if (obj.type == "image") {
				this.setEffects(obj);
			}
		});
		this.eventService.$sub('objectSelectionUpdated', (obj) => {
			this.enableComponent(obj);
			this.showHideComponent(obj);
			if (obj.tab == "clipart" || obj.tab == "upload") {
				this.openAccordian = true;
			}
			if (this.isSvgColorsDisplay) {
				this.colorChange();
			}
			if (obj.type == "image") {
				this.setEffects(obj);
			}
		});
		this.eventService.$sub('objectUpdated', (obj) => {
			obj = (Array.isArray(obj)) ? obj[0] : obj;
			let activeObj = this.canvasService.getActiveObject();
			if (activeObj == false) this.canvasService.currentCanvas.setActiveObject(obj).renderAll();
			this.enableComponent(obj);
			this.showHideComponent(obj);
			if (obj.tab == "clipart" || obj.tab == "upload") {
				this.openAccordian = true;
			}
			if (this.isSvgColorsDisplay) {
				this.colorChange();
			}

			if (obj.type == "image") {
				this.setEffects(obj);
			}

		});
		this.eventService.$sub('objectAdded', (obj) => {
			this.sliderHistory = [];
			this.enableComponent(obj);
			if (obj.tab == "clipart" || obj.tab == "upload") {
				this.openAccordian = true;
			}
			if (this.isSvgColorsDisplay) {
				this.colorChange();
			}

			if (obj.type == "image") {
				this.setEffects(obj);
			}
			this.prepareInitialData();
		});
		this.eventService.$sub('objectRemoved', (obj) => {
			this.componentHide = true;
			this.openAccordian = null;
			this.openAccordianEffect = null;
		});
		this.eventService.$sub('closeColorPicker', () => {
			this.hideColorToggle = 1;
			var rightPanel = document.getElementsByClassName('byi-right-panel');
			if (rightPanel && rightPanel.length > 0) {
				rightPanel[0].classList.remove("byi-picker-active");
			}
		});
	}

	changeSlider(effect: any, value: any, index: any) {
		this.changeEffect(effect, value, index);
	}



	showHideComponent(obj) {
		if (obj.type == 'activeSelection') {
			let allObj = obj._objects,
				findNonImageObj = allObj.indexOf(allObj.find(currObj => (currObj.tab != 'clipart' && currObj.tab != 'upload'))),
				show: boolean = null;
			if (findNonImageObj == -1) {
				let isAllSvg = allObj.indexOf(allObj.find(currObj => (currObj.isSvg == false)));
				if (isAllSvg == -1) {
					this.isSvgColorsDisplay = true;
					this.displayEffects = false;
					show = true;
				} else {
					let findNonSvg = allObj.indexOf(allObj.find(currObj => (currObj.isSvg == true)));
					if (findNonSvg == -1) {
						this.isSvgColorsDisplay = false;
						this.displayEffects = true;
						show = true;
					}
				}
			}
			this.openAccordian = show;
			this.componentHide = (show == true) ? null : true;
		} else if (obj.tab == "clipart" || obj.tab == "upload") {
			this.openAccordian = true;
		}
	}

	enableComponent(obj) {
		if (!Array.isArray(obj)) {
			if (obj.objType == 'image' && obj.isSvg == true && obj.ultimatelock != true) {
				this.componentHide = null;
				this.isSvgColorsDisplay = true;
				this.displayEffects = false;
			} else if (obj.objType == 'image' && obj.isSvg == false && obj.ultimatelock != true) {
				this.componentHide = null;
				this.isSvgColorsDisplay = false;
				this.displayEffects = true;
			} else {
				this.componentHide = true;
			}
		}
	}

	colorChange(changeActiveColor: boolean = true) {
		let selectedObj = this.mainService.canvasService.currentCanvas.getActiveObjects();

		this.isSvgColorsDisplay = true;
		this.svgColorArr = [];
		selectedObj.filter(obj => {
			if (obj && obj._objects && obj._objects.length > 0) {
				obj._objects.forEach((data) => {
					if (data.fill) {
						if (this.svgColorArr.indexOf(data.fill) == -1) {
							this.svgColorArr.push(data.fill);
						}
					}
				});
			}
		});
	}

	setFill(color) {
		this.selectedItem = color;
		let selectedObjs = this.mainService.canvasService.currentCanvas.getActiveObjects();
		let properties = {
			fill: color,
			old_fill: this.fillcolor
		}
		this.fillcolor = color;

		let params = {
			obj: selectedObjs,
			properties: properties,
			crudServiceString: 'this.svgColorUpdate',
			isCenter: false,
			isHistory: true,
			isSvg: true
		};
		this.mainService.canvasService.objectCRUD(params);
		this.colorChange(false);
	}

	colorPickerToggle(color, event) {
		var rightPanel = document.getElementsByClassName('byi-right-panel');
		if (this.hideColorToggle == 0 && this.selectedItem === color) {
			this.hideColorToggle = 1;
			if (rightPanel && rightPanel.length > 0) {
				rightPanel[0].classList.remove("byi-picker-active");
			}
			return;
		}

		if (rightPanel && rightPanel.length > 0) {
			rightPanel[0].classList.add("byi-picker-active");
		}

		this.hideColorToggle = 0;
		this.fillcolor = color;
		this.selectedItem = color;
		this.cdr.detectChanges();
		
		// desktop view
		if (!this.mainService.isResponsive) {
			let el = event.srcElement.offsetLeft;
			let elTop = event.srcElement.offsetTop;

			let colorPickerContainerWidth = this.colorPickerContainer.nativeElement.offsetWidth;
			let svgColorContainer = this.colorContainer.nativeElement.offsetWidth + 30;

			// set default place for color picker
			if ((el + colorPickerContainerWidth) < svgColorContainer) {
				this.isLeft = true;
				this.colorPickerContainer.nativeElement.style.left = (el) + 'px';
				this.colorPickerContainer.nativeElement.style.top = (elTop + 50) + 'px';
			} else {
				this.isLeft = false;
				this.colorPickerContainer.nativeElement.style.left = (el - 30) + 'px';
				this.colorPickerContainer.nativeElement.style.top = (elTop + 50) + 'px';
			}

			// if scrolled
			let isScrolled = (this.svgColorContainer.nativeElement.scrollTop > 0) ? true : false;
			if (isScrolled) {
				let svgContainer = this.svgColorContainer.nativeElement,
					currentTop = elTop + 50;
				currentTop -= svgContainer.scrollTop;
				this.colorPickerContainer.nativeElement.style.top = currentTop + 'px';
			}
		}

		// mobile view
		if (this.mainService.isResponsive) {
			let windowWidth = window.outerWidth / 2,
				selectedElemLeft = event.target.getBoundingClientRect().left,
				colorPickerWidth = this.colorPickerContainer.nativeElement.offsetWidth;

			selectedElemLeft += 13;

			if (selectedElemLeft > windowWidth && colorPickerWidth < selectedElemLeft) {
				this.isLeft = true;
				this.colorPickerContainer.nativeElement.style.left = (selectedElemLeft) + 'px';
			} else {
				this.colorPickerContainer.nativeElement.style.left = (selectedElemLeft - 30) + 'px';
				this.isLeft = false;
			}
		}
	}
	activeEffect(newValue) {
		this.selectedResponsiveItem = newValue;
	}
}
