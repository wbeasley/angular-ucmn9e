import { PriceService } from './../price/price.service';
import { CanvasService } from 'src/app/services/canvas.service';
import { CustomOptionsService } from './../custom-options/custom-options.service';
import { PubSubService } from 'angular7-pubsub';
import { MainService } from 'src/app/services/main.service';
import { DesignService } from 'src/app/services/design.service';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { FormatCurrency } from 'src/app/_helper/formatCurrency';
import { ConfProductAttrService } from '../conf-product-attr/conf-product-attr.service';
import { TranslateService } from '@ngx-translate/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent implements OnInit {
  customForm: FormGroup;
  modalRef: BsModalRef;
  tierPriceData: any;
  priceFormat: any;
  showBothPrices: any;
  productPriceExclTax: any;
  addnote: any;
  isLessPrintingMinmumQty: boolean = false;

  isClickedAddtoCart: boolean = false;
  // Custom Options
  protected customOptionsData: any;

  // Custom options file data
  protected customOptionsFileData: any;

  // Cart Data
  public qty: number;

  // conf attr
  public confProductOptionsObject;
  public defaultSelectedAttributes;
  public configurableAttributeData;

  public lastSavedDesignId: any = [];

  // Common
  public isProductConf: boolean;
  allowAddMore: any;

  constructor(
    public mainService: MainService,
    private eventService: PubSubService,
    private designService: DesignService,
    public confProductService: ConfProductAttrService,
    private translate: TranslateService,
    public customOptionsService: CustomOptionsService,
    public canvasService: CanvasService,
    public priceService: PriceService
  ) {
  }

  /**
   * Angular Init function
   */
  ngOnInit() {
    this.customForm = new FormGroup({
      method: new FormControl()
    });
    this.init();

  }

  formatCurrency(price: any) {
    if (price != null) {
      return FormatCurrency(price, this.confProductService.priceFormat, '');
    }

  }

  /**
   * Assign default values here
   */
  init() {
    this.qty = 0;
    this.customOptionsData = [];
    this.customOptionsFileData = [];
    this.defaultSelectedAttributes = {};
    this.subscribeEvents();
  }

  /**
   * Subscrine events and perform actions for  the same
   */
  async subscribeEvents() {

    /*Get Cart Data From Price Component*/
    this.eventService.$sub('getCartData', (data) => {
      this.confProductService.priceFormat = data.priceFormat;
      this.confProductService.finalPrice = data.finalPrice;
      this.confProductService.cartTotalAmount = FormatCurrency(data.finalPrice, data.priceFormat, '');
      this.tierPriceData = data.tierPriceData;
      this.showBothPrices = data.showBothPrices;
      this.productPriceExclTax = data.productPriceExclTax;
    });

    // subscribe event when product options data is fetched
    this.eventService.$sub('productOptionsFetched', (resp: any) => {
      this.confProductOptionsObject = Object.assign({}, resp);

      // set initial default selected super attributes
      this.confProductService.defaultSelectedOptions = Object.assign({}, resp.selectedOptions);
    });

    // when user changes product
    this.eventService.$sub('productChanged', (resp: any) => {

      // set new super attributes
      this.confProductService.resetMe = true;
      this.confProductService.defaultSelectedOptions = Object.assign({}, resp.defaultSelectedOptions);
      this.confProductService.defaultSelectedOptionsValues = Object.assign({}, resp.defaultSelectedOptionsValues);
      this.confProductService.fixDefaultSelectedOptions = Object.assign({}, resp.defaultSelectedOptionsValues);
    });

    this.eventService.$sub('resetCart', (removedNameNumberObj) => {
      this.confProductService.init();
      if (this.confProductService.isNameNumber && removedNameNumberObj != null && this.confProductService.cartData && this.confProductService.cartData.length > 0) {
        if (removedNameNumberObj.hasOwnProperty('nameNumberData') && removedNameNumberObj.hasOwnProperty('type'))
          removedNameNumberObj.nameNumberData.filter(removedObj => {
            this.confProductService.nameNumberReset(removedObj, removedNameNumberObj.type);
          })
        else if (removedNameNumberObj.hasOwnProperty('id')) {
          this.confProductService.nameNumberReset(removedNameNumberObj);
        }
      } else {
        this.confProductService.totalRows = [];
        this.confProductService.cartData = [];
        if (this.confProductService.nameNumberData.newRow && this.confProductService.nameNumberData.newRow.length > 0) {

          // set reset price flag
          let resetPrice: boolean = (removedNameNumberObj && removedNameNumberObj.hasOwnProperty('resetPrice')) ? removedNameNumberObj.resetPrice : false,

            // set default qty to set based on reset price flag
            // if reset price flag is true, default qty to sub will be total name number rows - 1
            defaultQtyToSubtract = (resetPrice) ? this.confProductService.nameNumberData.newRow.length - 1 : 1;

          // calc new total qty
          this.priceService.totalQty -= (this.priceService.totalQty > 1) ? defaultQtyToSubtract : 0;

          // set extra product price
          this.priceService.extraPriceToBeAdded.productPrice -= (this.priceService.extraPriceToBeAdded.productPrice <= 0) ? 0 : (this.priceService.defaultPrice * (defaultQtyToSubtract));

          // finally recalculate price
          this.priceService.addThisPrice();
        } else {
          this.priceService.totalQty = 1;
          this.priceService.extraPriceToBeAdded.productPrice = 0;
          this.priceService.addThisPrice();
        }
      }
    });
    this.eventService.$sub('objectAdded', (obj) => {
      obj = (Array.isArray(obj)) ? obj[0] : obj;
      if (this.confProductService.isNameNumber && this.confProductService.cartData && this.confProductService.cartData.length && this.confProductService.totalRows && this.confProductService.totalRows.length && obj.hasOwnProperty('addObj') && (obj.addObj == 'name' || obj.addObj == 'number')) {
        this.updateCartObject(obj.addObj, obj.text);
      }
    });
    this.eventService.$sub('objectUpdated', (obj) => {
      if (!this.confProductService.cartData || !this.confProductService.cartData.length) return;
      obj = (Array.isArray(obj)) ? obj[0] : obj;
      if (obj.hasOwnProperty('addObj') && (obj.addObj == 'name' || obj.addObj == 'number')) {
        let newText = obj.text, oldText = obj._stateProperties.text, type = obj.addObj;
        if (newText != oldText) {
          this.updateCartObject(type, newText);
        }
      }
    });
  }

  updateCartObject(type, newText) {
    let nameNumberId = this.confProductService.nameNumberData.newRow.find(nameNumberObj => (nameNumberObj[type] == newText));
    if (nameNumberId) {
      nameNumberId = nameNumberId.id;
      let findCartItem: any = null, totalCart = this.confProductService.cartData.length,
        tmpCartItem, index;
      for (let i = 0; i < totalCart; i++) {
        tmpCartItem = this.confProductService.cartData[i];
        if (tmpCartItem.hasOwnProperty('additional_options') && tmpCartItem.additional_options.length) {
          index = tmpCartItem.additional_options.indexOf(tmpCartItem.additional_options.find(additionalOpt => (additionalOpt.id == nameNumberId)));
          if (index >= 0) {
            findCartItem = tmpCartItem;
            findCartItem.additional_options[index][type] = newText;
            break;
          }
        }
      }
      if (findCartItem != null) {
        this.confProductService.cartData[this.confProductService.cartData.indexOf(findCartItem)] = findCartItem;
      }
    }
  }
  /**
   * Custom Options File upload process
   * We are returning promise here, as there could be more than one files, add to cart proccess needs to wait till this process is finished
   * 
   * @param fileList 
   */
  uploadFilesToServer(fileList): Promise<any> {

    // declare promise here
    return new Promise((resolve, reject) => {

      // if no files are found, return from here
      if (!fileList || fileList.length == 0) resolve(true);

      // variable declaration
      let formData: FormData = new FormData(), url = "productdesigner/Cart/uploadCustomOptionFile",
        totalFiles = fileList.length, totalProccessed: number = 0, tmpFileObj;

      // travers file object one by one
      fileList.filter(file => {

        // initialize fresh form data object
        formData = new FormData();

        // prepare form data
        formData.append('file', file);
        formData.append('allowedExtensions', file.allowedExtensions);

        // send post request with above data
        // as we are not performing any process after file is uploaded successfully
        // we are dealing with finally() directly 
        // logic here is, as soon as totalFiles matches with totalProccessed, we will return from here 
        this.mainService.postFile(url, formData)
          .then((resp: any) => {
            tmpFileObj = {
              fileName: resp.name,
              filePath: resp.url
            };
            tmpFileObj = Object.assign(tmpFileObj, file.fileInfo);
            this.customOptionsFileData.push(tmpFileObj);
          }).finally(() => {
            formData = null;
            totalProccessed++;
            if (totalProccessed == totalFiles) resolve(true);
          });
      });
    });
  }

  /**
   * Open add to cart popup
   * @param template 
   */
  async openModal(template: TemplateRef<any>) {
    if (!this.canvasService.hasCanvasObjectOrBackgroundAll()) {
      this.mainService.swal(this.translate.instant('Alert'), this.translate.instant('Please design the product !'), "warning");
      return;
    }
    await this.getCustomOptions();
    this.modalRef = this.mainService.openThisModal(template, 'byi-cart-modal');
    this.canvasService.deselectAllObjects();
    this.confProductService.init();
    //allow add more in add to cart
    /*let self = this;
    setTimeout(() => {
      self.confProductService.displayAddMore = self.allowAddMore;
    }, 500);*/
    this.confProductService.displayAddMore = this.allowAddMore;
  }

  /**
   * Get custom options
   */
  async getCustomOptions() {

    // var declaration
    let url = "productdesigner/Cart/getCustomOptions", param = {
      product_id: this.mainService.productId
    };

    // check if item id is present
    if (this.mainService.itemId) param = Object.assign(param, { itemId: this.mainService.itemId });

    // get custom option data from here
    await this.mainService.getData(url, param, 'cartCustomOptions-' + this.mainService.productId + '-' + this.mainService.itemId, null, true)
      .then(response => {
        // if no data is returned or error occured, display error message and return from here
        if ((response && response.status == "failure") || !(response && response.custom_options && response.status == "Success")) {
          let msg = (response && response.log) ? response.log : this.translate.instant("Something went wrong");
          this.mainService.swal(this.translate.instant("Error"), this.translate.instant(msg), "error");
          return;
        }

        this.allowAddMore = response.allow_add_more;
        // else store custom options data into variable
        this.customOptionsData = [].concat(response.customOptionsData);

        // set custom options data to custom options component via it's service
        this.customOptionsService.setCustomOptionsData(response);

        // if edit design is set, get qty from response
        let selectedQty: any = (response && response.selectedCustomOptions && response.selectedCustomOptions.qty) ? response.selectedCustomOptions.qty : null;

        // if user has set qty and then hit on Design it button
        if (selectedQty == null) {
          selectedQty = document.getElementsByClassName('qty');
          if (selectedQty && selectedQty[0] && selectedQty[0].value) {
            selectedQty = selectedQty[0].value;
          } else {
            selectedQty = null;
          }
        }

        // if none of the above, set default qty to 1
        selectedQty = (selectedQty == null) ? 1 : selectedQty;

        // set qty for simple product
        if (this.mainService.productType == 'simple')
          this.qty = this.priceService.totalQty > 1 ? this.priceService.totalQty : selectedQty;

        // set qty for configurable product
        else if (this.mainService.productType == 'configurable')
          this.confProductService.defaultQty = selectedQty;

        // this.confProductService.qtyUpdated(selectedQty);
      }).catch(err => console.log(this.translate.instant("get Custom Options Catch::::"), err));
  }

  /**
   * As soon as user clicks on add to cart button this function is triggered,
   * if custom option is detected, we will publish an event that will validate custom options data
   * in custom options component and will return the response for the same
   */
  validateCartData() {
    if (this.customForm) {
      this.isClickedAddtoCart = true;
      if (!this.customForm.valid) {
        this.eventService.$pub('showError', true);
        return;
      } else {
        if (parseFloat(this.priceService.printingMethodMinimumQty) > parseFloat(this.priceService.totalQty)) {
          this.isLessPrintingMinmumQty = true;
          Swal.fire({
            customClass: 'potrait-mode-popup',
            title: this.translate.instant("Error"),
            text: this.translate.instant('Minimum quantity required is ' + this.priceService.printingMethodMinimumQty),
            confirmButtonText: this.translate.instant('OK'),
            allowOutsideClick: false
          });
          return;
        }
      }
    }
    // set configurable product flag
    this.isProductConf = (this.mainService.productType == 'configurable') ? true : false;

    // if product is configurable, check for it's validation
    if (this.isProductConf) {
      let error: boolean = this.confProductService.isConfDataInvalid();

      // if error found, return from here only
      if (error === true) return
    }
    this.isClickedAddtoCart = false;
    this.isLessPrintingMinmumQty = false;
    // if no custom option data is found, call save design and add to cart directly
    if (!this.customOptionsData || this.customOptionsData.length == 0) {
      this.saveDesign();
      return;
    }

    // else validate custom options data and proceed further
    this.validateCustomOptionsData();
  }

  /**
   * Validate custom options data
   */
  validateCustomOptionsData() {

    // show main loader
    this.eventService.$pub('showMainLoader');

    // and check for validation process
    let validationResp = this.customOptionsService.validateCustomOptionsData();

    // if validation check returns true, display message accordingly
    if (validationResp.isInvalid == true) {
      setTimeout(() => {
        this.eventService.$pub('hideMainLoader');
      }, 500);
    }

    // here we will manage file upload
    // if any error occured, will display error for the same here
    else {
      this.uploadFilesToServer(validationResp.files).then(() => {
        this.saveDesign(validationResp.customOptions);
      });
    }
  }

  /**
   * This method will save the current design and then add product into cart
   */
  async saveDesign(customOptionsData: any = null) {

    let msg = this.translate.instant("Something went wrong");

    // if product type is simple
    if (this.isCartInvalid()) {
      this.eventService.$pub('hideMainLoader');
      return;
    };

    // if no error found
    if (this.isProductConf)
      this.configurableAttributeData = this.confProductService.getCartData();

    let data: any = {
      sweetAlert: false
    };
    let self = this;
    /**
     * This method first save all the canvases data url into text file
     */
    //     await this.designService.beforeSaveSingleSide();
    await this.designService.saveAllSidesCanvasData().then((resp: any) => {
      data.canvas_dataurl_file = resp.timestamp;
    }).catch(err => console.log(err));
    //   this.designService.afterSaveSingleSide();

    /**
     * This method fetch the all canvases json file and save the first image data url
     */

    data.cartData = this.configurableAttributeData;
    this.lastSavedDesignId = [];
    data.addnote = this.addnote;
    if (this.customOptionsService.selectedCustomOptionsTotal > 0) {
      data.customOptionsPrice = this.customOptionsService.selectedCustomOptionsTotal;
    }
    if (this.mainService.productType == 'simple') {
      data.qty = this.qty;
    }
    await this.designService.saveDesignData(data).then((resp: any) => {
      if (resp.status == 'success') {
        for (var i = 0; i < Object.keys(resp).length; i++) {
          let design = resp[i];
          if (!design) {
            break;
          }
          self.lastSavedDesignId.push(design.designId);
        }
      } else if (resp.status == 'failure') {
        msg = (resp.hasOwnProperty('log') && resp.log) ? resp.log : msg;
      }
    }).catch(err => {
      console.log(err);
    });

    /**
    * This method add product to cart
    */
    if (this.lastSavedDesignId.length > 0) {
      this.addToCart(customOptionsData);
    } else {
      this.mainService.swal(this.translate.instant("Error"), msg, "error");
    }
  }

  /**
   * This function will validate cart data ie. attributes(in case of configurable), qty etc
   * 
   * @param validationInProcess in case of custom option validation, we are showing main loader, so we need to hide the same
   */
  addToCart(customOptionsData: any = null) {
    // process for cart validation
    let url = "productdesigner/Cart/Save", params = {
      productId: this.mainService.productId,
      qty: this.qty,
      designId: this.lastSavedDesignId,
      printingMethodId: this.customForm.get('method').value,
    };
    // set custom options into params if available
    if (customOptionsData != null) {
      this.eventService.$pub('hideMainLoader');
      params = Object.assign(params, { customOptions: customOptionsData });
      params = Object.assign(params, { customOptionPrice: this.customOptionsService.selectedCustomOptionsTotal });
    }

    // set additional price if available
    if (this.priceService.additionalPrice && this.priceService.additionalPrice > 0) {
      params = Object.assign(params, { additionalPrice: this.priceService.additionalPrice });
    }

    // set custom options file upload data to params
    if (this.customOptionsFileData && this.customOptionsFileData.length > 0) {
      params = Object.assign(params, { customOptionFile: this.customOptionsFileData });
    }

    // if configurable attribute
    if (this.isProductConf) {
      params = Object.assign(params, { confProductData: this.configurableAttributeData });
    }

    // if item id is present
    params = (this.mainService.itemId) ? Object.assign(params, { itemId: this.mainService.itemId }) : params;

    // add to cart
    this.mainService.post(url, params, true).then((resp: any) => {
      if (resp && resp.status == "success") {
        window.addEventListener("beforeunload", function (t) {

        });
        // reset custom options file upload data object
        this.customOptionsFileData = [];
        this.customOptionsService.selectedCustomOptionsTotal = 0;
        this.canvasService.disableAddToCartAlert = true;
        if (window.location != window.parent.location) {
          window.top.location.href = resp.url;
        } else {
          window.location.href = resp.url;
        }
        return;
      }
      let msg = (resp && resp.log) ? resp.log : this.translate.instant("Something went wrong");
      this.mainService.swal(this.translate.instant("Error"), this.translate.instant(msg), "error");
    }).catch(err => console.log(this.translate.instant("Error in add to cart: "), err));
  }

  /**
   * 
   */
  isCartInvalid() {
    if (this.mainService.productType == 'simple' && this.qty <= 0) {
      this.mainService.swal(this.translate.instant("Error"), this.translate.instant("Please enter valid quantity first!"), 'error');
      return true;
    }
  }

  /**
   * return true if product type is configurable and configurable attr obj is ready
   */
  showConfigurableOptions() {
    return (this.mainService.productType == 'configurable' && this.confProductOptionsObject && this.defaultSelectedAttributes);
  }

  /**
   * 
   * @param qty 
   */
  simpleProductQtyUpdated(qty) {
    if (qty >= 1) {
      let price = this.confProductService.getProductPrice(this.mainService.productId, qty);
      if (price != this.priceService.defaultPrice) this.priceService.defaultPrice = price;
      price *= (qty - 1);
      this.priceService.extraPriceToBeAdded.productPrice = price;
      this.priceService.totalQty = parseInt(qty);
      this.priceService.addThisPrice();
      // this.confProductService.qtyUpdated(1, price);
      this.eventService.$pub('priceUpdate');
    }
  }

  /**
   * Close add to cart popup
   */
  closeModal() {
    this.isClickedAddtoCart = false;
    this.isLessPrintingMinmumQty = false;
    this.confProductService.fixDefaultSelectedOptions = {};
    this.modalRef.hide()
  }
}


