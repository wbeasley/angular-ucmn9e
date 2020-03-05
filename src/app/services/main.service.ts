import { ShortcutKeysService } from './shortcut-keys.service';
import { LoaderComponent } from 'src/app/essentials/components/loader/loader.component';
import { Injectable, TemplateRef } from '@angular/core';
import { CacheService, CacheStoragesEnum } from 'ng2-cache';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { CanvasService } from "../services/canvas.service";
import { CustomiseControlsService } from "../services/customise-controls.service";
import { PubSubService } from 'angular7-pubsub';
import Swal from 'sweetalert2';
import { FileSaverService } from 'ngx-filesaver';
import { TranslateService } from '@ngx-translate/core';
declare let introJs: any;

@Injectable({
	providedIn: 'root'
})
export class MainService {

	public version = '2.0.2';
	public isDeveloperMode = false;
	public firstTimeLoaded = false;
	public adminUrl;
	public baseUrl;
	public productId;
	public designId;
	public itemId;
	public productType;
	public colorData: any = {};
	public associatedProductId;
	public isResponsive;
	public subTabData: any;
	public getAllTabs: any;
	public containerCanvases = {};
	public allObjects = [];
	// for Login
	public userLoggedIn: boolean = false;
	public loggedInUserId;

	// for Loader
	public loaderRequests: number = 0;
	public loaderResponse: number = 0;
	public loaderChecked: boolean = false;
	public tabsFlow: any = [];
	public objectModification: boolean = true;
	public lastSavedData: any = {};
	public generatedImage: any = [];

	public hideMe: boolean = false;

	// product final price
	public productPrice: number;
	public otherPrices: number;

	// default placeholder image in case present image is broken or not found
	public defaultPlaceholderImage: any;

	// infinite scroll
	public customPlaceholderArr: any;

	public productTooltipData: string;
	public isToolTipEnable: boolean = false;

	//check Admin make a design
	public isAdmin: boolean = false;

	// choose if enableMultipleSelection is true or false
	public enableMultipleSelection: boolean = false;

	// store loaded product's response
	public loadedProductData: any;
	public nameNumber: any = false;
	public isGenerateSVGDesign: any = false;
	public totalMainTab: any = 0;

	public clipartRequest: boolean = true;
	public imageConfigRequest: boolean = true;

	// otherOptions to pass in Load Product
	public otherOptions: any = [];

	// Flag variable that will prevent/allow user from downloading image
	public displayDownload: boolean = false;

	public productOptions: any = [];
	public selectedProductOptions: any = [];

	// 
	public isApp: boolean = false;

	public forceDisableTooltip: boolean = false;

	constructor(
		private http: HttpClient,
		private _FileSaverService: FileSaverService,
		public cacheService: CacheService,
		public canvasService: CanvasService,
		private eventService: PubSubService,
		private translate: TranslateService,
		private customiseControlsService: CustomiseControlsService,
		public shortcutService: ShortcutKeysService
	) {
		if (this.firstTimeLoaded) {
			return;
		}
		this.firstTimeLoaded = true;
		this.setBasicConfiguration();
		/this.canvasService.initZoom();
		this.canvasService.initScaleFactor();
		document.onclick = ((event: any) => {
			let demoModeClasses = ['productdesigner-mobile-view', 'productdesigner-tab-view'], isDemoModeClassFound: boolean = false;
			for (let key in demoModeClasses) {
				let domElement = window.top.document.getElementsByClassName(demoModeClasses[key]);
				if (domElement && domElement.length && domElement[0]) {
					isDemoModeClassFound = true;
				}
			}
			if (!this.isResponsive || isDemoModeClassFound) {
				this.canvasService.checkClasses(event);
			}

		});

		let makeDesignStatus = document.getElementById("admin_design");
		this.isAdmin = (!makeDesignStatus) ? false : true;
		// this.isAdmin = true;
		if (this.isAdmin) {
			let namenumber_design = document.getElementById("namenumber_design");
			this.nameNumber = (!namenumber_design) ? false : true;
		}

		if (this.isAdmin) {
			let generatesvg_design = document.getElementById('generatesvg_design');
			this.isGenerateSVGDesign = (!generatesvg_design) ? false : true;
		}
	}

	/**
	 * [setBasicConfiguration Set Basic URLs, params,variables]
	 */
	setBasicConfiguration() {
		this.defaultPlaceholderImage = "";
		let placeHolder: any = document.getElementsByName("placeHolderUrl")[0];
		if (placeHolder) {
			this.defaultPlaceholderImage = placeHolder.value;
		}
		let base_url = <HTMLInputElement>document.getElementsByName("mage_base_url")[0];
		let baseUrl = atob(base_url.value);
		this.baseUrl = baseUrl;
		let store_key = <HTMLInputElement>document.getElementsByName("store_id")[0];
		let storeId = atob(store_key.value);
		let currency_key = <HTMLInputElement>document.getElementsByName("currency_code")[0];
		let currency = atob(currency_key.value);
		this.flushCache(storeId, currency);

		let params = this.getUrlParams(['id', 'design', 'item', 'isApp']);
		if (!params || !params['id']) {
			return;
		}
		this.productId = params['id'];
		this.canvasService.productId = params['id'];
		this.designId = (params['design']) ? params['design'] : '';
		this.itemId = (params['item']) ? params['item'] : '';
		if (params.hasOwnProperty('isApp') && (params['isApp'] == 'true' || params['isApp'] == true)) {
			this.isApp = true;
		}

		this.initResponsive();

		let self = this;
		window.onresize = function (event) {
			self.processWindowSize(self);
		};
	}

	/**
	 * Process which update all responsive supported stuffs
	 * @return {[type]} [description]
	 */
	processWindowSize(self) {
		self.initResponsive();
		if (this.canvasService.currentCanvas) {
			let currObj = this.canvasService.currentCanvas.getActiveObjects();
			setTimeout(() => {
				// this.canvasService.deselectAllObjects();
				if (currObj && currObj.length > 0 && currObj.type != 'activeSelection') {
					// this.eventService.$pub('selectThisObjects', currObj);
				}
			}, 100);

		}
		self.eventService.$pub('windowResize');
	}

	/**
	 * update isResponsive var based on window width
	 */
	initResponsive() {
		if (window.innerWidth <= 1024) {
			this.canvasService.isResponsive = this.isResponsive = true;
		} else {
			this.canvasService.isResponsive = this.isResponsive = false;
		}
	}

	/**
	 * Fetch Param values from URL
	 * @return array
	 */
	getUrlParams(paramKey) {
		let url = location.href;
		let UrlArray = url.split("/");
		let params = [];
		for (var j = 0; j < UrlArray.length; j++) {
			if (paramKey.indexOf(UrlArray[j]) >= 0) {
				params[UrlArray[j]] = UrlArray[j + 1];
			}
		}
		return params;
	}

	/**
	 * [flushCache Flush all angular cache if store id or currency changes]
	 * @param {int} storeId  [Current store Id of Magento]
	 * @param {string} currency [Current Currency of Magento]
	 */
	flushCache(storeId, currency) {
		if (this.cacheService.exists('cache-storeid' + '-' + this.baseUrl)) {
			let cachedStoreId: any | null = this.cacheService.get('cache-storeid' + '-' + this.baseUrl);
			if (cachedStoreId != storeId) {
				this.cacheService.removeAll();
			}
		}
		if (this.cacheService.exists('cache-currency' + '-' + this.baseUrl)) {
			let cachedCurrency: any | null = this.cacheService.get('cache-currency' + '-' + this.baseUrl);
			if (cachedCurrency != currency) {
				this.cacheService.removeAll();
			}
		}
		this.cacheService.set('cache-storeid' + '-' + this.baseUrl, storeId, { maxAge: 15 * 60 });
		this.cacheService.set('cache-currency' + '-' + this.baseUrl, currency, { maxAge: 15 * 60 });
		if (this.isDeveloperMode) {
			this.cacheService.removeAll();
		}
	}
	/**
	 * [post HTTP post method]
	 * @param {string} url    [Magento Controller URL passed from component]
	 * @param {object} params [Params which needs to be passed to Magento Controller]
	 */

	post(actionURL, params, showMainLoader: boolean = false, httpHeaders: HttpHeaders = null) {

		// when user has not set any headers
		// we will set default headers
		let defaultHeaders = new HttpHeaders();
		defaultHeaders = defaultHeaders.append("Content-type", "application/x-www-form-urlencoded");
		defaultHeaders = defaultHeaders.append("X-Requested-With", "XMLHttpRequest");

		// determine if user has specifed any headers
		// if not, use our default headers
		let headers = (httpHeaders) ? httpHeaders : defaultHeaders;

		// show mainLoader is params is true
		if (showMainLoader === true) this.eventService.$pub("showMainLoader");

		// if isAjax is not set, assign the same
		actionURL = (actionURL.indexOf("isAjax") === -1) ? actionURL + '?isAjax=true' : actionURL;

		// finally hit the request
		return this.http.post(this.baseUrl + actionURL, params, { headers: headers })
			.toPromise()
			.then(res => res)
			.finally(() => {
				// this will hide main loader
				if (showMainLoader === true) this.eventService.$pub("hideMainLoader");
			});
	}

	postFile(url, fileData) {
		const headers = new HttpHeaders().set('Content-Type', []);
		return this.http.post(this.baseUrl + url, fileData, { headers: headers })
			.toPromise().then(res => res);
	}

	/**
	 * this is common function for all get data requests
	 * if data is already present in cache, return same, fetch from api call otherwise
	 * 
	 * @param url url to api
	 * @param params request payload
	 * @param cacheKey cache key
	 * @param loaderComponentRef 
	 * 			- reference to loader component used in individual component
	 * 			- this is  used when component needs to show loader untill get data finishes it's operation in same component
	 * @param showMainLoader flag variable that indicates whether to show/hide main loader or sub loader
	 */
	getData(url, params, cacheKey, loaderComponentRef: LoaderComponent = null, showMainLoader: boolean = false): Promise<any> {
		return new Promise((resolve, reject) => {
			// if cache is already present, return the same
			if (this.cacheService.exists(cacheKey) && cacheKey != null) {
				let data = this.cacheService.get(cacheKey);
				resolve(data);
			}

			// if not then fetch from api first and then store response to cache
			else {

				// as our every request will be post request, add isAjax param to url
				url += '?isAjax=true';

				// this action is for init requests
				// as on page load, we are hitting several requests from individual component
				// untill each component gets their response, we need to show main loader
				// so we are using loader checked which will indicated we are done with this process
				// loaderRequests is request counter which will keep track of total request occured
				// loaderResponse is response counter which will be compared with loaderRequests, and hide loader and change status of loaderChecked to true
				if (this.loaderChecked === false) {
					this.eventService.$pub('showMainLoader');
					this.loaderRequests++;
				}
				// if loader instance is specified
				if (loaderComponentRef != null) {
					loaderComponentRef.showSubLoader = true;
				}

				// api call
				this.post(url, params, showMainLoader)
					.then(
						data => {
							this.cacheService.set(cacheKey, data, { maxAge: 15 * 60 });
							resolve(data);
						})
					.catch(err => reject(err))
					.finally(() => {

						// here we will hide loader and change flag to true to prevent multiple request loaders
						if (this.loaderChecked == false) {
							this.loaderResponse++;

							if (this.loaderRequests == this.loaderResponse) {
								this.loaderChecked = true;
								this.eventService.$pub('hideMainLoader');
							}
						}

						// if loader instance is specified
						if (loaderComponentRef != null) {
							loaderComponentRef.showSubLoader = false;
						}
					});
			}
		});

	}
	async getSubTabs(mainTabId, cacheKey) {
		let params = {
			'data': mainTabId,
			'product_id': this.productId,
			'isAdmin': this.isAdmin
		}, url = 'productdesigner/Tabs/getSubTabs', data: any;
		cacheKey += this.productId + '-' + this.baseUrl;
		await this.getData(url, params, cacheKey).then(responseData => {
			data = responseData;
		}).catch(err => console.log(err));
		return data;
	}

	setSubTabsData(data, mainTabId: any = 0) {
		if (!data || !data) return;
		let subTabsData = data;
		let tempData = [];
		let allTabs = this.getAllTabs;
		for (var i = 0; i < subTabsData.length; i++) {
			if (subTabsData[i] == allTabs[subTabsData[i]]['id']) {
				let label = (mainTabId == subTabsData[i]) ? 'label' : 'custom_label';
				tempData.push({ id: allTabs[subTabsData[i]]['id'], label: allTabs[subTabsData[i]][label], component: allTabs[subTabsData[i]]['component'] });
			}
		}
		return tempData;
	}

	/**
	 * [joinObject join array keys and values with underscore('_')]
	 * @param {[type]} selectedOptions [Options which are selected from proudct option component]
	 */
	joinObject(selectedOptions) {
		return Object.keys(selectedOptions).join('_') + '_' + Object.values(selectedOptions).join('_');
	}

	/**
	 * This function will display swal alert and will return the same as promise(.then() .catch())
	 */
	swal(title, msg, type, confirmButtonText: string = "Ok", customClass: string = ""): Promise<any> {
		return Swal.fire({
			title: title,
			text: msg,
			type: type,
			confirmButtonText: confirmButtonText,
			customClass: customClass,
			allowOutsideClick: false
		});
	}

	/**
	 * This function will open modal
	 
	 */
	openThisModal(template: TemplateRef<any>, modalClass: string = "") {
		let obj = this.canvasService.getActiveObject();
		if (obj != false && (obj.type == 'text' || obj.type == 'textbox'))
			this.canvasService.deselectAllObjects();
		this.canvasService.modalService.onHidden.subscribe((reason: string) => {
			if (reason == 'backdrop-click') {
				return;
			}
		});
		return this.canvasService.modalService.show(template, Object.assign({ ignoreBackdropClick: true }, { class: modalClass }));
	}

	/**
	 * Logout user
	 */
	logout() {
		let url = "productdesigner/Customer/Logout";
		this.post(url, {}, true).then((resp: any) => {
			if (resp && resp.status == "success") {
				this.userLoggedIn = false;
				this.eventService.$pub('customerLoggedOut');
				this.swal(this.translate.instant("Success"), this.translate.instant("Logged out successfully"), "success");
			}
			else {
				let msg = (resp && resp.log) ? resp.log : this.translate.instant("Something went wrong");
				if (msg.lastIndexOf("-") >= 0) msg.substr(msg.lastIndexOf("-") + 2);
				this.swal(this.translate.instant("Error"), msg, "error");
			}
		});
	}

	setCookie(name, expires, value) {
		/*Set cookie for intro*/
		document.cookie = name + "=" + value + ";" + expires + ";path=/";
	}

	getCookie(cname) {
		let name: any = cname + "=";
		let decodedCookie: any = decodeURIComponent(document.cookie);
		let ca: any = decodedCookie.split(';');
		for (let i = 0; i < ca.length; i++) {
			let c = ca[i];
			while (c.charAt(0) == ' ') {
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return c.substring(name.length, c.length);
			}
		}
		return "";
	}

	/*Store Image for Preview and Download*/
	async getCanvasDataUrl(isFirst, currentImageId, getUrlOnly: boolean = true) {
		if (isFirst) {
			currentImageId = this.canvasService.activeImageId;
		}

		if (this.objectModification == true || this.generatedImage[currentImageId] == undefined || this.generatedImage[currentImageId] == '') {
			let images = this.canvasService.getCanvasDataUrl(currentImageId);
			let params = {
				'dataUrl': images,
				'product_image_data': this.canvasService.allImagesWithIds[currentImageId],
			}
			let response: any;
			let hasObjects = this.canvasService.hasCanvasObjectOrBackgroundAll();
			hasObjects = (hasObjects == null) ? false : hasObjects;
			params = Object.assign(params, { hasObjects: hasObjects });
			await this.post('productdesigner/index/preview', params).then((data: any) => {
				this.generatedImage[currentImageId] = data;
				response = (getUrlOnly === true) ? this.generatedImage[currentImageId].base.url : Object.assign({}, data);
				this.objectModification = false;
			}).catch(err => {
				console.log(this.translate.instant("Error in loading preview"), err);
			});
			return response;
		} else {
			return (getUrlOnly === true) ? this.generatedImage[currentImageId].base.url : this.generatedImage[currentImageId];

		}
	}

	/*Download Files*/
	downloadFiles(url, extension: string = '') {

		//Get  File Name
		let productName: String;
		this.eventService.$sub('getCartData', (data) => {
			productName = data.productName;
		});
		let dateObj = new Date();
		let month = dateObj.getUTCMonth() + 1;
		let day = dateObj.getUTCDate();
		let year = dateObj.getUTCFullYear();
		let newdate = year + "-" + month + "-" + day;
		let h = (dateObj.getHours() < 10) ? "0" + dateObj.getHours() : dateObj.getHours();
		let m = (dateObj.getMinutes() < 10) ? "0" + dateObj.getMinutes() : dateObj.getMinutes();
		let s = (dateObj.getSeconds() < 10) ? "0" + dateObj.getSeconds() : dateObj.getSeconds();
		let newtime = h + "-" + m + "-" + s;
		let fileName = productName + "_" + newdate + "_" + newtime + '.' + extension;

		//Download File here
		this.http.get(url, {
			observe: 'response',
			responseType: 'blob'
		}).subscribe(res => {
			this._FileSaverService.save(res.body, fileName);
		});
	}

	public calcFinalPrice(qty) {
		return (this.productPrice + this.otherPrices) * qty;
	}


	public showHideSubLoader(subLoaderInstance: any, checkForResponsive: boolean = false) {
		// if subloader instance is not valid
		if (!subLoaderInstance || !subLoaderInstance.hasOwnProperty('showSubLoader')) return;
		// flag variable that will be used to show/hide loader
		let showLoader: boolean = false;

		// if there is no need to check responsive, directly set loader value
		if (checkForResponsive === false) showLoader = !subLoaderInstance.showSubLoader;

		// else check if is responsive if not true, 
		// if it is true, then by default false is been set
		// if it is false, get opposite value of sub loader
		else if (!this.isResponsive) showLoader = !subLoaderInstance.showSubLoader;

		// finally assign flag value to specified instance
		subLoaderInstance.showSubLoader = showLoader;
	}

	public showHidePlaceholder(placeholderInstance: any) {


		// flag variable that will be used to show/hide loader
		let showPlaceholder: boolean = false;

		// else check if is responsive if not true, 
		// if it is true, then by default false is been set
		// if it is false, get opposite value of sub loader
		if (this.isResponsive) showPlaceholder = !placeholderInstance;

		// finally assign flag value to specified instance
		return showPlaceholder;
	}

	/*********** Infinity Scroll Section *************/
	prepareTempArrForPlaceholder(limit) {
		this.customPlaceholderArr = [];
		for (let i = 0; i < limit; i++) {
			this.customPlaceholderArr.push(i);
		}
	}

	processToolTip(tootltipData: any = [], option: boolean = false) {
		var self = tootltipData;
		var _this = this;
		let intro = introJs();
		let _intro = introJs();
		intro.exit();
		if (self == 'forceClose') return;
		if (this.forceDisableTooltip === true) {
			this.forceDisableTooltip = false;
			return;
		}
		if (self != undefined) {
			setTimeout(function () {
				if (option) {
					_this.isToolTipEnable = true;
					intro.setOptions({
						steps: self,
						disableInteraction: false,
						scrollToElement: false,
						showBullets: false,
						showButtons: false,
						showStepNumbers: false,
						overlayOpacity: 0.2,
						highlightClass: "demoClass"
					}).start();
					intro.refresh();
					intro.onbeforeexit(function () {
						_this.isToolTipEnable = false;
					});
					setTimeout(function () { intro.exit(); _this.isToolTipEnable = false; }, 10000);
				} else {
					_this.isToolTipEnable = true;
					_intro.setOptions({
						steps: self,
						disableInteraction: false,
						scrollToElement: false,
						showBullets: false,
						showButtons: false,
						showStepNumbers: false,
						overlayOpacity: 0.2
					}).start();
					_intro.refresh();
					_intro.onbeforeexit(function () {
						_this.isToolTipEnable = false;
					});
					setTimeout(function () { intro.exit(); _this.isToolTipEnable = false; }, 15000);
				}
			}, 500);
		}
	}


	/**************** Common Opearation Functions *****************/
	updateObjectProperties(obj, properties, selectAfterUpdate: boolean = false) {
		let params = {
			obj: obj,
			properties: properties,
			crudServiceString: 'this.updateObjectService'
		};
		params = (selectAfterUpdate === false) ? Object.assign(params, { setActive: false }) : params;
		this.canvasService.objectCRUD(params);
	}
}
