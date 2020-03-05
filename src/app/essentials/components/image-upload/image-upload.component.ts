
import { LoaderComponent } from './../loader/loader.component';
import { Component, OnInit, ViewChild, ElementRef, Input, ChangeDetectorRef } from '@angular/core';
import { MainService } from 'src/app/services/main.service';
import { CacheService, CacheStoragesEnum } from 'ng2-cache';
import { PubSubService } from 'angular7-pubsub';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AddImageService } from 'src/app/services/add-image.service';
import { CanvasService } from 'src/app/services/canvas.service';
import { TabsService } from 'src/app/services/tabs.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';

@Component({
	selector: '[image-upload]',
	templateUrl: './image-upload.component.html',
	styleUrls: ['./image-upload.component.scss']
})
export class ImageUploadComponent implements OnInit {


	public subTabsData: any;
	getCurrentTabName: any;
	currentTab: any = 3;
	public ImageDataCacheKey: any;
	public accordianId: any = 0;
	public uploadedImages: any = 0;
	showInstruction: any;
	instructionText: any;
	limitAlert: any;
	minImageSize: any;
	maxImageSize: any;
	confirmImageUpload: any;
	confirmImageText: any;
	cacheKey: any;
	imagUrls: any = [];
	imageData: any = {};
	totalpages: any = 0;
	page: any = 1;

	userImages: any[];
	isEnableloadmore: any = false;
	confimationclass: any;
	isUserImagesPushed: boolean = false;
	@Input() loadContent;

	@ViewChild('myInput')
	myInputVariable: ElementRef;

	// Loader
	@ViewChild("loaderComponent") loaderComponent: LoaderComponent;
	@ViewChild("subtabLoader") subtabLoader: LoaderComponent;
	@ViewChild('scrollToBottom') private ScrollContainer: ElementRef;

	constructor(
		private http: HttpClient,
		private mainService: MainService,
		public canvasService: CanvasService,
		private cacheService: CacheService,
		private pubsub: PubSubService,
		private addImageService: AddImageService,
		private translate: TranslateService,
		public tabsService: TabsService,
		private cdr: ChangeDetectorRef
	) {
		if (!this.pubsub.events.UploadDropImage) {
			this.pubsub.$sub('UploadDropImage', (event) => {
				if (!this.checkConfirmation()) {
					this.pubsub.$pub('removeOverlay');
				}
				this.drop(event, true);
			});
		}
		this.ImageDataCacheKey = 'ImageData - ' + this.mainService.baseUrl;
	}

	subscribeEvents() {
		this.pubsub.$sub('displayUploadImageLimitError', () => {
			this.displayUploadImageLimitError();
		});
		this.pubsub.$sub('getSubTabs', (mainTabId) => {
			if (mainTabId == this.currentTab && !this.subTabsData) {
				this.getSubTabs(mainTabId);
			}
			this.getCurrentTabName = this.mainService.getAllTabs[this.currentTab]['label'];
		});
		if (this.loadContent && this.mainService.userLoggedIn) {
			// this.getUserImages(true);
		}

		this.pubsub.$sub('customerLoggedIn', () => {
			this.cdr.detectChanges();
			this.getUserImages(true);
		});

		this.pubsub.$sub('customerLoggedOut', () => {
			this.isUserImagesPushed = false;
		});

		this.pubsub.$sub('objectSelectionUpdated', (obj) => {
			if (obj.tab == 'upload') {
				if (this.mainService.isResponsive) {
					let self = this;
					this.pubsub.$pub('getActiveTabId', this.currentTab);
					setTimeout(function () {
						let currentSelectedObj = self.canvasService.getActiveObjectFromAllCanvases();
						if (currentSelectedObj && currentSelectedObj.tab == obj.tab) {
							self.tabsService.showChildTabs('image-upload');
						}
					}, 100);
				} else {
					this.pubsub.$pub('getActiveTabId', this.currentTab);
				}
			}
		});
		this.pubsub.$sub('objectSelectionCreated', (obj) => {
			let showSubChilds: boolean = false, childTabs;
			if (obj.type == 'activeSelection') {
				let anyUploadImgObj = obj._objects.indexOf(obj._objects.find(currObj => currObj.tab == 'upload'));
				if (anyUploadImgObj != -1) {
					showSubChilds = true;
					let findNonImgObj = (obj._objects.indexOf(obj._objects.find(currObj => currObj.objType != 'image')) >= 0) ? true : false,
						findNonSvg = (obj._objects.indexOf(obj._objects.find(currObj => currObj.isSvg != true)) >= 0) ? true : false,
						findNonPng = (obj._objects.indexOf(obj._objects.find(currObj => currObj.isSvg == true)) >= 0) ? true : false;
					if (!findNonImgObj && (findNonSvg && !findNonPng) || (findNonPng && !findNonSvg)) {
						childTabs = 'image-upload';
					} else {
						childTabs = 'common';
					}
				}
			}
			else if (obj.tab == 'upload') {
				showSubChilds = true;
				childTabs = 'image-upload';
			}
			if (showSubChilds == true) {
				let self = this;
				setTimeout(function () {
					let currentSelectedObj = self.canvasService.getActiveObjectFromAllCanvases();
					if (currentSelectedObj && currentSelectedObj.tab == obj.tab) {
						self.tabsService.showChildTabs('image-upload');
					}
				}, 100);
				this.pubsub.$pub('getActiveTabId', this.currentTab);
			}
		});
		this.pubsub.$sub('objectRemoved', (obj) => {
			if (obj.tab == 'upload') {
				this.pubsub.$pub('getActiveTabId', this.currentTab);
			}
		});
		this.pubsub.$sub('objectAdded', (obj) => {
			if (obj.tab == 'upload') {
				this.showFonts(true);
			}
		});

	}

	ngOnInit() {
		this.canvasService.uploadFile = [];
		this.canvasService.checkConfimation = 0;
		this.subscribeEvents();
		if (this.mainService.imageConfigRequest == true) {
			this.mainService.imageConfigRequest = false;
			let params = { 'product_id': this.mainService.productId }, url = 'productdesigner/ImageUpload/getImageConfiguration', cacheKey: string = this.ImageDataCacheKey;
			this.mainService.getData(url, params, cacheKey).then(data => {
				this.mainService.imageConfigRequest = true;
				this.setUploadData(data);
				this.cacheService.set(this.ImageDataCacheKey, data, { maxAge: 15 * 60 });
			}).catch(err => console.log(err));

		}
		this.pubsub.$sub('closeFullView', (showAllFonts) => {
			this.showAllFonts = showAllFonts;
			this.showFonts(showAllFonts);
		});
	}

	ngAfterViewInit() {
		if (this.loadContent) {
			this.pubsub.$sub('addUploadImage', (data) => {
				this.addImageToCanvas(data.img, data);
			});
		}
		this.cdr.detectChanges();
	}

	imageLimit: number = 12;
	getUserImages(resetData: boolean = false) {
		// if(this.isUserImagesPushed === true) return;
		if (resetData) {
			this.page = 1;
		}
		this.isUserImagesPushed = true;
		let url = 'productdesigner/Customer/getCustomerImages', params = { 'page': this.page, 'limit': this.imageLimit };
		let cacheKey = null;

		this.mainService.getData(url, params, cacheKey).then((customerImages: any) => {
			this.userImages = customerImages.images;
			this.isEnableloadmore = (customerImages.loadMore == 0) ? false : true;
			if (this.mainService.userLoggedIn && this.userImages) {
				if (resetData) {
					this.canvasService.uploadFile = [];
				}
				for (let i = 0; i < this.userImages.length; i++) {
					this.imageData = {};
					this.imageData.url = this.userImages[i].url;
					this.imageData.medium_url = this.userImages[i].medium_url;
					this.imageData.id = this.userImages[i].id;

					this.canvasService.uploadFile.push(this.imageData);
				}
				this.pubsub.$pub('fileUploaded');
				let _this = this;
				setTimeout(function () {
					_this.scrollToBottom();
				}, 100);
			}
		}).catch(err => console.log(err));
	}

	loadMoreDesigns() {
		this.page = this.page + 1;
		this.getUserImages();
	}

	async getSubTabs(mainTabId) {
		let data = this.mainService.tabsFlow[mainTabId];
		this.subTabsData = this.mainService.setSubTabsData(data, mainTabId);
		if (this.subTabsData && this.subTabsData.length > 0) {
			this.accordianId = this.subTabsData[0].id;
		}
		if (this.subtabLoader && this.subtabLoader.showSubLoader) this.subtabLoader.showSubLoader = false;
	}

	loadMoreImages() {
		this.page++;
		this.getUserImages();
		if (this.page == this.totalpages)
			this.isEnableloadmore = false;
	}

	setUploadData(data) {
		this.showInstruction = data.showInstruction;
		this.instructionText = data.instructionText;
		// this.uploadLimitEnable = data.uploadLimitEnable;
		this.canvasService.objectLimit = Object.assign(this.canvasService.objectLimit, { uploadLimitEnable: parseInt(data.uploadLimitEnable) });
		this.canvasService.objectLimit = Object.assign(this.canvasService.objectLimit, { uploadImageLimit: parseInt(data.uploadImageLimit) });
		this.limitAlert = data.limitAlert;
		this.minImageSize = data.minImageSize;
		this.maxImageSize = data.maxImageSize;
		this.confirmImageUpload = parseInt(data.confirmImageUpload);
		this.confirmImageText = data.confirmImageText;
	}

	changeconfimationvalue() {
		// if (this.canvasService.checkConfimation == 0) {
		// 	this.canvasService.checkConfimation = 1;
		// 	this.canvasService.confimationclass = "";
		// }
		// else {
		// 	this.canvasService.checkConfimation = 0;
		// }
	}

	checkConfirmation() {

		if (this.confirmImageUpload == 1) {
			let input = <HTMLInputElement>document.getElementById("upload_agreement");
			// if (input) {
			// 	this.canvasService.checkConfimation = input.checked;
			// }
			if (this.canvasService.checkConfimation == 0) {
				let input = <HTMLInputElement>document.getElementById("upload_agreement");
				if (input) {
					input.focus();
				}
				this.canvasService.confimationclass = "focused";
				this.cdr.detectChanges();
				if (this.myInputVariable) {
					this.myInputVariable.nativeElement.value = "";
				}
				return false;
			} else {
				this.canvasService.confimationclass = "";
				return true;
			}
		} else if (this.confirmImageUpload == 0) {
			this.canvasService.confimationclass = "";
			return true;
		}
		this.canvasService.confimationclass = "focused";
		return false;
	}

	login() {
		this.pubsub.$pub('openLoginModal', false);
	}


	drop(event, drop) {
		let file_data;
		if (!drop) {
			file_data = event.target.files;
		} else {
			file_data = event.dataTransfer.files;
		}
		let img_form_data = new FormData();
		let supportedExt = ["jpg", "jpeg", "svg", "png", "JPG", "JPEG", "SVG", "PNG"];
		var counter: number = 0, totalFiles = file_data.length;
		if (!this.checkConfirmation()) {
			return false;
		} else {
			for (let j = 0; j < totalFiles; j++) {
				let imageExt = file_data[j].name.split('.').pop();
				let size = file_data[j].size;
				if (supportedExt.indexOf(imageExt) == -1) {
					Swal.fire({
						title: this.translate.instant('Error'),
						text: this.translate.instant('Please upload valid file.'),
						type: "warning",
						confirmButtonText: this.translate.instant('OK'),
						allowOutsideClick: false
					});
					counter++;
				} else if (this.maxImageSize != "" && size > parseInt(this.maxImageSize) * 1024 * 1024 && this.maxImageSize != 0) {
					Swal.fire({
						title: this.translate.instant('Error'),
						text: this.translate.instant("Please upload  maximum ") + parseInt(this.maxImageSize) + this.translate.instant(" MB size !"),
						type: "warning",
						confirmButtonText: this.translate.instant('OK'),
						allowOutsideClick: false
					});
					counter++;
				} else if (this.minImageSize != "" && size < parseInt(this.minImageSize) * 1024 * 1024 && this.minImageSize != 0) {
					Swal.fire({
						title: this.translate.instant('Error'),
						text: this.translate.instant('File is too small'),
						type: "warning",
						confirmButtonText: this.translate.instant('OK'),
						allowOutsideClick: false
					});
					counter++;
				} else {
					if (this.loaderComponent) {
						this.loaderComponent.showSubLoader = true;
					}
					img_form_data.append("file", file_data[j]);
					img_form_data.append("product_id", this.mainService.productId);

					// set headers
					let HttpUploadOptions = new HttpHeaders();
					HttpUploadOptions = HttpUploadOptions.append("Accept", "application/json");
					HttpUploadOptions = HttpUploadOptions.append("X-Requested-With", "XMLHttpRequest");

					// send request
					this.mainService.post('productdesigner/Index/upload', img_form_data, false, HttpUploadOptions)
						.then((data: any) => {
							counter++;
							if (data && data.status == true) {
								if (drop) {
									data.drop = true;
								}
								this.canvasService.uploadFile.push(data);
							} else {
								this.mainService.swal('Error', (data && data.msg) ? data.msg : 'Something went wrong', 'error');
							}
						}).catch(err => {
							let errMessage = (err && err.error && err.error.message) ? err.error.message : "Something went wrong";
							Swal.fire({
								title: this.translate.instant('Error'),
								text: errMessage,
								type: "warning",
								confirmButtonText: this.translate.instant('OK'),
							});
							console.log(err);
							counter++;
						}).finally(() => {
							if (counter >= totalFiles) {
								this.loadContent = true;
								this.pubsub.$pub('fileUploaded');
								this.cdr.detectChanges();
								if (this.loaderComponent) {
									this.loaderComponent.showSubLoader = false;
								}
							}
						});
				}
			}

		}
		if (this.myInputVariable) {
			this.myInputVariable.nativeElement.value = "";
		}
	}
	deleteImg(url, id, index) {
		Swal.fire({
			title: this.translate.instant('Alert'),
			text: this.translate.instant("Are you sure you want to delete this image !"),
			type: "warning",
			showCancelButton: true,
			confirmButtonText: this.translate.instant('Yes'),
			cancelButtonText: this.translate.instant('No'),
			allowOutsideClick: false
		}).then((result) => {
			if (result.value) {
				this.canvasService.uploadFile.splice(index, 1);

				let params = { 'action': 'delete', 'url': url, 'id': id };

				// set headers
				let HttpUploadOptions = new HttpHeaders();
				HttpUploadOptions = HttpUploadOptions.append("Accept", "application/json");
				HttpUploadOptions = HttpUploadOptions.append("X-Requested-With", "XMLHttpRequest");

				return this.mainService.post('productdesigner/Index/upload', params, false, HttpUploadOptions)
					.then(res => res);
			}
		});
	}
	getImgdata(img_form_data, HttpUploadOptions) {
		return this.mainService.post(this.mainService.baseUrl + 'productdesigner/Index/upload', img_form_data, false, HttpUploadOptions);
	}

	addImageToCanvas(img, data) {
		let properties: any = { tab: 'upload' };
		if (data.canvas) {
			properties.canvas = data.canvas;
		}
		this.addImageService.addImage(img, properties);
	}

	displayUploadImageLimitError() {
		Swal.fire({
			title: this.translate.instant('Error'),
			text: this.translate.instant(this.limitAlert),
			type: "warning",
			confirmButtonText: this.translate.instant('OK'),
		});
	}

	getDefaultImage(obj) {
		let found = this.canvasService.uploadFile.find((uploadFileObj: any) => uploadFileObj.uniqueId == obj.uniqueId);
		found.url = this.mainService.defaultPlaceholderImage;
		this.canvasService.uploadFile[this.canvasService.uploadFile.indexOf(found)] = found;
	}

	showAllFonts: boolean = false;
	showFonts(showAllFonts) {
		this.showAllFonts = !showAllFonts;
		this.pubsub.$pub('showFonts', { showAllFonts: this.showAllFonts, title: 'Show all images' });
	}

	scrollToBottom(): void {
		try {
			if (!this.mainService.isResponsive) {
				this.ScrollContainer.nativeElement.scrollTop = this.ScrollContainer.nativeElement.scrollHeight;
			}
			else {
				let scrollWidth = this.ScrollContainer.nativeElement.scrollWidth;
				scrollWidth = scrollWidth - ((scrollWidth * 25) / 100);
				this.ScrollContainer.nativeElement.scrollLeft = scrollWidth;
			}
		} catch (err) { }
	}
}
