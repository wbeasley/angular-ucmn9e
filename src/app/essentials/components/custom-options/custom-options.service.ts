import { PriceService } from './../price/price.service';
import { ConfProductAttrService } from './../conf-product-attr/conf-product-attr.service';
import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PubSubService } from 'angular7-pubsub';

@Injectable({
  providedIn: 'root'
})
export class CustomOptionsService {

  // Declaration
  public fileList: any = [];
  public customOptionsData: any;

  // form group object
  public customOptionFormGroup: FormGroup;

  // object containing total types of custom options
  public typeCheckValues: any;

  // Flag that will display errors(if any)
  public isSubmitted: boolean;

  // selected custom options
  public selectedCustomOptions: any = {};

  // selected custom options total
  public selectedCustomOptionsTotal: number = 0;

  // in case of configurable product, we will keep total qty here for final calculations
  // for simple product, qty is already been assigned in price service
  public qtyToBeUsed: number = 1;

  /**
   * 
   */
  constructor(
    public eventService: PubSubService,
    public confProductService: ConfProductAttrService,
    public priceService: PriceService
  ) { }

  /**
    * Assign default values here
    */
  init() {
    this.isSubmitted = false;
    this.fileList = (this.fileList && this.fileList.length > 0) ? this.fileList : [];
    this.initTypeCheckObject();
  }

  /**
    * Initialize typecheck object
    */
  initTypeCheckObject() {
    if (this.typeCheckValues && this.typeCheckValues.length > 0) return;
    this.typeCheckValues = {
      input: ['field', 'date', 'date_time', 'time'],
      selectionBox: ['checkbox', 'radio'],
      dropDown: ['drop_down', 'multiple']
    };
  }

  /**
   * Prepare custom form group
   */
  prepareFormGroup() {
    if (this.customOptionFormGroup && this.customOptionFormGroup.controls) return;
    let group = {}, formControlName: string, isRequire;
    this.customOptionsData.filter(customOptionObj => {
      formControlName = this.getControlName(customOptionObj);
      isRequire = (customOptionObj.type == 'file') ? false : customOptionObj.isRequire;
      group[formControlName] = this.generateFormControl(isRequire, customOptionObj.type);
    });
    this.customOptionFormGroup = new FormGroup(group);
    (this.selectedCustomOptions) ? this.setSelectedCustomOptionsData() : this.checkForExistingOptions();
  }

  /**
   * 
   */
  setSelectedCustomOptionsData() {
    let selectedCustomOptions = this.selectedCustomOptions, objKeys = Object.keys(selectedCustomOptions),
      currentOptionObjVal, foundObj;
    objKeys.filter(key => {
      if (key != 'qty') {
        currentOptionObjVal = selectedCustomOptions[key];
        foundObj = this.customOptionsData.find(customOptionObj => customOptionObj.id == key);

        // if datetime, check if value is null, if so, skip
        if (foundObj.type == "date" || foundObj.type == "time" || foundObj.type == "date_time") {
          if (currentOptionObjVal.date_internal) delete currentOptionObjVal.date_internal;
          if (Object.values(currentOptionObjVal).indexOf(null) >= 0) currentOptionObjVal = false;
        }
        if (currentOptionObjVal != false)
          this.setSelectedCustomOptionValue(foundObj, currentOptionObjVal);
      }
    });
  }

  /**
  * Custom selected options
  */
  checkForExistingOptions() {
    let customOptionsData = <any>document.getElementsByClassName("options"),
      val, foundObj, super_attribute;

    // traverse through array
    for (let i = 0; i < customOptionsData.length; i++) {

      // fetch instance one by one
      super_attribute = customOptionsData[i];

      // check if value exists, return if not
      if (!super_attribute.value || super_attribute.value == '') continue;

      // search and return custom option object by id
      foundObj = this.customOptionsData.find(customOptionObj => customOptionObj.id == super_attribute.dataset.attrId);
      val = super_attribute.value;
      if (foundObj.type == 'date') {
        val = val.split(",");
        val = {
          day: val[1],
          month: val[0],
          year: val[2]
        };
      } else if (foundObj.type == "time") {
        val = val.split(",");
        val = {
          hour: val[0],
          minute: val[1],
          dayPart: val[2]
        };
      } else if (foundObj.type == "date_time") {
        val = val.split(",");
        val = {
          day: val[1],
          month: val[0],
          year: val[2],
          hour: val[3],
          minute: val[4],
          dayPart: val[5] || '',
        };
      }
      // 
      this.setSelectedCustomOptionValue(foundObj, val);
    }
  }

  /**
   * 
   * @param foundObj 
   * @param selectedVal 
   */
  setSelectedCustomOptionValue(foundObj, selectedVal) {
    let val, typeArrayObj = ['multiple', 'date', 'time', 'date_time'];

    // set value, if type is dropdown, value should be in array format, original otherwise
    val = (foundObj.type == 'drop_down') ? [].concat(selectedVal) : selectedVal;

    // convert comma separated values into array
    val = (val && val.constructor == String && val.indexOf(",") >= 0) ? val.split(",") : val;

    // if type is multiple and only one value is assigned, change it to array
    val = (foundObj.type == 'multiple' && Array.isArray(val) === false) ? [].concat(val) : val;

    // few types like datetime or multiple consist array of values
    // so before procceeding ahead we will check if it's not an empty array
    if (typeArrayObj.indexOf(foundObj.type) >= 0) {

      // if object type is multiple, fetch value title and set selected to respective element
      if (foundObj.type == 'multiple') {

        // declare variables
        let tmpVal = [], tmp, elem: any = [];

        // as our value will be an array,
        // traverse one by one
        val.filter(v => {

          // get obj having same id as val
          tmp = foundObj.options_values.find(optionValObj => optionValObj.optionTypeId == v);

          // if found, push it to elem array for further use
          // and save value title to local variable which will be then replace val object
          if (tmp) {
            elem.push(foundObj.id + '_' + tmp.optionTypeId);
            tmpVal.push(tmp.valueTitle);
          }
        });

        // replace tmp val object with val
        val = tmpVal;

        // as popup takes some time to load, we need to set it after 0.5 sec
        setTimeout(() => {
          elem.filter(ele => document.getElementById(ele).setAttribute('selected', 'true'));
        }, 500);
      }

      // if type is date
      else if (foundObj.type == "date") {
        let yyyy, MM, dd;
        yyyy = val.year;
        MM = val.month;
        MM = (MM < 10) ? "0" + MM : MM;
        dd = val.day;
        dd = (dd < 10) ? "0" + dd : dd;
        val = yyyy + "-" + MM + "-" + dd;
      }

      // if type is time
      else if (foundObj.type == "time") {
        let hr: any = parseInt(val.hour), min: any = parseInt(val.minute);
        hr = (hr < 10) ? "0" + hr : hr;
        hr = (hr == 12 && val.dayPart == 'am') ? "00" : hr;
        min = (min < 10) ? "0" + min : min;
        val = hr + ":" + min;
      }

      // if type is dateTime
      else if (foundObj.type == "date_time") {
        let yyyy, MM, dd;
        yyyy = val.year;
        MM = val.month;
        MM = (MM < 10) ? "0" + MM : MM;
        dd = val.day;
        dd = (dd < 10) ? "0" + dd : dd;
        let date = yyyy + "-" + MM + "-" + dd + "T",
          hr: any = parseInt(val.hour), min: any = parseInt(val.minute);
        hr = (hr < 10) ? "0" + hr : hr;
        hr = (hr == 12 && val.dayPart == 'am') ? "00" : hr;
        min = (min < 10) ? "0" + min : min;
        val = date + hr + ":" + min;
      }
    }

    // finally assign these values to each form controller object
    this.cf[this.getControlName(foundObj)].setValue(val);
    this.calculateCustomOptionPrice(foundObj, val);
    if (foundObj.type == 'checkbox') {
      val = val.join(',');
      this.cf[this.getControlName(foundObj)].setValue(val);
    }
  }

  /**
   * parepre/get controller name based on object
   * we are using title and id of the object to prepare control name
   *  
   * @param customOptionObj object of custom form
   */
  getControlName(customOptionObj) {
    let formControlName = (customOptionObj.title + '_' + customOptionObj.id).split(" ").join("_");
    return formControlName;
  }

  /**
  * This function will generate and return form control object
  * 
  * @param isRequired flag value that indicates whether or not required validation is required to add or not
  */
  generateFormControl(isRequired: boolean, customOptionObjType) {
    let validationRule: any = (isRequired == true) ? Validators.required : '',
      formControlDefaultVal: any = '';
    if (customOptionObjType == 'multiple' || customOptionObjType == 'checkbox') formControlDefaultVal = [];
    return new FormControl(formControlDefaultVal, validationRule);
  }

  /**
   * 
   */
  validateCustomOptionsData() {
    let self = this,
      eventResponse: any = {
        isInvalid: self.isCustomFormHasErrors(),
        files: this.fileList
      };
    if (self.isCustomFormHasErrors() == false) eventResponse = Object.assign(eventResponse, {
      customOptions: this.prepareCustomOptions()
    });
    return eventResponse;
  }

  /**
  * this function performs following actions:
  * i. set isSubmitted flag to true(to display error messages)
  * ii. check for uploaded file errors
  */
  isCustomFormHasErrors() {

    // IF ON LOAD CHECK IS DONE
    if (!this.customOptionFormGroup) return true;

    // set submit flag to true that will show errors
    this.isSubmitted = true;

    // here we will check if uploaded file has any errors    
    let uploadedFileError: boolean = this.getUploadedFileError();

    // store error flag to local variable
    let isError: boolean = (this.customOptionFormGroup && this.customOptionFormGroup.invalid) || uploadedFileError;

    // if error occured, publish an event for the same
    if (isError)
      this.eventService.$pub('validationError');

    // finally return boolean value(true if error found)
    return isError;
  }


  /**
   * check for uploaded file errors
   * if any file upload dom element has errors, we have assigned fileTypeError object to custom option object variable
   */
  getUploadedFileError(): boolean {

    // variable declaration
    let totalData = this.customOptionsData.length, foundError: boolean = false, i;

    // traverse through all custom options variable
    for (i = 0; i < totalData && foundError == false; i++) {

      // if obj type is not file, skip
      if (this.customOptionsData[i].type != 'file') continue;

      // check if object has fileTypeError property set, change flag value and break the loop
      if (this.customOptionsData[i] && this.customOptionsData[i].fileTypeError) {
        foundError = true;
        break;
      }
    }

    // return true if errors found 
    return foundError;
  }

  /**
    * Prepare custom options payload
    */
  prepareCustomOptions() {

    // set default values
    this.selectedCustomOptions = 0;
    this.selectedCustomOptionsTotal = 0;
    let formControlObj: any, customOptionsData = {}, val, tmp, dateArr = ["date", "date_time", "time"];

    // traversal
    this.customOptionsData.filter(customOptionsObj => {

      // as we are not checking file
      if (customOptionsObj.type != 'file') {

        // 
        formControlObj = Object.assign(this.cf[this.getControlName(customOptionsObj)]);

        // when the input type is text or date
        val = formControlObj.value;

        if (val != "" || dateArr.indexOf(customOptionsObj.type) >= 0) {

          // when element is select
          if (customOptionsObj.type == 'multiple') {
            tmp = [];
            val.filter(v => {
              let tt = customOptionsObj.options_values.find(customOptionsObj => customOptionsObj.valueTitle == v);
              if (tt) tmp.push(tt.optionTypeId);
            });
            val = tmp;
          }

          // when element if date
          if (customOptionsObj.type == 'date') {
            let date = new Date(val);
            val = {
              month: (date && date.getMonth()) ? date.getMonth() + 1 : null,
              day: (date && date.getDate()) ? date.getDate() : null,
              year: (date && date.getFullYear()) ? date.getFullYear() : null
            }
          }

          // when element is dateTime
          if (customOptionsObj.type == 'date_time') {
            let date: Date = this.parseDateString(val),
              hour = (date && date.getHours()) ? date.getHours() : null, dayPart = 'am';
            if (hour != null && hour >= 12) {
              hour -= 12;
              dayPart = 'pm';
            };
            val = {
              month: (date && date.getMonth()) ? date.getMonth() + 1 : null,
              day: (date && date.getDate()) ? date.getDate() : null,
              year: (date && date.getFullYear()) ? date.getFullYear() : null,
              hour: hour,
              minute: (date && date.getMinutes()) ? date.getMinutes() : null,
              day_part: dayPart
            }
          }

          // when element is time
          if (customOptionsObj.type == 'time') {
            if (!val) {
              val = {
                hour: null,
                minute: null,
                day_part: null
              }
            } else {
              let time = (val && val.indexOf(":") > 0) ? val.split(":") : val, hour = (time && time[0]) ? time[0] : null, min = (time && time[1]) ? time[1] : null,
                dayPart = 'am';
              dayPart = (hour >= 12) ? 'pm' : 'am';
              hour = (hour > 12) ? hour - 12 : hour;
              val = {
                hour: hour,
                minute: min,
                day_part: dayPart
              };
            }
          }

          // store value to custom options data object
          if (val) {
            if (dateArr.indexOf(customOptionsObj.type) >= 0) {
              let values, found;
              values = Object.values(val);
              found = values.indexOf(null);
              if (found == -1) {
                this.calculateCustomOptionPrice(customOptionsObj, val);
              }
            } else {
              this.calculateCustomOptionPrice(customOptionsObj, val);
            }
            customOptionsData[customOptionsObj.id] = val;
          }
        }
      }
    });
    return customOptionsData;
  }

  /**
   * 
   * @param customOptionObj 
   * @param selectedVal 
   */
  calculateCustomOptionPrice(customOptionObj, selectedVal) {
    let price: any;
    if (customOptionObj && customOptionObj.origprice) {
      price = customOptionObj.origprice;
      this.selectedCustomOptionsTotal += price;
    } else if (customOptionObj && customOptionObj.options_values) {
      let tmp: any;
      if (Array.isArray(selectedVal)) {
        selectedVal.filter(val => {
          tmp = customOptionObj.options_values.find(optionValObj => optionValObj.optionTypeId == val);
          if (tmp && tmp.origprice) {
            price = tmp.origprice;
            this.selectedCustomOptionsTotal += price;
          }
        });
      } else {
        tmp = customOptionObj.options_values.find(optionValObj => optionValObj.optionTypeId == selectedVal);
        if (tmp && tmp.origprice) {
          price = tmp.origprice;
          this.selectedCustomOptionsTotal += price;
        }
      }
    }
  }

  /**
   * 
   * @param date 
   */
  private parseDateString(date: string): Date {
    if (date.indexOf('T') < 0) return null;
    date = date.replace('T', '-');
    var parts: any = date.split('-');
    var timeParts = parts[3].split(':');

    // new Date(year, month [, day [, hours[, minutes[, seconds[, ms]]]]])
    return new Date(parts[0], parts[1] - 1, parts[2], timeParts[0], timeParts[1]);     // Note: months are 0-based
  }


  /**
   * as backend does'nt provide exact input type field, we need to manupulate the type
   * this function checks the type and return the input type for the same
   * 
   * @param customOptionObjType custom options object
   */
  getInputType(customOptionObjType) {
    return (customOptionObjType == 'field') ? 'text' : ((customOptionObjType == 'date_time') ? 'datetime-local' : customOptionObjType);
  }

  /**
   * this function is helpful to decide what dom element to use(eg. input, select)
   * 
   * @param customOptionObjType current object type(field, drop_down, date_time etc)
   * @param typeCheckVal typecheck val category(input, dropDown, selectionBox)
   */
  typeCheck(customOptionObjType, typeCheckVal) {
    return (this.typeCheckValues[typeCheckVal] && this.typeCheckValues[typeCheckVal].indexOf(customOptionObjType) >= 0);
  }

  // instance to use for current form control
  get cf() { return this.customOptionFormGroup.controls; }

  /**
   * set customOptionsData
   * 
   * @param customOptionsData customOptionsData
   */
  setCustomOptionsData(customOptionsDataResp) {
    this.customOptionsData = customOptionsDataResp.custom_options;
    this.selectedCustomOptions = (customOptionsDataResp.selectedCustomOptions) ? Object.assign({}, customOptionsDataResp.selectedCustomOptions) : false;
  }

  /**
   * here we will calculate custom options price each time user makes changes to custom options elements
   * finally we will call qtyUpdated function that will calculate final price by adding custom options price
   */
  calcPrice() {
    this.prepareCustomOptions();
    this.priceService.extraPriceToBeAdded.customOptionsPrice = this.selectedCustomOptionsTotal;
    this.priceService.addThisPrice();
    this.eventService.$pub('priceUpdate');
  }
}
