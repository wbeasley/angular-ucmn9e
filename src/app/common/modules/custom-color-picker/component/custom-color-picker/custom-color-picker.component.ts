import { Component, OnInit, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { MainService } from 'src/app/services/main.service';
import { PubSubService } from 'angular7-pubsub';
import { CanvasService } from 'src/app/services/canvas.service';

@Component({
  selector: '[custom-color-picker]',
  templateUrl: './custom-color-picker.component.html',
  styleUrls: ['./custom-color-picker.component.scss']
})
export class CustomColorPickerComponent implements OnInit {
	//Variable declarations

	@ViewChild('colorPickerContainer') colorPickerContainer: ElementRef;
	@Input() activeColor;
	@Input() type;
	@Input() hideColorToggle;
	@Input() svgColorArr;
	@Input() isLeft;
	@Output() colorPickerToggle = new EventEmitter<string>();
	@Output() changeColorEvent = new EventEmitter<string>();
	@Output() resetBackgroundEvent = new EventEmitter<string>();
	colorarr: any = [];
	viewMode: string = 'preset';
	isComponentLoad: boolean = false;
	activeBackGroundColor: any = '#fff';
	isCustomColorPickerEnable: boolean = false;
	//Constructor
	constructor(private mainService: MainService, 
		private eventService: PubSubService,
		private canvasService: CanvasService) {
		
	}

	//On INIT
	ngOnInit() {
		this.getCustomColorPickerStatus();
		if(this.type === "simple"){
			if(this.hideColorToggle){
				this.getColors();
			}
		}else if(this.type === "background"){
			this.getColors();
		}else if(this.type === "imageEffect"){
			this.getColors();
		}
	}

	getCustomColorPickerStatus(){
		let params = {},
		url = 'customcolorpicker/index/getCustomColorPickerStatus', 
		cacheKey: string = 'getCustomColorPickerStatus' + this.mainService.baseUrl;
		this.mainService.getData(url, params, cacheKey).then(data => {
			if(data.customcolorpickerstatus == '1'){
				this.isCustomColorPickerEnable = true;
			}else{
				this.isCustomColorPickerEnable = false;
			}
		}).catch(err => console.log(err));
	}

	getColors() {
		if(this.mainService.colorData.color){
			this.colorarr = this.mainService.colorData.color;
			this.isComponentLoad = true;
		}else{
			this.eventService.$sub('getColors', (colorData) =>{
				this.colorarr = colorData.color;
				this.mainService.colorData.defaultColor = colorData.defaultColor;
				this.isComponentLoad = true;
			});
		}
	}

	colorPickerToggleHideShow(event){
		this.colorPickerToggle.next(event);
		if(this.type === "background"){
			if (this.mainService.isResponsive){
				let windowWidth = window.outerWidth / 2,
					selectedElemLeft = event.target.getBoundingClientRect().left,
					selectedElemBottom = event.target.getBoundingClientRect().bottom,
					colorPickerWidth = this.colorPickerContainer.nativeElement.offsetWidth;

				selectedElemLeft += 13;
				if (selectedElemLeft > windowWidth && colorPickerWidth < selectedElemLeft) {
					// this.isLeft = true;
					this.colorPickerContainer.nativeElement.style.left = (selectedElemLeft) + 'px';
				} else {
					this.colorPickerContainer.nativeElement.style.left = '5px';
					this.colorPickerContainer.nativeElement.style.bottom = '80px';
					// this.isLeft = false;
				}
			}else{
				let windowWidth = window.outerWidth / 2,
					selectedElemLeft = event.target.getBoundingClientRect().left,
					selectedElemTop = event.target.getBoundingClientRect().top,
					colorPickerWidth = this.colorPickerContainer.nativeElement.offsetWidth;

				selectedElemLeft += 13;
				if (selectedElemLeft > windowWidth && colorPickerWidth < selectedElemLeft) {
					// this.isLeft = true;
					this.colorPickerContainer.nativeElement.style.left = (selectedElemLeft) + 'px';
				} else {
					this.colorPickerContainer.nativeElement.style.left = '5px';
					this.colorPickerContainer.nativeElement.style.top = '72px';
					// this.isLeft = false;
				}
			}
		}
		if(this.type === "imageEffect"){

		}
	}

	changeColor(colorCode){
		this.changeColorEvent.next(colorCode);
	}

	changeBackgroundColor(color){
		this.changeColorEvent.next(color);
	}

	resetBackground(){
		this.resetBackgroundEvent.next();
	}

	handleChangeComplete(event){
		if(event){
			if(this.type == "simple" || this.type == "imageEffect"){
				this.changeColorEvent.next('rgba('+event.color.rgb.r+','+event.color.rgb.g+','+event.color.rgb.b+','+event.color.rgb.a+')');
			}else if(this.type == "background"){
				this.activeBackGroundColor = 'rgba('+event.color.rgb.r+','+event.color.rgb.g+','+event.color.rgb.b+','+event.color.rgb.a+')';
				let color = {
					color_code: 'rgba('+event.color.rgb.r+','+event.color.rgb.g+','+event.color.rgb.b+','+event.color.rgb.a+')'//event.color.hex
				}
				this.changeBackgroundColor(color);
			}
		}
	}

	changeTab(tab){
		this.viewMode = tab;
	}
}
