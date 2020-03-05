import { PubSubService } from 'angular7-pubsub';
import { Component, OnInit, Input } from '@angular/core';
import { MainService } from 'src/app/services/main.service';
import { CanvasService } from 'src/app/services/canvas.service';
import { DesignService } from 'src/app/services/design.service';
import { CacheService, CacheStoragesEnum } from 'ng2-cache';

@Component({
  selector: 'product-options',
  templateUrl: './product-options.component.html',
  styleUrls: ['./product-options.component.scss']
})
export class ProductOptionsComponent implements OnInit {

  @Input() selected_super_attributes;
  public options;
  public productsCombination;
  public selectedOptions;
  public selectedOptionsValues;
  public selectedOptionString;
  public allProducts;
  public productOptionsCacheKey;
  public productOptionsOpened: any = false;

  constructor(
    public mainService: MainService,
    private cacheService: CacheService,
    private eventService: PubSubService,
    private canvasService: CanvasService,
    private designService: DesignService
    ) {
    this.productOptionsCacheKey = 'productOptions' + this.mainService.productId + '-' + this.mainService.baseUrl;
  }

  ngOnInit() {
    this.getProductOptions();
    this.subscribeEvents();
  }

  subscribeEvents() {
    this.eventService.$sub('closeProductOptions', () => {
      this.productOptionsOpened = false;
    });
  }

  getProductOptions() {
    let selectedOptionsString = '';
    if (this.selected_super_attributes) {
      selectedOptionsString = this.mainService.joinObject(this.selected_super_attributes);
    }
    let params = {
      'product_id': this.mainService.productId,
      'selectedOptions': this.selected_super_attributes
    }, url = 'productdesigner/index/productOptions', cacheKey: string = this.productOptionsCacheKey + selectedOptionsString + this.mainService.designId + this.mainService.itemId;
    params = (this.designService.designId) ? Object.assign(params, { designId: this.designService.designId }) : params;
    this.mainService.getData(url, params, cacheKey).then(data => {
      this.eventService.$pub('productOptionsFetched', data);
      this.processProductOptions(data);
    }).catch(err => console.log(err));

  }
  processProductOptions(data) {
    this.options = data.productOptions;
    this.mainService.productOptions = data.productOptions;
    this.eventService.$pub('priceUpdate');
    this.productsCombination = data.productsCombination;
    this.selectedOptions = data.selectedOptions;
    this.selectedOptionsValues = data.selectedOptionsValues;
    this.selectedOptionString = Object.values(this.selectedOptionsValues).join("_");
    this.allProducts = data.allProducts;
    if (this.cacheService.exists("product-tooltip-data") && this.cacheService.get("product-tooltip-data") == true) {  
      let tootltipData = [];
      let productIntro = (this.mainService.productTooltipData[0] != "") ? this.mainService.productTooltipData[0] : "";
      tootltipData.push({ element: ".byi-product-attr", intro: productIntro, position: 'right' });
      this.mainService.processToolTip(tootltipData, true);
      this.toggleOptions();
      this.cacheService.set("product-tooltip-data", false, { maxAge: 0 });
    }
    if(this.options) {
      if(document.querySelector('.byi-fab')){
        document.querySelector('.byi-fab').classList.add('byi-fab-option-active');
      }
    }
  }
  toggleOptions() {
    if (this.productOptionsOpened) {
      this.productOptionsOpened = false;
      if(document.querySelector('.byi-fab')){
        document.querySelector('.byi-fab').classList.remove('hide');
      }
    } else {
      this.productOptionsOpened = true;
      if(document.querySelector('.byi-fab')){
        document.querySelector('.byi-fab').classList.add('hide');
      }
    }
  }
  changeProduct(value, attId, i) {
    this.setActiveSwatch(value, attId, i);
    /**
     * Fetch all object from current canvas before changing product combination
     */
     this.canvasService.fetchAllObjects();
     this.eventService.$pub('productChanged', {
       defaultSelectedOptions: this.selectedOptions,
       defaultSelectedOptionsValues: this.selectedOptionsValues
     });
   }
   setActiveSwatch(value, attId, i) {
     this.selectedOptions[attId] = value.value_index;
     this.selectedOptionsValues[i] = value.value_index;
     this.selectedOptionString = Object.values(this.selectedOptionsValues).join("_");
   }
   checkProductOptionsValidation(currentValue, index) {
     let selectedOptions = this.selectedOptionString.split("_");
     selectedOptions[index] = currentValue.value_index;
     let currentOption = selectedOptions.join("_");
     let combinations = Object.values(this.productsCombination);
     if (combinations.indexOf(currentOption) == -1) {
       return true;
     }
     return false;
   }
 }