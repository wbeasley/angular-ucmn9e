import { PubSubService } from 'angular7-pubsub';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CustomOptionsService } from './custom-options.service';

@Component({
  selector: '[custom-options]',
  templateUrl: './custom-options.component.html',
  styleUrls: ['./custom-options.component.scss']
})
export class CustomOptionsComponent implements OnInit {

  constructor(
    public cdr: ChangeDetectorRef,
    public customOptionsService: CustomOptionsService,
    public eventService: PubSubService
  ) { }

  /**
   * Angular lifecycle init function
   */
  ngOnInit() {
    this.customOptionsService.init();
    this.customOptionsService.prepareFormGroup();

    // if error occured, scroll to top
    this.eventService.$sub('validationError', () => {
      let elem: any = document.getElementsByClassName('byi-cart-custom');
      elem = (elem && elem[0]) ? elem[0] : null;
      if (elem)
        setTimeout(() => {
          elem.scrollIntoView({ behavior: "smooth" });
        }, 500);
    });
  }

  /**
   * When component is getting closd, reset data
   */
  ngOnDestroy() {
    this.customOptionsService.init();
  }

  /**
   * this function is triggered as soon as user selects any file
   * 
   * @param customOptionObj current option object
   * @param eve event
   */
  handleFileUpload(customOptionObj, eve) {

    // if event object does not contain file, return
    if (!eve || !eve.target || !eve.target.files || !eve.target.files[0]) return;

    // get file object from eve
    let file: File = eve.target.files[0];

    // check for file validation
    // here we are checking for file extensions
    // if any error occured, will return false, array of allowed exntesions otherwise
    let checkedValidationResponse = this.checkForImageValidation(customOptionObj, file);

    // if error occured, assign fileTypeError property to show error
    if (checkedValidationResponse == false) {
      customOptionObj = Object.assign(customOptionObj, { fileTypeError: true });
      return;
    }

    // if no errors found, assign allowedExtensions flag value to file object to send it in request param
    file = Object.assign(file, { allowedExtensions: checkedValidationResponse });

    // assign other important info
    file = Object.assign(file, {
      fileInfo: {
        optionId: customOptionObj.id,
        optiontitle: customOptionObj.title
      }
    });

    // push current file object to our fileList object(for final operation)
    this.customOptionsService.fileList.push(file);

    // if current object contains fileTypeError property, remove the same
    if (customOptionObj && customOptionObj.fileTypeError) delete customOptionObj.fileTypeError;

    // set price for the same
    this.customOptionsService.calcPrice();
  }

  /**
   * Check if current uploaded file has any errors
   * we are just checking for file extensions
   * 
   * @param customOptionObj 
   * @param file 
   */
  checkForImageValidation(customOptionObj, file: File): any {

    // determine file type by file's extension
    let fileType = (file && file.type) ? file.name.substr(file.name.lastIndexOf('.') + 1) : '',

      // prepare array of allowedExtensions string
      allowedExtensions = (customOptionObj && customOptionObj.file_extension) ? customOptionObj.file_extension.replace(/ /g, "").split(",") : [];

    // if file type is not found, return false(assuming invalid file)
    if (!fileType || fileType == '') return false;

    // check whether current file type is present in allowedExtensions,
    // if no, return false
    if (allowedExtensions &&
      allowedExtensions.length &&
      allowedExtensions.indexOf(fileType) < 0) return false;

    // else return allowedExtensions
    return allowedExtensions;
  }

  /**
   * as in case of multiple dropdown, form control failes to validate the same
   * so we need to validate it by our end
   * 
   * @param customOptionObj current custom option object
   * @param eve event
   */
  checkForDropdownValues(customOptionObj: any, eve) {

    // determine the value object
    let val = (eve && eve.target && eve.target.value) ? eve.target.value : [],

      // get control name
      controlName = this.customOptionsService.getControlName(customOptionObj);

    // find value in custom option object and store response in temp object
    let temp = customOptionObj.options_values.find(customOptionChildObj => customOptionChildObj.valueTitle == val);

    // if temp object is undefined, set error for the same
    if (!temp) this.cf[controlName].setErrors({ required: true });

    // set price for the same
    this.customOptionsService.calcPrice();
  }

  /**
   * This function is called when radio button/checkbox is selected
   * as in form control sometimes it does not detect values automatically, so we are doing it manually here
   * 
   * @param customOptionObj current custom option object
   * @param isChecked boolean value whether is checked or not
   * @param val value of selected checkbox/radio button
   */
  setSelectionBoxVal(customOptionObj, isChecked, val) {

    // store selected value to temp var
    let selectedVal = val;

    // determine the value, if isChecked is false we need to declare val as empty
    val = (isChecked === true) ? val : '';

    // get control name by current object
    let controlName = this.customOptionsService.getControlName(customOptionObj);

    // check if it's checkbox
    if (customOptionObj.type == 'checkbox') {
      let formControlValue = (this.cf[controlName].value) ? this.cf[controlName].value : [];
      if(formControlValue && formControlValue.indexOf(',') >= 0) {
        formControlValue = formControlValue.split(",");
      }
      let tmp = [].concat(formControlValue);
      if (isChecked && tmp.indexOf(val) == -1) tmp.push(val);
      else if (!isChecked) tmp.splice(tmp.indexOf(selectedVal), 1);
      val = [].concat(tmp);
    }

    // assign value to form control object
    // this.cf[controlName].setValue(val);
    this.cf[controlName].setValue([].concat(val));

    // set price for the same
    this.customOptionsService.calcPrice();
  }

  /**
    * this function will check for error for current object and will return true if found any
    * 
    * @param customOptionObj object of custom options
    */
  isError(customOptionObj): boolean {
    return customOptionObj.type != 'file' && this.customOptionsService.isSubmitted === true && this.cf[this.customOptionsService.getControlName(customOptionObj)].errors && this.cf[this.customOptionsService.getControlName(customOptionObj)].errors.required;
  }

  /**
   * checks radio buttons and checkboxes
   */
  isChecked(customOptionObj, val) {
    let formValue = this.cf[this.customOptionsService.getControlName(customOptionObj)].value;
    if (customOptionObj.type == 'radio') return formValue == val;
    else if (customOptionObj.type == 'checkbox') return formValue.indexOf(val) >= 0;
  }

  // instance to use for current form control
  get cf() { return this.customOptionsService.cf; }
}
