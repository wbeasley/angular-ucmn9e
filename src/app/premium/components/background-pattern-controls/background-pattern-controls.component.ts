import { Component, OnInit, Input } from '@angular/core';
import { MainService } from 'src/app/services/main.service';
import { CanvasService } from 'src/app/services/canvas.service';
import { TabsService } from 'src/app/services/tabs.service';
import { PubSubService } from 'angular7-pubsub';
import { BackgroundPatternsService } from '../background-patterns/background-patterns.service';

@Component({
	selector: '[background-pattern-controls]',
	templateUrl: './background-pattern-controls.component.html',
	styleUrls: ['./background-pattern-controls.component.scss']
})
export class BackgroundPatternControlsComponent implements OnInit {

	@Input() loadContent;
	public enableMakePattern = false;

	public componentHide: any = true;
	public patternRepeat: any = 'repeat';
	public patternWidth: any = 100;
	public patternXOffset: any = 0;
	public patternYOffset: any = 0;
	public patternAngle: any = 0;
	public patternPadding: any = 0;

	public minWidth: any = 2;
	public maxWidth: any = 100;

	public minXOffset: any = 0;
	public maxXOffset: any = 500;

	public minYOffset: any = 0;
	public maxYOffset: any = 500;
	openAccordian: boolean = true;
	constructor(private eventService: PubSubService, public mainService: MainService, public tabsService: TabsService, public backgroundPatternsService: BackgroundPatternsService, private canvasService: CanvasService) {
	}

	ngOnInit() {
		let self = this;
		if (!this.loadContent) {
			this.tabsService.registerTabs('pattern-controls', 'patterns');
			this.eventService.$sub('objectSelectionCreated', (obj) => {
				if (obj) {
					this.componentHide = true;
				}
			});
			this.eventService.$sub('objectRemoved', (obj) => {
				let canvas = this.canvasService.currentCanvas;
				this.initValues(canvas);
			});
			this.eventService.$sub('canvasClick', (obj) => {
				let canvas = this.canvasService.currentCanvas;
				this.initValues(canvas);
			});
			this.eventService.$sub('backgroundPatternsApplied', (canvas) => {
				if (!canvas) {
					canvas = this.canvasService.currentCanvas
				}
				this.initValues(canvas);
			});
			this.eventService.$sub('backgroundPatternsUpdate', (canvas) => {
				if (!canvas) {
					canvas = this.canvasService.currentCanvas
				}
				this.initValues(canvas);
			});
			this.eventService.$sub('imageSideChanged', () => {
				let canvas = this.canvasService.currentCanvas;
				this.initValues(canvas);
			});
			this.eventService.$sub('objectSelectionCleared', (obj) => {
				let canvas = this.canvasService.currentCanvas;
				this.initValues(canvas);
			});
			
		} else {
			this.subscribeEvents();
		}
	}

	initValues(canvas) {
		let object = this.backgroundPatternsService.fetchPatternObjectFromCanvas(canvas);
		if(object){
			this.maxWidth = canvas.width;
			if (this.maxWidth <= 2) {
				this.minWidth = this.maxWidth / 2;
			}
			this.maxXOffset = canvas.width;
			this.maxYOffset = canvas.height;
			let pattern = object.fill;
			if(pattern){
				this.patternRepeat = pattern.repeat;
				this.patternXOffset = pattern.offsetX;
				this.patternYOffset = pattern.offsetY;
				if (pattern.angle) {
					this.patternAngle = pattern.angle;
				} else if(!object.isResize){
					this.patternAngle = 0;
				}
				if (pattern.patternWidth) {
					this.patternWidth = pattern.patternWidth;
				} else if(!object.isResize){
					this.patternWidth = 100;
				}
				if (pattern.padding) {
					this.patternPadding = pattern.padding;
				} else if(!object.isResize){
					this.patternPadding = 0;
				}
				this.componentHide = null;
				this.openAccordian = true;
			}
		} else {
			this.resetPattern(false);
			this.componentHide = true;
			this.openAccordian = false;
		}
	}

	changePattern(type,canvas) {
		let pattern: any = {};
		pattern.repeat = this.patternRepeat ? this.patternRepeat : 'no-repeat';
		pattern.offsetX = parseInt(this.patternXOffset, 10);
		pattern.offsetY = parseInt(this.patternYOffset, 10);
		let width:any = this.patternWidth;
		pattern.patternWidth = parseInt(width, 10);
		pattern.angle = this.patternAngle;
		pattern.padding = parseInt(this.patternPadding, 10);
		this.backgroundPatternsService.changePattern(pattern, type,canvas);
	}
	resetPattern(reset) {
		let self = this;
		setTimeout(function () {
			self.patternRepeat = 'repeat';
			self.patternWidth = 100;
			self.patternXOffset = 0;
			self.patternYOffset = 0;
			self.patternAngle = 0;
			self.patternPadding = 0;
			if (reset) {
				self.changePattern('patternWidth','');
			}
		}, 500);

	}
	subscribeEvents() {
		this.eventService.$sub('objectSelectionCreated', (obj) => {
			this.initData();
		});
		this.eventService.$sub('objectSelectionUpdated', (obj) => {
			this.initData();
		});
		this.eventService.$sub('objectSelectionCleared', () => {
			this.initData();
		});
	}
	initData() {
		let obj = this.canvasService.getActiveObject();
		if (obj.objType != 'image' || obj == false || obj.ultimatelock == true) {
			this.enableMakePattern = false;
		} else {
			this.enableMakePattern = true;
		}
	}
	makePattern() {
		this.backgroundPatternsService.convertObjectToPattern();
	}
}
