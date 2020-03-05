import { MainService } from 'src/app/services/main.service';
import { Injectable } from '@angular/core';
import { FormatCurrency } from 'src/app/_helper/formatCurrency';
import { PubSubService } from 'angular7-pubsub';
import { PriceService } from '../price/price.service';

@Injectable({
  providedIn: 'root'
})
export class ConfProductAttrService {

  // Var Declaration
  public cartData;
  public isSubmitted: boolean = false;
  public defaultQty: number = 1;
  public totalRows: any;

  public productsCombination;

  // default selected attributes
  public defaultSelectedOptions: any;
  public fixDefaultSelectedOptions: any;
  public defaultSelectedOptionsValues: any;
  public allDefaultSelectedAttrs: any = [];

  // for validation  
  public selectedOptionString: any;

  // flag that will force cart to reset
  public resetMe: any = null;
  public displayAddMore: boolean = false;

  // cart total amount variable
  public finalPrice: any;
  public cartTotalAmount;
  public priceFormat;

  // 
  public productPrice;
  public tierPrice;

  // name number
  public isNameNumber: boolean;
  public nameNumberData: any = {};

  /**
   * Dependancy injection
   */
  constructor(
    public mainService: MainService,
    public eventService: PubSubService,
    public priceService: PriceService
  ) {
    this.subscribeEvents();
  }


  init() {
    // this.isNameNumber = (this.nameNumberService.addName || this.nameNumberService.addNumber) ? true : false;
  }


  subscribeEvents() {
    this.eventService.$sub('addCustomPriceToTotal', () => {
      this.qtyUpdated(1);
    });
    this.eventService.$sub('nameNumberDisabled', () => {
      this.isNameNumber = false;
    });
    this.eventService.$sub('nameNumberEnabled', (nameNumberData) => {
      this.isNameNumber = true;
      this.nameNumberData = nameNumberData;
    });
  }

  /**
   * Initialize cart object to null for each attribute index
   * 
   * @param rowIndex Row Index
   * @param confAttrs configurable attributes array
   */
  initCartObject(rowIndex, confAttrs) {

    // as default options values changes each time,
    // we will be storing it's values for the first time in our variable
    // this variable will be used each time when new row needs to be added
    if (!this.fixDefaultSelectedOptions ||
      Object.keys(this.fixDefaultSelectedOptions).length == 0) this.fixDefaultSelectedOptions = Object.assign({}, this.defaultSelectedOptionsValues);

    // reset isSubmitted flag to false each time new row is added
    this.isSubmitted = false;

    // initialize cart data object for current row index
    this.cartData[rowIndex] = { super_attribute: {} };

    let qtyToAssign = this.defaultQty;

    // if name number
    if (this.isNameNumber) {

      // initialize empty name number object
      let additional_options = [{}];

      // set id first
      additional_options[0] = Object.assign(additional_options[0], { id: this.nameNumberData.newRow[rowIndex].id });

      // check if name exists
      if (this.nameNumberData.addName) additional_options[0] = Object.assign(additional_options[0], { name: this.nameNumberData.newRow[rowIndex].name });

      // check if number exists
      if (this.nameNumberData.addNumber) additional_options[0] = Object.assign(additional_options[0], { number: this.nameNumberData.newRow[rowIndex].number });

      // finally add this object to cartData object
      this.cartData[rowIndex] = Object.assign(this.cartData[rowIndex], { additional_options: additional_options });
      qtyToAssign = (this.nameNumberData.newRow[rowIndex].hasOwnProperty('qty') && this.nameNumberData.newRow[rowIndex].qty) ? this.nameNumberData.newRow[rowIndex].qty : this.defaultQty;
    }

    // store fix default options into tmp variable
    let tmpSelectedValues: any = Object.assign({}, this.fixDefaultSelectedOptions);

    // filter conf attr array to get attr id
    confAttrs.filter((confAttrArr, index) => {
      this.cartData[rowIndex].super_attribute[confAttrArr.id] = tmpSelectedValues[index];
    });

    // store selected values to all default selected 
    this.allDefaultSelectedAttrs[rowIndex] = Object.assign({}, tmpSelectedValues);

    // delete tmpSelectedValues;
    let productId = this.getProductId(rowIndex);

    this.cartData[rowIndex] = Object.assign(this.cartData[rowIndex], { productId: productId });
    // finally assign qty object to cart data object
    this.cartData[rowIndex] = Object.assign(this.cartData[rowIndex], { qty: qtyToAssign });
  }

  /**
   * This function is triggered when name/number row is removed
   * Here we will remove that row too from cart item
   * and subtract the price of the same
   * 
   * @param removedNameNumberObj 
   */
  nameNumberReset(removedNameNumberObj, selectedKey: any = null) {

    // if no cart data found, return
    if (!this.cartData || !this.cartData.length) return;

    // when key is not specified
    // we will manually determine the key
    if (selectedKey == null) {

      // if both name and number selected
      if (this.nameNumberData.addName && this.nameNumberData.addNumber) {
        selectedKey = 'both';
      }

      // if only name is selected
      else if (this.nameNumberData.addName && !this.nameNumberData.addNumber) {
        selectedKey = 'name';
      }

      // if only number is selected
      else if (!this.nameNumberData.addName && this.nameNumberData.addNumber) {
        selectedKey = 'number';
      }
    }

    // if key is specified(eg. name)
    else {

      // determine the other key(eg. number)
      let otherKey = (selectedKey == 'addName') ? 'addNumber' : 'addName';

      // check if other key is enabled
      // eg if user had selected both name and number and then he deselects name
      // in this case this function will also been triggered
      // so we are checking if number is still checked, skip the process
      if (this.nameNumberData[otherKey] == true) {
        selectedKey = null;
      }

      // if selected key is not null
      // determine the key value
      selectedKey = (selectedKey != null && selectedKey == 'addName') ? 'name' : 'number';
    }

    // if key is null, return
    if (selectedKey == null) return;

    // variable declaration    
    let additionalOptions: any, foundCartItem: any = null,
      totalCartItems = this.cartData.length, cartItem;

    // loop traversal
    for (let i = 0; i < totalCartItems && foundCartItem == null; i++) {

      // store cart data to custom var
      cartItem = this.cartData[i];

      // get addition option object
      additionalOptions = cartItem.additional_options[0];

      // check if removed name number id matches to current name number id
      if (removedNameNumberObj.id == additionalOptions.id) {

        // check key value for both name and number selection
        if (selectedKey == 'both' && (removedNameNumberObj.name == additionalOptions.name && removedNameNumberObj.number == additionalOptions.number)) {
          foundCartItem = cartItem;
        }

        // else check with specific key
        else if ((removedNameNumberObj[selectedKey] == additionalOptions[selectedKey])) {
          foundCartItem = cartItem;
        }
      }
    }

    // if found cart item is not null
    // remove that item from cart
    // subtract price of that item as well
    if (foundCartItem != null) {
      this.totalRows.splice(this.cartData.indexOf(foundCartItem), 1);
      this.cartData.splice(this.cartData.indexOf(foundCartItem), 1);
      this.eventService.$pub('qtyUpdated');
    }
  }

  /**
   * 
   * @param superAttribute 
   */
  getProductId(rowIndex) {
    let superAttribute = this.allDefaultSelectedAttrs[rowIndex], selectedAttrs = Object.values(superAttribute).join('_'),
      productIds = Object.keys(this.productsCombination),
      productAttrs = Object.values(this.productsCombination), index;
    index = productAttrs.indexOf(selectedAttrs);
    return productIds[index];
  }

  /**
   * remove cart object on click on remove icon
   * 
   * @param rowIndex 
   */
  removeRow(rowIndex, cartData: any = null) {
    if (cartData != null) {
      if (cartData && cartData[rowIndex]) cartData.splice(rowIndex, 1);
    } else {
      if (this.cartData && this.cartData[rowIndex]) this.cartData.splice(rowIndex, 1);
    }
  }

  /**
   * cart data validation
   * 
   * @return boolean value(true if cart is )
   */
  isConfDataInvalid(): boolean {

    // set is submitted flag to true to display error messages
    this.isSubmitted = true;

    // variable declaration
    let i, error: boolean = false, totalCartData = this.cartData.length,
      cartObj: any, superAttribute;

    // as we need to stop iteration as soon as we found error in any of the validation,
    // we are using for loop here
    for (i = 0; i < totalCartData && error === false; i++) {

      // store current cart data object to local variable      
      cartObj = this.cartData[i];

      // if cart data obj is not initialized,
      // or qty is not initialized
      // or qty is <= 0
      // or super attribute object is not assigned, set error to true and break loop
      if (!cartObj || !cartObj.qty || cartObj.qty <= 0 || !cartObj.super_attribute) {
        error = true;
        break;
      }

      // store super attribute to local variable
      superAttribute = cartObj.super_attribute;

      // traverse each super attribute one by one
      for (let key in superAttribute) {

        // check if any of the attribute has null value,
        // if yes, then set error to true and stop iteration
        if (superAttribute.hasOwnProperty(key) && superAttribute[key] == "null") {
          error = true;
          break;
        }
      }
    }

    // return true/false based on above actions
    return error;
  }

  /**
   * simply just set method to return cart data object
   */
  getCartData() {
    let customCartData: any = [];
    this.cartData.filter(cartItem => {
      customCartData.push(JSON.parse(JSON.stringify(cartItem)));
    });
    if (this.isNameNumber)
      customCartData = this.addQtyToAdditionalOptions(customCartData);
    customCartData = this.checkForDuplicateSelection(customCartData);
    return customCartData;
  }


  addQtyToAdditionalOptions(customCartData) {
    let qtyToBeAssigned, additionalOptions;
    customCartData.filter(cartItemObj => {
      qtyToBeAssigned = parseInt(cartItemObj.qty);
      if (cartItemObj.hasOwnProperty('additional_options')) {
        additionalOptions = cartItemObj.additional_options[0];
        additionalOptions = Object.assign(additionalOptions, { qty: qtyToBeAssigned });
        cartItemObj.additional_options[0] = additionalOptions;
      }
    });
    return customCartData;
  }

  /**
   * check for duplicate selected pairs and remove duplicate one and add it's qty to matching pair
   */
  checkForDuplicateSelection(customCartData) {
    let i, j, totalCartData = customCartData.length, tmp = [], removedItemQty: number;
    for (i = 0; i < totalCartData; i++) {
      removedItemQty = 0;
      for (j = 1; j < totalCartData; j++) {
        if (i === j) continue;
        if (this.isCommon(customCartData[i].super_attribute, customCartData[j].super_attribute)) {
          removedItemQty = parseInt(customCartData[j].qty);
          customCartData[i].qty = parseInt(customCartData[i].qty) + removedItemQty;
          if (customCartData[i].hasOwnProperty('additional_options')) {
            customCartData[i].additional_options = customCartData[i].additional_options.concat(customCartData[j].additional_options);
          }
          this.removeRow(j, customCartData);
          totalCartData--;
          j--;
        }
      }
    }
    // customCartData.filter(cartItem => {
    //   cartItem.additional_options = JSON.stringify(cartItem.additional_options);
    // });
    return customCartData;
  }

  /**
   * Check both objects for matching values
   * 
   * @param obj1 
   * @param obj2 
   */
  isCommon(obj1, obj2): boolean {
    obj1 = Object.values(obj1);
    obj2 = Object.values(obj2);
    let totalValues = obj1.length, matchCounter: number = 0, i = 0;
    for (i = 0; i < totalValues; i++) {
      if (obj1[i] == obj2[i]) matchCounter++;
    }
    return (matchCounter == totalValues) ? true : false;
  }

  /**
   * prevent user from entering invalid keys in qty input
   * 
   * @param event 
   */
  keyPress(event: any) {
    const pattern = /[0-9\+\-\ ]/;
    let inputChar = String.fromCharCode(event.charCode);
    if (event.keyCode != 8 && !pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  qtyUpdated(qtyVal: any, priceToBeCount: number = 0) {
    if (qtyVal <= 0) qtyVal = 1;
    let finalPrice = (priceToBeCount > 0) ? (priceToBeCount) : this.mainService.calcFinalPrice(qtyVal);
    this.cartTotalAmount = FormatCurrency(finalPrice, this.priceFormat, '');
    this.eventService.$pub('setPrice', finalPrice);
  }

  /**
   * get product price based on product id
   * if tier price is set, same will be return, product price will be returned otherwise
   * 
   * @param productId 
   * @param qty 
   */
  getProductPrice(productId, qty) {
    let keys, values, price: any = null;

    if (this.tierPrice && Object.keys(this.tierPrice).length > 0) {
      keys = Object.keys(this.tierPrice);
      values = Object.values(this.tierPrice);
      price = values[keys.indexOf(productId)];

      // if tier price found
      if (price && price.length > 0) {
        let found;
        price.filter(tierPriceObj => {
          if (parseInt(qty) >= parseInt(tierPriceObj.price_qty)) found = tierPriceObj;
        });
        price = ((found && found.price)) ? found.price : null;
      } else {
        price = null;
      }
    }

    // if tier price not found
    if (price == null) {
      keys = Object.keys(this.productPrice);
      values = Object.values(this.productPrice);
      price = values[keys.indexOf(productId)];
    }

    // remove tax from price
    if (this.priceService.tax > 0) {
      price = (parseInt(price) / (100 + parseInt(this.priceService.tax))) * 100;
    }
    return price;
  }
}
