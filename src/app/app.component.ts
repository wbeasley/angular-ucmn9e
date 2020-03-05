import { LoaderComponent } from 'src/app/essentials/components/loader/loader.component';
import { Component, ViewChild } from '@angular/core';
import { MainService } from './services/main.service';
import { DesignService } from './services/design.service';
import { PubSubService } from 'angular7-pubsub';
import { CanvasService } from './services/canvas.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
	title = 'basic';
	data: any = [];
	finalPrice: any;

	@ViewChild("loaderComponent") loaderComponent: LoaderComponent;

	constructor(public designService: DesignService, private eventService: PubSubService, private canvasService: CanvasService, private translate: TranslateService) {
		this.checkLandscape();
	}

	checkLandscape() {
		let activeDom = document.activeElement.tagName;
		if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && window.matchMedia("(orientation: landscape)").matches && activeDom != 'INPUT' && activeDom != 'TEXTAREA') {
			Swal.fire({
				customClass: 'potrait-mode-popup',
				title: this.translate.instant("Alert"),
				text: this.translate.instant("Please select Portrait Mode to see Product Designer Tool in action."),
				showConfirmButton: false,
				allowOutsideClick: false
			});
			return;
		} else {
			Swal.close();
		}

	}

	ngOnInit() {
		this.subscribeEvents();
		this.getColors();

		this.eventService.$sub('windowResize', () => {
			this.checkLandscape();
		});
	}

	getColors() {
		let params = {},
			url = 'productdesigner/index/getColor', cacheKey: string = 'getColors' + this.designService.mainService.baseUrl;
		this.designService.mainService.getData(url, params, cacheKey).then(colorData => {
			this.designService.mainService.colorData = colorData;
			this.eventService.$pub('getColors', (colorData));
		}).catch(err => console.log(err));
	}

	subscribeEvents() {
		// Subscribe product zoom
		this.eventService.$sub('showMainLoader', () => {
			this.loaderComponent.showMainLoader = true;
		});

		// Subscribe product zoom
		this.eventService.$sub('hideMainLoader', () => {
			this.loaderComponent.showMainLoader = false;
		});
	}

	rightClickEventCheck(event){
		return false;
	}


}