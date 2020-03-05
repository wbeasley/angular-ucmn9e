import { Component, OnInit, Input } from '@angular/core';
import { PriceService } from 'src/app/essentials/components/price/price.service';
import { MainService } from 'src/app/services/main.service';
import { PubSubService } from 'angular7-pubsub';
import { CanvasService } from 'src/app/services/canvas.service';
import { FormatCurrency } from 'src/app/_helper/formatCurrency';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: '[price-info]',
  templateUrl: './price-info.component.html',
  styleUrls: ['./price-info.component.scss']
})
export class PriceInfoComponent implements OnInit {

	showPriceInfo:boolean = false;
	isDisplayPriceInfo:boolean = false;
	priceInfoData = [];
	printingMethodPrice:any;
	currentProductOtion:any = "";
  priceFormat:any;
	@Input() data: any;

  constructor(
    public mainService: MainService,
    private eventService: PubSubService,
    private canvasService: CanvasService,
    public priceService: PriceService,
    private translate: TranslateService
  ) {
  	this.subscribeEvents();
  }

  ngOnInit() {
  	
  	let configPaths = ['productdesigner/general/enable_price_info'];
  	// prepare url and payload
  	let url = 'productdesigner/Index/getConfiguration', params = { configPaths, key: 'display-price-info' }, cacheKey: string = 'configuration-display-price-info' + this.mainService.baseUrl;
  	// hit post request
  	this.mainService.getData(url, params, cacheKey).then(resp => {
  		this.isDisplayPriceInfo = (resp[0] == 1) ? true : false;
  	}).catch(err => console.log(err));
  }

  subscribeEvents() {
  	this.eventService.$sub('priceUpdate', (priceData) => {
  		if(priceData && priceData.label == "perintingMethod"){				
  			this.printingMethodPrice = priceData.price;
        this.updatePriceInfo();
      }else{
  			this.updatePriceInfo();
  		}
  	});
  	this.eventService.$sub('objectAdded', (obj) => {
  		this.updatePriceInfo();
  	});
  	this.eventService.$sub('backgroundPatternsApplied', (obj) => {
  		this.updatePriceInfo();
  	});
    this.eventService.$sub('objectRemoved', (obj) => {
      this.updatePriceInfo();
    });
    this.eventService.$sub('closePriceInfo', (obj) => {
      this.showPriceInfo = false;
    });
  }

  displayInfo(){
  	this.showPriceInfo = (this.showPriceInfo == false) ? true : false;
  }

  updatePriceInfo(){

  	this.priceInfoData = []
    if(this.priceService.priceAllData){
      this.priceFormat = this.priceService.priceAllData.priceFormat;
    	let textCount = this.canvasService.getObjectTypeFromAllCanvasForPriceinfo('tab','text');
    	let clipartCount = this.canvasService.getObjectTypeFromAllCanvasForPriceinfo('tab','clipart');
    	let uploadCount = this.canvasService.getObjectTypeFromAllCanvasForPriceinfo('tab','upload');
    	let totalImgCount = clipartCount + uploadCount;
    				
    	let qty:any = (this.priceService.totalQty) ? this.priceService.totalQty : 0;
    	let productPrice:any = (this.priceService.priceAllData['productPrice'][this.mainService.associatedProductId]) ? this.priceService.priceAllData['productPrice'][this.mainService.associatedProductId] : 0;
    	let fixedPrice:any = (this.priceService.priceAllData.additionalFixedPrice) ? this.priceService.priceAllData.additionalFixedPrice : 0;
    	let tax:any = (this.priceService.priceAllData.tax) ? this.priceService.priceAllData.tax : 0;
    	let ImgPrice:any  = 0;let CustomImgPrice:any  = 0;
    	let getOptions = "";

    	if(this.mainService.productType == "configurable" && this.mainService.productOptions.length > 0){
    		let selectedDataKey = Object.keys(this.mainService.selectedProductOptions);
    		let selectedDataValue = Object.values(this.mainService.selectedProductOptions);			
    		let options = "";
    		let _this = this;
    		this.currentProductOtion = "";
    		selectedDataKey.forEach(function(opt,index){
    			var value = selectedDataValue[index];
    			let optionData = _this.mainService.productOptions.find(obj => (obj.id == opt));
    			let optoinValue = optionData.values.find(obj => (obj.value_index == value));
    			_this.currentProductOtion = _this.currentProductOtion+'|'+optoinValue.label;
    		});
    	}
      let finalProductPrice =0;
      let totalPrice = parseFloat(this.priceService.getIntPrice());    
      
    	if(productPrice){
    		finalProductPrice = productPrice * this.priceService.totalQty;
    		this.priceInfoData.push({'label': this.translate.instant('Product Price'), 'value': FormatCurrency(finalProductPrice,this.priceFormat,''), 'productQty': this.priceService.totalQty});
    	}
    	if(fixedPrice){
    		let finalFixedPrice = fixedPrice * this.priceService.totalQty;
    		totalPrice = totalPrice-finalFixedPrice;
    		this.priceInfoData.push({'label': this.translate.instant('Product Customize Price'), 'value': FormatCurrency(finalFixedPrice, this.priceFormat, ''), 'productQty': this.priceService.totalQty});
    	}
    	if(textCount){
        let textPrice:any = (this.priceService.getTotalAddedTextPrice() * this.priceService.totalQty);
    		totalPrice = totalPrice-textPrice;
    		this.priceInfoData.push({'label': this.translate.instant('Text Price'), 'value': FormatCurrency((textPrice), this.priceFormat, ''),'isQty': true, 'qty': textCount, 'productQty': this.priceService.totalQty});
    	}
    	if(clipartCount){
        let clipartPrice:any = this.priceService.getTotalClipartsPrice();
        ImgPrice = (parseFloat(clipartPrice)*this.priceService.totalQty);
    		totalPrice = totalPrice-ImgPrice;
    		this.priceInfoData.push({'label': this.translate.instant('Image Price'), 'value': FormatCurrency(ImgPrice, this.priceFormat, ''), 'isQty': true, 'qty': clipartCount, 'productQty': this.priceService.totalQty});
    	}
    	if(uploadCount){
        let CustomImgPrice:any = this.priceService.getTotalCustomUploadImagePrice();
        CustomImgPrice = (parseFloat(CustomImgPrice) * this.priceService.totalQty);
    		totalPrice = totalPrice-CustomImgPrice;
    		this.priceInfoData.push({'label': this.translate.instant('Custom Image Price'), 'value': FormatCurrency(CustomImgPrice, this.priceFormat, ''), 'isQty': true, 'qty': uploadCount, 'productQty': this.priceService.totalQty});
    	}
    	if(this.printingMethodPrice){
    		totalPrice = totalPrice-(this.printingMethodPrice * this.priceService.totalQty);
    		this.priceInfoData.push({'label': this.translate.instant('Printing Method Price'), 'value': FormatCurrency((this.printingMethodPrice * this.priceService.totalQty),this.priceFormat,''), 'productQty': this.priceService.totalQty});
    	}
      if(this.priceService.extraPriceToBeAdded.customOptionsPrice){
        totalPrice = totalPrice-(this.priceService.extraPriceToBeAdded.customOptionsPrice * this.priceService.totalQty);
        this.priceInfoData.push({'label': this.translate.instant('Additional Cost'), 'value': FormatCurrency((this.priceService.extraPriceToBeAdded.customOptionsPrice * this.priceService.totalQty),this.priceFormat,''), 'productQty': this.priceService.totalQty});
      }
    	this.priceInfoData[0] = {'label': this.translate.instant('Product Price'), 'value': FormatCurrency(totalPrice,this.priceFormat,''),'isProductQty': true, 'productQty': this.priceService.totalQty}
    	if(tax){
    		if(tax){this.priceInfoData.push({'label': 'Tax', 'value': tax+'%'});}
    	}
      
    }
  }

}
