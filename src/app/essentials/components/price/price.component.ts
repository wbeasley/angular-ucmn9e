import { PriceService } from './price.service';
import { ConfProductAttrService } from './../conf-product-attr/conf-product-attr.service';
import { Component, OnInit } from '@angular/core';
import { MainService } from 'src/app/services/main.service';
import { PubSubService } from 'angular7-pubsub';
import { CanvasService } from 'src/app/services/canvas.service';
import { FormatCurrency } from 'src/app/_helper/formatCurrency';
import { TranslateService } from '@ngx-translate/core';

@Component({
	selector: 'price',
	templateUrl: './price.component.html',
	styleUrls: ['./price.component.scss']
})
export class PriceComponent implements OnInit {

	data: any = [];
	finalPrice: any;
	fixedPrice: any;
	priceFormat: any;
	productPriceExclTax: any;
	productName: any;
	productPrice: any;
	isDisplayPriceInfo: boolean = false;
	showPriceInfo: boolean = false;
	loadedDesignPrice: number;
	loadedDesignQty: number;
	priceInfoData = [];
	printingMethodPrice: any;
	currentProductOtion: any = "";
	constructor(
		public mainService: MainService,
		private eventService: PubSubService,
		private canvasService: CanvasService,
		private confProductService: ConfProductAttrService,
		public priceService: PriceService,
		private translate: TranslateService
	) {
		this.subscribeEvents();
	}

	getPrice() {
		let params = {
			'product_id': this.mainService.productId,
			'associated_id': this.mainService.associatedProductId
		},
			url = 'productdesigner/index/loadPrice', cacheKey: string = 'getPrice' + this.mainService.productId + '-' + this.mainService.associatedProductId + '-' + this.mainService.baseUrl;
		this.mainService.getData(url, params, cacheKey).then(priceData => {
			this.priceService.priceAllData = JSON.parse(JSON.stringify(priceData.data));
			this.confProductService.productPrice = Object.assign({}, this.priceService.priceAllData.productPrice);
			this.confProductService.tierPrice = Object.assign({}, this.priceService.priceAllData.tierPrice);
			this.fixedPrice = this.priceService.priceAllData.additionalFixedPrice ? this.priceService.priceAllData.additionalFixedPrice : 0;
			this.calculatePrice();
			this.eventService.$pub('priceUpdate');
		}).catch(err => console.log(err));
	}

	ngOnInit() {
		this.loadedDesignPrice = 0;
		this.loadedDesignQty = 1;
	}

	subscribeEvents() {
		this.eventService.$sub('objectAdded', (obj) => {
			obj = (Array.isArray(obj)) ? obj[0] : obj;
			this.calcAllObjPrice();
		});
		this.eventService.$sub('objectRemoved', (obj) => {
			obj = (Array.isArray(obj)) ? obj[0] : obj;
			this.calcAllObjPrice();
		});
		this.eventService.$sub('processLoadProduct', () => {
			this.getPrice();
		});
		this.eventService.$sub('backgroundPatternsApplied', () => {
			this.calcAllObjPrice();
		});
	}

	/* For Price Management*/
	calculatePrice() {
		this.priceFormat = this.priceService.priceAllData.priceFormat;
		let prices: any = {
			textPrice: this.priceService.priceAllData.addedTextPrice,
			addImagePrice: this.priceService.priceAllData.addedImagePrice,
			uploadPrice: this.priceService.priceAllData.customAddedImagePrice,
			tax: this.priceService.priceAllData.tax,
			addTax: (this.priceService.priceAllData.showIncludeTax || this.priceService.priceAllData.showBothPrices)
		};
		let ObjPrice: any = this.canvasService.fetchAllObjectPrices(prices);
		let OriginalProductPrice: any;
		let taxPrice: number = 0;
		this.productPrice = this.priceService.priceAllData.priceExclTax;
		if (this.priceService.priceAllData.productPrice && Object.keys(this.priceService.priceAllData.productPrice).length && this.mainService.associatedProductId && this.priceService.priceAllData.productPrice[this.mainService.associatedProductId])
			this.productPrice = this.priceService.priceAllData.productPrice[this.mainService.associatedProductId];

		if (this.priceService.priceAllData.showIncludeTax) {
			OriginalProductPrice = this.priceService.priceAllData.priceInclTax;
			taxPrice = (parseFloat(this.priceService.priceAllData.priceExclTax) * parseFloat(this.priceService.priceAllData.tax)) / 100;
			this.productPrice = parseFloat(this.priceService.priceAllData.priceInclTax);
			if (taxPrice > 0)
				this.productPrice = (parseFloat(this.priceService.priceAllData.priceInclTax) / (100 + parseFloat(this.priceService.priceAllData.tax))) * 100;
		} else if (this.priceService.priceAllData.showExcludeTax) {
			OriginalProductPrice = this.priceService.priceAllData.priceInclTax;
			this.productPrice = this.priceService.priceAllData.priceExclTax;
		} else {
			this.productPrice = this.priceService.priceAllData.productPrice[this.mainService.associatedProductId];
		}
		if (this.priceService.priceAllData.showBothPrices) {
			taxPrice = (parseFloat(this.priceService.priceAllData.priceExclTax) * parseFloat(this.priceService.priceAllData.tax)) / 100;
			OriginalProductPrice = parseFloat(this.priceService.priceAllData.priceInclTax);
			let forBothPrice = parseFloat(this.priceService.priceAllData.priceExclTax) + parseFloat(this.fixedPrice) + parseFloat(ObjPrice.totalTextExcluTaxPrice) + parseFloat(ObjPrice.totalClipartImgExcluTaxPrice) + parseFloat(ObjPrice.totalUploadImgExcluTaxPrice);
			this.productPriceExclTax = FormatCurrency(forBothPrice, this.priceFormat, '');
		}
		this.priceService.tax = (parseFloat(this.priceService.priceAllData.tax) > 0 && (this.priceService.priceAllData.showIncludeTax || this.priceService.priceAllData.showBothPrices)) ? parseInt(this.priceService.priceAllData.tax) : null;
		this.mainService.productPrice = parseFloat(this.productPrice);
		this.mainService.otherPrices = parseFloat(this.fixedPrice);

		// in case of configurable product, when user changes qty or 
		// attributes in add to cart popup, we find different prices based on input
		// so we need to add fixed price to the new price
		// hence we are saving fixed price in service
		this.priceService.fixedPrice = parseFloat(this.fixedPrice);
		this.calcAllObjPrice();
		let finalPrice: any;
		let tierPriceData: any;
		tierPriceData = this.priceService.priceAllData.tierPrice[this.mainService.associatedProductId];
		if (tierPriceData != undefined) {
			tierPriceData.filter(obj => {
				if (OriginalProductPrice <= obj.website_price) {
					tierPriceData = [];
				}
			});
		}
		finalPrice = this.mainService.calcFinalPrice(1);
		this.productName = this.priceService.priceAllData.productName;
		let cartData: any = {
			productName: this.priceService.priceAllData.productName,
			totalAmount: this.mainService.productPrice,
			priceFormat: this.priceFormat,
			showBothPrices: this.priceService.priceAllData.showBothPrices,
			tierPriceData: tierPriceData,
			productPriceExclTax: this.productPriceExclTax,
			finalPrice: finalPrice
		}
		this.eventService.$pub('getCartData', cartData);
		this.priceService.defaultPrice = this.productPrice;
		this.priceService.addThisPrice();
		this.priceService.priceFormat = this.priceFormat;
		this.finalPrice = FormatCurrency(finalPrice, this.priceFormat, '');
		this.calcAllObjPrice();
	}

	/**
	 * 
	 * @param obj 
	 */
	calcAllObjPrice() {

		// if price has not been loaded yet
		if (!this.priceService.priceAllData) return;

		// variable declaration
		let textPrice: any = (this.priceService.priceAllData.addedTextPrice == null) ? 0 : parseFloat(this.priceService.priceAllData.addedTextPrice),
			imagePrice = (this.priceService.priceAllData.addedImagePrice == null) ? 0 : parseFloat(this.priceService.priceAllData.addedImagePrice),
			customImagePrice = (this.priceService.priceAllData.customAddedImagePrice == null) ? 0 : parseFloat(this.priceService.priceAllData.customAddedImagePrice),
			allCanvases = this.mainService.canvasService.containerCanvases, tmpCanavs, allObjects,
			finalPrice = (this.priceService.fixedPrice) ? this.priceService.fixedPrice : 0;

		// traverse through each canvas one by one
		for (let key in allCanvases) {

			// store current canvas in tmp var
			tmpCanavs = allCanvases[key];

			// fetch all objects of tmp canvas
			allObjects = this.mainService.canvasService.getObjects(tmpCanavs);

			// traverse through each object
			allObjects.filter(currObj => {

				// if object is of type text
				if ((currObj.type == 'text' || currObj.type == 'textbox') && textPrice) {
					finalPrice += textPrice;
				}

				// if object is of type image
				// we will determine price by tab
				else if (currObj.hasOwnProperty('tab')) {

					// if tab is clipart, add image price to final
					if (currObj.tab == 'clipart' && imagePrice && (!currObj.price || currObj.price == "NULL" || currObj.price <= 0)) {
						finalPrice += imagePrice;
					}

					// if tab is upload, add image price and custom image upload price
					else if (currObj.tab == 'upload' && customImagePrice != null && imagePrice != null) {
						finalPrice += imagePrice + customImagePrice;
					}
				}

				// if current object has price property
				// add the same
				if (currObj.hasOwnProperty('price') && parseFloat(currObj.price) > 0) {
					finalPrice += parseFloat(currObj.price);
				}
			});
		}
		// finally add final price to service object
		this.mainService.otherPrices = finalPrice;

		// recalcuate the price
		this.priceService.addThisPrice();
	}
}
