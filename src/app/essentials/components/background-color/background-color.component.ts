import { LoaderComponent } from './../loader/loader.component';
import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { MainService } from 'src/app/services/main.service';
import { CanvasService } from 'src/app/services/canvas.service';
import { CacheService, CacheStoragesEnum } from 'ng2-cache';
import { PubSubService } from 'angular7-pubsub';

@Component({
	selector: '[background-color]',
	templateUrl: './background-color.component.html',
	styleUrls: ['./background-color.component.scss']
})
export class BackgroundColorComponent implements OnInit {
	public subTabsData: any;
	getCurrentTabName: any;
	currentTab: any = 4;
	selectedColor: any;
	hideColorToggleBackground = 1;
	public accordianId: any = 0;
	isChildColorComponentLoad: boolean = false;
	@Input() loadContent;
	@ViewChild("loaderComponent") loaderComponent: LoaderComponent;

	constructor(
		private mainService: MainService,
		private cacheService: CacheService,
		private pubsub: PubSubService,
		private canvasService: CanvasService
	) {
		this.pubsub.$sub('getSubTabs', (mainTabId) => {
			if (mainTabId == this.currentTab && !this.subTabsData) {
				this.getSubTabs(mainTabId);
			}
			this.getCurrentTabName = this.mainService.getAllTabs[this.currentTab]['label'];
		});

		this.pubsub.$sub('canvasBackgroundChange', () => {
			this.selectedColor = this.canvasService.currentCanvas.backgroundColor;
		});
	}

	ngOnInit() {
		this.pubsub.$sub('imageSideChanged', () => {
			this.selectedColor = '#fffff';
			this.selectedColor = this.canvasService.currentCanvas.backgroundColor;
		});
		this.pubsub.$sub('closeColorPicker', () => {
			this.hideColorToggleBackground = 1;

		});
		this.isChildColorComponentLoad = true;
	}

	closeLoader() {
		if (this.loaderComponent && this.loaderComponent.showSubLoader) {
			this.loaderComponent.showSubLoader = false;
		}
	}

	async getSubTabs(mainTabId) {
		let data = this.mainService.tabsFlow[mainTabId];
		this.subTabsData = this.mainService.setSubTabsData(data, mainTabId);
		if (this.subTabsData && this.subTabsData.length > 0) {
			this.accordianId = this.subTabsData[0].id;
		}
	}

	changeBackgroundColor(color) {
		this.selectedColor = color.color_code;
		let params = {
			properties: {
				backgroundColor: color.color_code
			},
			crudServiceString: 'this.canvasUpdateService',
			isHistory: true,
		};
		this.canvasService.objectCRUD(params);
		this.canvasService.usedColorsCounter();

	}

	resetBackground() {
		this.selectedColor = null;
		let params = {
			properties: {
				backgroundColor: null
			},
			crudServiceString: 'this.canvasUpdateService',
			isHistory: true,
		};
		this.canvasService.objectCRUD(params);
		this.canvasService.usedColorsCounter();
	}

	colorPickerToggleBackground(event) {
		if (this.hideColorToggleBackground == 1) {
			this.hideColorToggleBackground = 0;
		} else if (this.hideColorToggleBackground == 0) {
			this.hideColorToggleBackground = 1;
		}
	}
}
