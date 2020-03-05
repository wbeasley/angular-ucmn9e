import { PriceService } from './../price/price.service';
import { CustomOptionsService } from './../custom-options/custom-options.service';
import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { PubSubService } from 'angular7-pubsub';
import { ConfProductAttrService } from './conf-product-attr.service';

@Component({
  selector: '[conf-product-attr]',
  templateUrl: './conf-product-attr.component.html',
  styleUrls: ['./conf-product-attr.component.scss']
})
export class ConfProductAttrComponent implements OnInit {

  // Variable Declaration
  @Input('confProductOptionsObject') confProductOptionsObject;
  public confAttrs;
  public hasSwatch: boolean;

  // this will indicate how many rows to add initially
  public numberOfTimes: number = 0;

  /**
   * Dependancy Injection
   */
  constructor(
    public confProductService: ConfProductAttrService,
    public eventService: PubSubService,
    public cdr: ChangeDetectorRef,
    public customOptionService: CustomOptionsService,
    public priceService: PriceService
  ) {
    this.eventService.$sub('productChanged', () => {
      this.eventService.$pub('resetCart');
    });
  }

  /**
   * Angular Init Function
   */
  ngOnInit() {
    this.subscribeEvents();
    this.reset();
  }

  /**
   * Assign Default Values
   */
  reset() {
    this.confProductService.totalRows = (this.confProductService.totalRows && this.confProductService.totalRows.length > 0 && this.confProductService.resetMe == false) ? this.confProductService.totalRows : [];
    this.confProductService.cartData = (this.confProductService.cartData && this.confProductService.cartData.length > 0) ? this.confProductService.cartData : [];
    this.confProductService.selectedOptionString = (this.confProductService.selectedOptionString && this.confProductService.selectedOptionString.length > 0) ? this.confProductService.selectedOptionString : [];
  }

  /**
   * Subscribe Events
   */
  subscribeEvents() {
    this.eventService.$sub('qtyUpdated', () => {
      this.qtyUpdated();
    });
  }

  /**
   * Access @Input Values here
  */
  ngAfterViewInit() {
    this.init();
    if (this.confProductService.totalRows.length == 0 && !this.confProductService.isNameNumber) this.addRow();
  }

  /**
   * 
   */
  init() {
    // if no prod options is not found in response object, return
    if (!this.confProductOptionsObject || !this.confProductOptionsObject.productOptions || !this.confProductOptionsObject.productsCombination) return;

    // else set data
    this.confAttrs = Object.assign([], this.confProductOptionsObject.productOptions);
    this.hasSwatch = (this.confAttrs.indexOf(this.confAttrs.find(confAttrObj => confAttrObj.hasSwatch === 0)) >= 0) ? false : true;
    this.confProductService.productsCombination = Object.assign({}, this.confProductOptionsObject.productsCombination);

    // 
    if (this.confProductService.totalRows && this.confProductService.totalRows.length <= 0 && (this.confProductService.resetMe == true || this.confProductService.resetMe == null)) {
      this.confProductService.resetMe = false;
    }

    // in case of name number 
    if (this.confProductService.isNameNumber) {

      // check if any new row is added in name number
      let totalNameNumbers = this.confProductService.nameNumberData.newRow.length,
        totalCartItems = this.confProductService.cartData.length;

      // if not added, create newly added name/number rows in cart
      if (totalNameNumbers != totalCartItems) {

        // find the difference
        this.numberOfTimes = totalNameNumbers - totalCartItems;

        // add name number one by one
        for (let i = 0; i < this.numberOfTimes; i++) {
          this.addRow();
        }
      }
    }
    // this.customOptionService.calcPrice();
  }

  /**
   * Add new row on init/each time user clicks on add row button
   */
  addRow() {
    if (this.confProductService.cartData && this.confProductService.isConfDataInvalid()) return;
    let rowIndex = this.confProductService.totalRows.length;
    this.confProductService.totalRows.push(1);
    this.confProductService.selectedOptionString[rowIndex] = {};
    this.confProductService.initCartObject(rowIndex, this.confAttrs);
    this.initSelectionValues(rowIndex);
    this.qtyUpdated();
  }

  /**
   * this variables will keep track of selected attribute values
   */
  initSelectionValues(index) {
    this.confProductService.selectedOptionString[index] = Object.values(this.confProductService.fixDefaultSelectedOptions).join("_");
  }

  /**
   * remove specified row
   * 
   * @param rowIndex row number
   */
  removeRow(rowIndex) {

    // then remove that row from html
    this.confProductService.totalRows.splice(rowIndex, 1);

    // remove cart data first
    this.confProductService.removeRow(rowIndex);

    // 
    this.confProductService.selectedOptionString.splice(rowIndex, 1);

    this.qtyUpdated();
  }

  /**
   * to save complexity in html, we will be preparing cart object from service and return the same
   * 
   * @param rowIndex current row index 
   * @param id conf attr id
   */
  getCartObj(rowIndex, id) {

    return this.confProductService.cartData[rowIndex].super_attribute[id];
  }

  /**
   * When user changes attribute selection, we will call this function and will update selectionsoptions object
   * 
   * @param value value_index of selected attribute
   * @param attId attribute id(eg. id of color, size)
   * @param rowIndex current row number
   */
  setSelectedOptions(value, attId, rowIndex, attrIndex) {

    // if swatch is enabled, we need to manually add selected data to our cart object
    if (this.hasSwatch) {
      this.confProductService.cartData[rowIndex].super_attribute[attId] = value;
    }

    // we will created fresh new array of selected options    
    let selectedOptions: any = this.confProductService.selectedOptionString[rowIndex].split("_");
    selectedOptions[attrIndex] = value;
    this.confProductService.selectedOptionString[rowIndex] = Object.values(selectedOptions).join("_");

    // check for duplicate selection
    // if (this.confProductService.totalRows.length > 1) this.checkForDuplicateSelection();

    // this object will keep the track of current selected super attributes 
    // in array format
    // this is been used for fetching product id based on current selected super attributes
    this.confProductService.allDefaultSelectedAttrs[rowIndex][attrIndex] = value;

    // fetch and set product id for current selected super attributes
    if (this.confProductService.cartData[rowIndex] && this.confProductService.cartData[rowIndex].productId) {

      // fetch new product id, and store old product id into local variable
      let productId = this.confProductService.getProductId(rowIndex),
        oldProductId = this.confProductService.cartData[rowIndex].productId;

      // if old and new id's don't match
      // update new product id in cart and recalculate price
      if (oldProductId != productId) {
        this.confProductService.cartData[rowIndex].productId = productId;
        this.qtyUpdated();
      }
    }
  }

  /**
   * as per html default behavior, even if ngModel has different value, html by default takes previous dropdown value
   * so we manually need to reselect values after removing duplicate dropdown section
   * 
   * @param rowIndex index been removed
   */
  setSelection(rowIndex) {
    if (!this.confProductService || !this.confProductService.cartData || !this.confProductService.cartData[rowIndex] || !this.confProductService.cartData[rowIndex].super_attribute) return;
    let keys = Object.keys(this.confAttrs), totalAttr = keys.length, i, dropDownIdLabel, domElement, selectedVal, superAttrObj = this.confProductService.cartData[rowIndex].super_attribute;

    for (i = 0; i < totalAttr; i++) {
      dropDownIdLabel = 'dropdown_' + rowIndex + '_' + this.confAttrs[i].id;
      domElement = document.getElementById(dropDownIdLabel);
      selectedVal = superAttrObj[this.confAttrs[i].id];
      domElement.selectedIndex = this.confAttrs[i].values.find(optionValueObj => optionValueObj.value_index == selectedVal);
    }

  }

  /**
   * this function is called each time for assigning disable class/attribute to respective dom element
   * 
   * @param currentValue current value index
   * @param rowIndex row index
   * @param optionIndex option index
   */
  disableMe(currentValue, rowIndex, optionIndex) {
    if (!this.confProductService.selectedOptionString || !this.confProductService.selectedOptionString[rowIndex] || Object.keys(this.confProductService.selectedOptionString[rowIndex]).length == 0) return false;
    // get current row selected attributes
    let selectedOptions = this.confProductService.selectedOptionString[rowIndex].split("_");

    // set current specifed value index to our confProductService.selectedOptionString array
    selectedOptions[optionIndex] = currentValue;

    // rejoin the same by '_'
    let currentOption = selectedOptions.join("_");

    // returns true if current specifed pair does not exist in product combination object
    let combination = Object.values(this.confProductService.productsCombination);
    if (combination.indexOf(currentOption) == -1) {
      return true;
    }

    // false if combination found
    return false;
  }

  /**
   * for configurable product we need to pass total number of qty
   */
  qtyUpdated(qty: any = null) {

    // if qty is invalid of 0, return
    if (qty != null && qty < 1) return;

    // variable delcaration
    let finalPrice: number = 0, foundPrice;

    // traverse through cart array
    this.confProductService.cartData.filter(cartItem => {

      // get product price by product id
      // here we are passign qty as well in case of tier price
      foundPrice = this.confProductService.getProductPrice(cartItem.productId, cartItem.qty);

      // calculate final price by multiplying it with qty
      finalPrice += (foundPrice * parseInt(cartItem.qty));
    });

    // set total qty
    this.priceService.totalQty = this.getTotalQty();

    // in case of configurable product
    // if qty is 1, set latest price as default price
    if (this.priceService.totalQty == 1) {
      this.priceService.defaultPrice = finalPrice;
    }

    // in case of configurable,
    // when user clicks on add more button, all the selected product's prices
    // are added in different variable
    if (finalPrice >= this.priceService.defaultPrice) {
      this.priceService.extraPriceToBeAdded.productPrice = finalPrice - this.priceService.defaultPrice;
    }

    // finally go for calculation
    this.priceService.addThisPrice();

    // publish event that price has been updated
    this.eventService.$pub('priceUpdate');
  }

  /**
   * calculate total price
   */
  getTotalQty() {

    // variable declaration
    let qty: any = 0;

    // calculate qty
    this.confProductService.cartData.filter(cartObj => {
      qty += parseInt(cartObj.qty);
    });

    qty = (qty <= 0) ? 1 : qty;
    // return qty
    return parseInt(qty);
  }

  /**
   * Replace '_' with white space in label and
   * also make uppercase to each first character of the same
   * 
   * @param label 
   */
  filterLabel(label) {
    // replace underscore with white space
    label = label.replace("_", " ");

    // uppercase each first character of string
    label = label.toLowerCase().replace(/\b[a-z]/g, function (letter) {
      return letter.toUpperCase();
    });

    // return final o/p
    return label;
  }
}
