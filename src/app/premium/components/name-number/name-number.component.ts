import { ConfProductAttrService } from 'src/app/essentials/components/conf-product-attr/conf-product-attr.service';
import { PriceService } from 'src/app/essentials/components/price/price.service';
import { Component, OnInit, ViewChild, Input, ChangeDetectorRef } from '@angular/core';
import { MainService } from 'src/app/services/main.service';
import { PubSubService } from 'angular7-pubsub';
import { LoaderComponent } from 'src/app/essentials/components/loader/loader.component';
import { CanvasService } from 'src/app/services/canvas.service';
import { FontService } from 'src/app/essentials/components/font/font.service';
import { NameNumberService } from './name-number.service';
import { DesignService } from 'src/app/services/design.service';
import { TabsService } from 'src/app/services/tabs.service';
declare var fabric: any;

@Component({
  selector: '[name-number]',
  templateUrl: './name-number.component.html',
  styleUrls: ['./name-number.component.scss']
})
export class NameNumberComponent implements OnInit {

  // Variable Declaration  
  public subTabsData: any;
  public getCurrentTabName: any;
  public currentTab: any = 6;
  public accordianId: any = 0;
  public imageSideTitle: any = [];
  public nameText: any = 'Example';
  public numberText: any = '00';
  public isFocus: boolean = false;
  public dimensionData: any = [];
  public selectedImageSide: any;
  public canvasKey: any;
  public defaultColor: any;
  public defaultFontFamily: any;
  public defaultFontSize: any;
  public nameProperties: any = [];
  public numberProperties: any = [];
  public orderId: any;
  public name: any;
  public number: any;
  public nameNumberIndex: any;
  // store canvas of respective object  
  public propertiesToCopy: any = [];
  showAllNameNumber: boolean = false;

  // Additional Inputs
  @Input() loadContent;
  @ViewChild("loaderComponent") loaderComponent: LoaderComponent;
  @ViewChild("subtabLoader") subtabLoader: LoaderComponent;

  // removed object stack
  public removedObjects: any = [];

  /**
   * Dependancy Injector
   * 
   * @param mainService 
   * @param eventService 
   * @param cdr 
   * @param canvasService 
   * @param fontService 
   */
  constructor(
    public mainService: MainService,
    private eventService: PubSubService,
    public cdr: ChangeDetectorRef,
    private canvasService: CanvasService,
    public fontService: FontService,
    public nameNumberService: NameNumberService,
    public priceService: PriceService,
    public designService: DesignService,
    public confProductService: ConfProductAttrService,
    private tabsService: TabsService
  ) {
    this.eventService.$sub('getSubTabs', (mainTabId) => {
      if (mainTabId == this.currentTab && !this.subTabsData) {
        this.getSubTabs(mainTabId);
      }
      this.getCurrentTabName = this.mainService.getAllTabs[this.currentTab]['label'];
    });
  }

  /**
   * Angular Init Function
   */
  ngOnInit() {
    if (this.canvasService.objProperties.indexOf('addObj') == -1) this.canvasService.objProperties.push("addObj");
    if (this.canvasService.objProperties.indexOf('nameNumberId') == -1) this.canvasService.objProperties.push("nameNumberId");

    this.getImageTitle();
    this.getColors();
    this.preparePropertiesToCopy();
    this.defaultFontFamily = this.fontService.defaultFontFamily;
    this.defaultFontSize = this.fontService.defaultFontSize;
    this.nameProperties = {};
    this.numberProperties = {};
    this.subscribeEvents();
  }
  ngAfterViewInit() {
    if (this.loadContent == 'adminNameNumber' && !this.mainService.isGenerateSVGDesign) {
      this.eventService.$sub('designLoaded', (data) => {
        let params = this.mainService.getUrlParams(['id', 'design', 'name', 'number', 'order', 'index']);
        this.orderId = params['order'];
        this.nameNumberIndex = params['index'];
        let name = '';
        let number = '';
        if (params['name']) {
          name = atob(params['name']);
        }
        if (params['number']) {
          number = atob(params['number']);
        }
        this.name = name;
        this.number = number;
        for (let key of Object.keys(this.canvasService.containerCanvases)) {
          let canvas = this.canvasService.containerCanvases[key];
          let obj, canvasObjects = this.canvasService.getObjects(canvas);
          for (obj of canvasObjects) {
            if (obj.addObj == 'name') {
              obj.text = name;
            }
            if (obj.addObj == 'number') {
              obj.text = number;
            }
            let properties = { selectable: false };
            this.canvasService.deselectAllObjects();
            if (obj) {
              let params = {
                obj: obj,
                properties: properties,
                crudServiceString: 'this.updateObjectService',
                canvas: canvas
              };
              this.canvasService.objectCRUD(params);
            }
          }
        }
        let designArea = document.getElementsByClassName('design-container');
        for (let i = 0; i < designArea.length; i++) {
          designArea[i].children[1].innerHTML = '<style></style>';
        }
      });
    }
    // initially each name number will be set in current canvas only
    // so we will be setting current canvas flag to name number canvas 
    if (this.canvasService.currentCanvas && this.mainService.designId) {
      this.nameNumberService.nameNumberCanvas.name = this.canvasService.currentCanvas;
      this.nameNumberService.nameNumberCanvas.number = this.canvasService.currentCanvas;
    }
  }
  ngAfterViewChecked() {
    let self = this;
    if (self.mainService.nameNumber) {
      let designArea = document.getElementsByClassName('design-container');
      for (let i = 0; i < designArea.length; i++) {
        designArea[i].children[1].innerHTML = '<style></style>';
      }
    }
  }

  /**
   * Get Sub Tabs
   * @param mainTabId 
   */
  async getSubTabs(mainTabId) {
    let data = this.mainService.tabsFlow[mainTabId];
    this.subTabsData = this.mainService.setSubTabsData(data, mainTabId);
    if (this.subTabsData && this.subTabsData.length > 0) {
      this.accordianId = this.subTabsData[0].id;
    }
    if (this.loaderComponent && this.loaderComponent.showSubLoader) this.loaderComponent.showSubLoader = false;
  }

  preparePropertiesToCopy() {
    this.propertiesToCopy = ['addObj', 'tab', 'top', 'left', 'fill', 'fontFamily', 'fontSize', 'fontStyle', 'underline', 'fontWeight', 'textAlign', 'opacity', 'shadow', 'skewX', 'skewY', 'stroke', 'strokeWidth', 'originX', 'originY'];
  }

  /**
   * Set Default Color
   */
  getColors() {
    if (!this.defaultColor) {
      this.defaultColor = this.mainService.colorData.defaultColor;
    }
    this.eventService.$sub('getColors').subscribe(colorData => {
      this.defaultColor = colorData.defaultColor;
    }, err => console.log(err));
  }

  /**
   * Prepare data object after product is been loaded successfully
   * then pass the same to prepare image title object
   */
  getImageTitle() {
    let data = this.mainService.loadedProductData;
    if (data && Object.keys(data).length) {
      this.setImageTitle(data);
    }
  }

  /**
   * 
   */
  subscribeEvents() {

    // when object is removed
    // check if it was last object of respective type
    // if it was, uncheck the same    
    this.eventService.$sub('objectRemoved', (obj) => {
      // obj = (Array.isArray(obj)) ? obj[0] : obj;
      if (typeof obj == "object" && obj.hasOwnProperty('addObj')) {
        this.checkNameNumberAfterRemove(obj);
      } else if (Array.isArray(obj)) {
        obj.filter(o => {
          if (o.hasOwnProperty('addObj')) {
            this.checkNameNumberAfterRemove(o);
          }
        });
      }
    });

    // when name number object is update
    // store new properties in global variable
    this.eventService.$sub('objectUpdated', (obj) => {
      obj = (Array.isArray(obj)) ? obj[0] : obj;
      this.setLeftTop(obj);
    });

    // when name/number object is added
    // open name number tab
    this.eventService.$sub('objectAdded', (obj) => {
      if (obj.tab == 'namenumber' && this.loadContent) {
        this.checkForValues(obj);
        this.eventService.$pub('getActiveTabId', this.currentTab);
      }
    });

    // when name/number object is selected
    // open name number tab
    this.eventService.$sub('objectSelectionCreated', (obj) => {
      if (obj.tab == 'namenumber') {
        this.eventService.$pub('getActiveTabId', this.currentTab);
      }
    });

    // when name/number object is selected
    // open name number tab
    this.eventService.$sub('objectSelectionUpdated', (obj) => {
      if (obj.tab == 'namenumber') {
        this.eventService.$pub('getActiveTabId', this.currentTab);
      }
    });

    // when name number will be first tab
    // we won't be getting image title from mainService
    // so we need to subscribe load product to set image title
    this.eventService.$sub('allcanvasCreated', (data) => {
      this.getImageTitle();
    });

    // when user changes the product from product options
    // we will assign new canvases to respective name/number canvas object
    this.eventService.$sub('canvasCreated', (newCanvas) => {
      if (this.nameNumberService.addName) {
        let newCanvasObjs = newCanvas.getObjects(),
          isNameExists = newCanvasObjs.indexOf(newCanvasObjs.find(currObj => (currObj.hasOwnProperty('addObj') && currObj.addObj == 'name')));
        if (isNameExists >= 0)
          this.nameNumberService.nameNumberCanvas.name = newCanvas;
      }
      if (this.nameNumberService.addNumber) {
        let newCanvasObjs = newCanvas.getObjects(),
          isNumberExists = newCanvasObjs.indexOf(newCanvasObjs.find(currObj => (currObj.hasOwnProperty('addObj') && currObj.addObj == 'number')));
        if (isNumberExists >= 0)
          this.nameNumberService.nameNumberCanvas.number = newCanvas;
      }
    });
    // 
    if (this.loadContent) {
      this.eventService.$sub('designLoaded', (designData) => {
        let nameNumberData = JSON.parse(designData.name_number_details);
        if (nameNumberData) {
          this.nameNumberService.loadNameNumber(nameNumberData);
        }
      });

      this.eventService.$sub('saveDesignBefore', () => {
        let data = {
          nameNumber: this.nameNumberService.newRow
        };
        this.designService.additionalOptions = Object.assign({}, data);
      });

      // this.eventService.$sub('undoComplete', (obj) => {
      //   this.checkForValues(obj);
      // });
    }
  }

  /**
   * After user changes top/left of name/number
   * we will be updating the same in our name/number global properties variable
   * 
   * @param obj 
   */
  setLeftTop(obj) {
    if (obj.hasOwnProperty('addObj')) {

      // set name properties
      if (obj.addObj == 'name') {
        this.nameProperties = {};
        this.propertiesToCopy.filter(propertyType => {
          if (obj.hasOwnProperty(propertyType) && obj[propertyType]) {
            this.nameProperties[propertyType] = obj[propertyType];
          }
        });
      }

      // set number properties
      else if (obj.addObj == 'number') {
        this.numberProperties = {};
        this.propertiesToCopy.filter(propertyType => {
          if (obj.hasOwnProperty(propertyType) && obj[propertyType]) {
            this.numberProperties[propertyType] = obj[propertyType];
          }
        });
      }
    }
  }

  /**
   * 
   * @param obj 
   */
  checkForValues(obj) {

    // variable declarations
    let isObjExists, type = obj.addObj;

    // check if name number row already exists
    // during undo/redo, if name/number was already been added to object
    // we will just update text of specified object
    isObjExists = this.nameNumberService.newRow.find(newRowObj => newRowObj.id == obj.nameNumberId)

    // if obj is of type name, check Add names
    if (obj.addObj == 'name') {
      this.nameNumberService.addName = true;
    }

    // if obj is of type number, check Add Numbers
    else if (obj.addObj == 'number') {
      this.nameNumberService.addNumber = true;
    }

    // if object is not already present,
    // add new row first
    if (!isObjExists) {
      this.addRow(type, null, null, false);

      // replace isObjExists with latest row
      isObjExists = this.nameNumberService.newRow[this.nameNumberService.newRow.length - 1];
    }

    // find index of existing object
    let index = this.nameNumberService.newRow.indexOf(isObjExists);

    // replce text
    isObjExists[type] = obj.text;

    // finally replace that row
    this.nameNumberService.newRow[index] = isObjExists;

    // set properties
    this.setLeftTop(obj);
  }

  /**
   * 
   * @param data 
   */
  setImageTitle(data) {
    this.dimensionData = Object.assign({}, data);
    this.imageSideTitle = [];
    for (let key of data['dimensions']) {
      this.imageSideTitle.push({ imageTitle: key['image_title'], imageId: key['image_id'] });
      if (!this.mainService.designId) {

        if (this.nameNumberService.selectedNameTitle && this.nameNumberService.selectedNameTitle.hasOwnProperty('imageTitle') && this.nameNumberService.selectedNameTitle.imageTitle == key['image_title']) {
          this.nameNumberService.selectedNameTitle = { imageTitle: key['image_title'], imageId: key['image_id'] };
        }
        if (this.nameNumberService.selectedNumberTitle && this.nameNumberService.selectedNumberTitle.hasOwnProperty('imageTitle') && this.nameNumberService.selectedNumberTitle.imageTitle == key['image_title']) {
          this.nameNumberService.selectedNumberTitle = { imageTitle: key['image_title'], imageId: key['image_id'] };
        }
      }
    }
    if (!this.mainService.designId) {
      if (!this.nameNumberService.selectedNameTitle || Object.keys(this.nameNumberService.selectedNameTitle).length == 0) {
        this.nameNumberService.selectedNameTitle = this.imageSideTitle[0];
      }
      if (!this.nameNumberService.selectedNumberTitle || Object.keys(this.nameNumberService.selectedNumberTitle).length == 0) {
        this.nameNumberService.selectedNumberTitle = this.imageSideTitle[0];
      }
    }
  }

  /**
   * When user changes side for add names from dropdown
   * 
   * @param title 
   */
  changeNameSideTitle(title) {

    // if selected and current image side is same
    // return
    if (this.nameNumberService.selectedNameTitle == title) return;

    // if not, set selected image side to current side
    this.nameNumberService.selectedNameTitle = title;

    // if name is checked
    if (this.nameNumberService.addName) {

      // as we need to remove name from current canvas
      // we will store last row to local variable
      // this row will be fetch & stored in newRow variable
      // this is neccessary because when only one row is present
      // by default it will deselect name number after remove process

      // get current last index
      let lastIndex = this.nameNumberService.newRow.length - 1;

      // get last row
      let lastRow = this.nameNumberService.newRow.slice(lastIndex);
      lastRow = lastRow[0];

      // remove name object from current canvas
      this.removeObjOnChangeSide('name');

      // immediately render the same in html
      this.cdr.detectChanges();

      // in case of single row
      // when row is removed by default name will be unchecked as per our flow
      // we manually need to check the same and add previous data to newRow object
      if (!this.nameNumberService.addName) {

        // check Add Names Checkbox
        this.nameNumberService.addName = true;

        // we have already created function which will be handling insertion of 
        // new row in variable as well as in canvas
        // here we will be passign store name as argument
        // because by default we are assigning 'Example' as name
        this.nameChecked(lastRow.name);
      }

      // if it was more than one row
      else {

        // change the side first
        this.checkSide('name', false);

        // add last row manually to canvas
        this.addNameNumberText(lastRow.name, this.nameProperties, 'name');

        // get index after remove process
        let indexAfterRemove = this.nameNumberService.newRow.length - 1;

        // if last row is not present
        // add manually
        // this instance does not occur everytime so we need to check if last row is not present
        // then only add the same
        if (lastIndex != indexAfterRemove) {
          // add last row to newRow variable
          if (!this.nameNumberService.newRow[lastIndex]) this.nameNumberService.newRow[lastIndex] = {};

          this.nameNumberService.newRow[lastIndex] = Object.assign(this.nameNumberService.newRow[lastIndex], lastRow);
          this.nameNumberService.rowArray.push(this.nameNumberService.newRow);
        }
      }
    }
  }

  /**
   * When user changes side for add names from dropdown
   * 
   * @param title 
   */
  changeNumberSideTitle(title) {

    // if selected and current image side is same
    // return
    if (this.nameNumberService.selectedNumberTitle == title) return;

    // if not, set selected image side to current side
    this.nameNumberService.selectedNumberTitle = title;

    // if number is checked
    if (this.nameNumberService.addNumber) {

      // as we need to remove number from current canvas
      // we will store last row to local variable
      // this row will be fetch & stored in newRow variable
      // this is neccessary because when only one row is present
      // by default it will deselect name number after remove process

      // get current last index
      let lastIndex = this.nameNumberService.newRow.length - 1;

      // get last row
      let lastRow = this.nameNumberService.newRow.slice(lastIndex);
      lastRow = lastRow[0];

      // remove number object from current canvas
      this.removeObjOnChangeSide('number');

      // immediately render the same in html
      this.cdr.detectChanges();

      // in case of single row
      // when row is removed by default number will be unchecked as per our flow
      // we manually need to check the same and add previous data to newRow object
      if (!this.nameNumberService.addNumber) {

        // check Add Names Checkbox
        this.nameNumberService.addNumber = true;

        // we have already created function which will be handling insertion of 
        // new row in variable as well as in canvas
        // here we will be passign store number as argument
        // because by default we are assigning 'Example' as name
        this.numberChecked(lastRow.number);
      }

      // if it was more than one row
      else {

        // change the side first
        this.checkSide('number', false);

        // add last row manually to canvas
        this.addNameNumberText(lastRow.number, this.numberProperties, 'number');

        // get index after remove process
        let indexAfterRemove = this.nameNumberService.newRow.length - 1;

        // if last row is not present
        // add manually
        // this instance does not occur everytime so we need to check if last row is not present
        // then only add the same
        if (lastIndex != indexAfterRemove) {

          // add last row to newRow variable
          if (!this.nameNumberService.newRow[lastIndex]) this.nameNumberService.newRow[lastIndex] = {};

          this.nameNumberService.newRow[lastIndex] = Object.assign(this.nameNumberService.newRow[lastIndex], lastRow);
          this.nameNumberService.rowArray.push(this.nameNumberService.newRow);
        }
      }
    }
  }

  /**
   * On init and when user clicks on add row
   * 
   * @param type type of object(name/number)
   * @param newName if new name is supposed to be added instead of 'Example'
   * @param newNumber if new number is supposed to be added instead of '00'
   */
  addRow(type: any = null, newName: any = null, newNumber: any = null, checkForSide: boolean = true, displayFullView: boolean = false) {
    if (displayFullView == true) {
      this.showAddNameNumber(true);
    }
    // append array for ngFor
    this.nameNumberService.rowArray.push(this.nameNumberService.newRow);

    // generate new name/number row with specified/default data
    this.nameNumberService.newRow.push({
      name: (newName != null) ? newName : this.nameText,
      number: (newNumber != null) ? newNumber : this.numberText,
      id: this.nameNumberService.rowArray.length
    });

    // add price
    if (this.nameNumberService.newRow.length > 1) {

      this.priceService.totalQty++;
      this.priceService.extraPriceToBeAdded.productPrice += this.priceService.defaultPrice;
      this.priceService.addThisPrice();
    }

    // if no need to check for side
    // in case where name/number is added for the first time
    if (checkForSide == false) return;

    // if type is specified
    if (type != null) {

      // this function is called from different function
      // for different purposes
      // if type is set as addName/addNumber
      // change type for the same
      type = (type == 'addName') ? 'name' : 'number';

      // after setting type, check for side
      this.checkSide(type);

      // finally update the text for the same
      // this opearation is required only when user wants to add new row
      this.changeText(this.nameNumberService.newRow.length - 1, type);
    }

    // if type is not specified
    else {

      // if name is checked
      if (this.nameNumberService.addName) {
        this.checkSide('name');
        this.changeText(this.nameNumberService.newRow.length - 1, 'name');
      }

      // if number is checked
      if (this.nameNumberService.addNumber) {
        this.checkSide('number');
        this.changeText(this.nameNumberService.newRow.length - 1, 'number');
      }
    }
  }

  /**
   * This function is triggered many times
   * each time before adding name/number to canvas
   * we will be checking if image side is the correct
   * 
   * i. on first time, we need to check for image side
   * ii. when user is on same side, but on different design area, get design area of prev added name/number
   * iii. if user is on same side, same design area, don't change the side
   * iv. if user is on different side, change the side first 
   */
  checkSide(type, typeCheck: any = null) {

    // get canvas and index of canvas
    let canvasData = this.selectedCanvasKey(type, typeCheck);

    this.nameNumberService.nameNumberCanvas[type] = canvasData.canvas;
    // if canvas does not match current canvas
    // change the side
    if (canvasData.canvas != this.canvasService.currentCanvas) {
      this.eventService.$pub('changeImageSide', canvasData);
    }
  }

  /**
   * When user clicks on remove icon
   * or i. name is checked and name object is deleted
   * ii. number is checked and number object is deleted
   * iii. both are checked and both objects are removed
   * 
   * @param index 
   */
  removeRow(index, checkForChangeText: boolean = true) {

    // remove row first, for ngFor in html
    this.nameNumberService.rowArray.splice(index, 1);

    // store removed row object in local variable
    // this will be used in recalculation of price
    // eg. Dhoni/7 has selected Black/m having price 200 and total price is 250, 200 will be deducted
    let removedObj = this.nameNumberService.newRow.splice(index, 1);

    // push last removed row into temp obj
    this.removedObjects = this.removedObjects.concat(removedObj);

    // if removed object is in array format
    // get first instance
    removedObj = (Array.isArray(removedObj)) ? removedObj[0] : removedObj;

    // if single row was there
    // disable name/number
    // and delete the object
    if (!this.nameNumberService.rowArray.length) {
      this.nameNumberService.addName = false;
      this.nameNumberService.addNumber = false;
      // this.nameProperties = {};
      this.eventService.$pub('nameNumberDisabled');
      this.removeNameNumberText(removedObj);
    }
    // else publish resetCart event
    // we need to publish this event in else part
    // as we are already publishing this in removeNameNumberText function
    else {
      this.eventService.$pub('resetCart', removedObj);
    }

    // after remove, change text to previous text
    if (checkForChangeText === true && index > 0) {
      let newIndex = (index > 0) ? index - 1 : index;
      newIndex = (newIndex != this.nameNumberService.rowArray.length - 1) ? newIndex + 1 : newIndex;
      if (this.nameNumberService.addName)
        this.changeText(newIndex, 'name', true);
      if (this.nameNumberService.addNumber)
        this.changeText(newIndex, 'number', true);
    }
  }

  /**
   * When Add names checkbox is checked for the first time
   */
  nameChecked(text: any = null) {

    // check for side before insertion
    // if side is different then current side
    // change the side first
    this.checkSide('name', false);

    // add row on condition
    // here we will be checking is user has checked or unchecked the checkbox
    this.addRowOnCondition('addName');

    // if checked is true
    if (this.nameNumberService.addName) {
      if (!this.nameNumberService.addNumber) this.nameNumberService.publishNameNumber();
      // set initial properties
      if (!this.nameProperties || Object.keys(this.nameProperties).length == 0) {

        this.nameProperties = {
          fill: this.defaultColor.color_code,
          fontFamily: this.defaultFontFamily.font_label,
          fontSize: this.defaultFontSize,
          tab: "namenumber",
          addObj: "name",
          originX: 'center',
          originY: 'center'
        }
      }

      this.nameProperties.top = this.canvasService.clipY[this.canvasService.currentCanvas.designarea_id] + 30;
      this.nameProperties.originX = 'center';
      this.nameProperties.originY = 'center';
      this.nameProperties.left = this.canvasService.currentCanvas.width / 2;
      // when user changes image side
      // we remove name object from current canvas
      // and add the same to new canvas
      // in this case we need to set previous text as well
      // so instead of 'Example', we are setting name as last added name
      if (text == null && this.nameNumberService.newRow.length > 0) {
        text = this.nameNumberService.newRow[this.nameNumberService.newRow.length - 1].name;
      }

      // finally add name to canvas
      this.addNameNumberText((text != null) ? text : this.nameText, this.nameProperties, 'name');
    }

    // is checked is false
    // remove all name
    else {
      if (!this.nameNumberService.addNumber) {
        this.eventService.$pub('nameNumberDisabled');
      }
      this.removeNameNumberText();
    }
  }

  /**
   * When Add numbers checkbox is checked for the first time
   */
  numberChecked(text: any = null) {

    // check for side before insertion
    // if side is different then current side
    // change the side first
    this.checkSide('number', false);

    // add row on condition
    // here we will be checking is user has checked or unchecked the checkbox
    this.addRowOnCondition('addNumber');

    // if checked is true
    if (this.nameNumberService.addNumber) {
      this.nameNumberService.publishNameNumber();
      // set initial properties
      if (!this.numberProperties || Object.keys(this.numberProperties).length == 0) {
        this.numberProperties = {
          fill: this.defaultColor.color_code,
          fontFamily: this.defaultFontFamily.font_label,
          fontSize: this.defaultFontSize,
          tab: "namenumber",
          addObj: "number",
          originX: 'center',
          originY: 'center'
        }
      }
      let topMargin = 80;
      if (this.nameNumberService.nameNumberCanvas['name'] != this.nameNumberService.nameNumberCanvas['number']) {
        topMargin = 40;
      }
      this.numberProperties.top = this.canvasService.clipY[this.canvasService.currentCanvas.designarea_id] + topMargin;
      this.numberProperties.originX = 'center';
      this.numberProperties.originY = 'center';
      this.numberProperties.left = this.canvasService.currentCanvas.width / 2;
      // when user changes image side
      // we remove number object from current canvas
      // and add the same to new canvas
      // in this case we need to set previous text as well
      // so instead of '00', we are setting number as last added number
      if (text == null && this.nameNumberService.newRow.length > 0) {
        text = this.nameNumberService.newRow[this.nameNumberService.newRow.length - 1].number;
      }

      // finally add number to canvas
      this.addNameNumberText((text != null) ? text : this.numberText, this.numberProperties, 'number');
    }

    // is checked is false
    // remove all numbers
    else {
      this.removeNameNumberText();
    }
  }  

  /**
   * 
   */
  addRowOnCondition(type: any = null) {
    if (this.nameNumberService.addName || this.nameNumberService.addNumber) {
      if (!this.nameNumberService.rowArray.length) {
        this.addRow(type, null, null, false);
      }
    }
    else {
      if (this.nameNumberService.rowArray.length && (!this.nameNumberService.addName || !this.nameNumberService.addNumber)) {
        if (type != null) this.eventService.$pub('resetCart', { nameNumberData: this.nameNumberService.newRow, type: type, resetPrice: true });
        this.nameNumberService.rowArray = [];
        this.nameNumberService.newRow = [];
      }
    }
  }

  /**
   * 
   * @param value 
   * @param properties 
   * @param type 
   */
  addNameNumberText(value, properties, type) {
    // let canvas = this.selectedCanvasKey(type);
    let canvas = this.canvasService.currentCanvas;
    this.nameNumberService.nameNumberCanvas[type] = canvas;
    let textObj = new fabric.Text(value);
    if (!properties.hasOwnProperty('nameNumberId')) {
      properties = Object.assign(properties, { nameNumberId: this.nameNumberService.rowArray.length });
    }
    let params = {
      obj: textObj,
      properties: properties,
      crudServiceString: 'this.insertObjectService'
    };

    // set name number to center
    // if it's first time
    if (!properties.hasOwnProperty('left')) {

      // get center position
      let left = canvas.width / 2;
      properties.left = left;

      // we will set this property to global variable
      if (type == 'name') this.nameProperties.left = left;
      else if (type == 'number') this.numberProperties.left = left;
    }

    // finally update the same
    this.canvasService.objectCRUD(params);

    if (this.nameNumberService.newRow.length == 1 && ((type == 'name' && !this.nameNumberService.addNumber) || (type == 'number' && !this.nameNumberService.addName))) {
      this.eventService.$pub('resetCart', null);
    }
  }

  /**
   * 
   */
  removeNameNumberText(removedObj: any = null) {
    let textObj, properties: any = {}, canvas: any = null,
      canvasKeys = Object.keys(this.canvasService.containerCanvases),
      canvasObjects;

    for (let key of canvasKeys) {
      canvasObjects = this.canvasService.getObjects(this.canvasService.containerCanvases[key]);
      canvasObjects.forEach((data) => {
        if (data.addObj == 'name' && !this.nameNumberService.addName) {
          textObj = data;
          canvas = this.canvasService.containerCanvases[key];
        }
        if (data.addObj == 'number' && !this.nameNumberService.addNumber) {
          textObj = data;
          canvas = this.canvasService.containerCanvases[key];
        }
        let params = {
          obj: textObj,
          properties: properties,
          crudServiceString: 'this.removeObjectService',
        };
        if (canvas != null) params = Object.assign(params, { canvas: canvas });

        this.canvasService.objectCRUD(params);
      });
    }
    if (removedObj != null)
      this.eventService.$pub('resetCart', removedObj);
  }

  /**
   * 
   * @param index 
   * @param isFocus 
   */
  changeText(index, type: any = null, addIfNotAvailable: boolean = false, deselectAfterUpdate: boolean = false) {
    if (!this.nameNumberService.newRow.length || !this.nameNumberService.newRow[index] || !this.nameNumberService.newRow[index].hasOwnProperty(type)) return;
    let objCanvas = this.selectedCanvasKey(type).canvas, objects = objCanvas.getObjects(), value = this.nameNumberService.newRow[index][type];
    let selectedObj = objects.find(currObj => (currObj.hasOwnProperty('addObj') && currObj.addObj == type));

    if (!selectedObj) {
      if (addIfNotAvailable === false) {
        return;
      }
      else {
        let properties = Object.assign({}, (type == 'name') ? this.nameProperties : this.numberProperties);
        properties = Object.assign(properties, { nameNumberId: this.nameNumberService.newRow[index].id });
        this.addNameNumberText(value, properties, type);
      }
    }
    else {
      if (deselectAfterUpdate === false) this.canvasService.currentCanvas.setActiveObject(selectedObj).renderAll();
      if (selectedObj.text != value) {

        let properties = { text: value, nameNumberId: this.nameNumberService.newRow[index].id }, params = {
          obj: selectedObj,
          properties: properties,
          crudServiceString: 'this.updateObjectService'
        };
        let canvas: any = this.selectedCanvasKey(type);
        if (canvas && canvas.canvas) {
          canvas = canvas.canvas;
          params = Object.assign(params, { canvas: canvas });
        }
        if (deselectAfterUpdate === true) params = Object.assign(params, { setActive: false });
        this.canvasService.objectCRUD(params);
      }
    }
  }

  /**
   * 
   * @param index 
   * @param value 
   */
  changeObject(index, type, value: any = null) {

    // var declaration
    let currentCanvas = this.canvasService.currentCanvas,
      eventData = this.selectedCanvasKey(type);

    // if no canvas returned for selected canvas
    if (!eventData || !eventData.hasOwnProperty('canvas')) return;

    // check if current canvas is the has current name/number object
    // if not, change side first
    if (eventData.canvas != currentCanvas) {
      this.eventService.$pub('changeImageSide', eventData);
      this.cdr.detectChanges();
    }

    // change current obj
    this.changeText(index, type, true);

    // if after updating name/number
    // check if respective obj needs to be set as well
    if ((type == 'name' && !this.nameNumberService.addNumber) || (type == 'number' && !this.nameNumberService.addName)) return;

    // change respective obj
    let otherObjType = (type == 'name') ? 'number' : 'name';

    // change current obj
    this.changeText(index, otherObjType, true, true);
  }

  /**
   * 
   * @param value 
   */
  searchNameNumberObj(type) {
    if (type != 'name' && type != 'number') return;
    let allCanvas = this.canvasService.containerCanvases, selectedObj, canvas;
    for (let key in allCanvas) {
      canvas = allCanvas[key];
      selectedObj = canvas.getObjects().find(currObj => (currObj.hasOwnProperty('addObj') && currObj.addObj == type));
      if (selectedObj) {
        break;
      }
    }
    return { canvas: canvas, obj: selectedObj };
  }

  /**
   * 
   * @param type 
   */
  selectedCanvasKey(type, typeCheck: any = null) {
    if (type != 'name' && type != 'number') return;
    let currentCanvasImageId = this.canvasService.currentCanvas.image_id,
      requiredImageId = (type == 'name') ? this.nameNumberService.selectedNameTitle.imageId : this.nameNumberService.selectedNumberTitle.imageId, canvas;

    let allCanvas = this.canvasService.containerCanvases,
      nameNumberKey = (type == 'name') ? this.nameNumberService.addName : this.nameNumberService.addNumber,
      checkForType = (typeCheck == null && nameNumberKey) ? true : false,
      canvasIndex = 0, tmpObj, imageSideFirstCanvas: any = null;

    if (checkForType == false && currentCanvasImageId == requiredImageId) {
      canvas = this.canvasService.currentCanvas;
      canvasIndex = 0;
    } else {
      for (let key in allCanvas) {
        if (allCanvas[key].image_id == requiredImageId) {
          canvas = allCanvas[key];
          if (imageSideFirstCanvas == null) imageSideFirstCanvas = canvas;
          tmpObj = canvas.getObjects().find(currObj => (currObj.hasOwnProperty('addObj') && currObj.addObj == type));
          if (tmpObj)
            break;
          canvasIndex++;
        }
      }
      if (!tmpObj) {
        canvas = imageSideFirstCanvas;
        canvasIndex = 0
      };
    }
    return { canvas: canvas, index: canvasIndex };
  }

  /**
   * 
   * @param value 
   */
  removeObjOnChangeSide(type) {
    let properties: any = {};
    let data = this.searchNameNumberObj(type);
    if (!data || !data.hasOwnProperty('canvas')) return;
    this.canvasService.deleteThisObject(data.obj);
    let params = {
      obj: data.obj,
      properties: properties,
      canvas: data.canvas,
      crudServiceString: 'this.removeObjectService',
    };
    this.canvasService.objectCRUD(params);
  }

  /**
   * 
   */
  checkNameNumberAfterRemove(obj) {
    let index: any = null, currentType = obj.addObj, otherType = (currentType == 'name') ? 'number' : 'name';
    index = this.nameNumberService.newRow.indexOf(this.nameNumberService.newRow.find(nameNumberObj => nameNumberObj[obj.addObj] == obj.text));
    if (index != null && index != -1) {

      // if this was last object of respective type
      // eg. last name of last number
      // disable the same
      if (this.nameNumberService.newRow.length == 1) {
        if (currentType == 'name') {
          this.nameNumberService.addName = false;
        } else if (currentType == 'number') {
          this.nameNumberService.addNumber = false;
        }
      }

      // if this was the last object
      // disable name number
      if ((currentType == 'name' && !this.nameNumberService.addNumber) || (currentType == 'number' && !this.nameNumberService.addName) || (this.nameNumberService.newRow[index][otherType] == '')) {
        this.removeRow(index, true);
      }
    }
  }

  /**
   * 
   */
  async generateNameNumberImages() {
    this.loaderComponent.showMainLoader = true;
    let base64DataFile = [];
    await this.designService.saveAllSidesCanvasData().then((resp: any) => {
      base64DataFile = resp.timestamp;
    }).catch(err => console.log(err));
    let sidesAndParentImageIDs = this.designService.fetchImageSidesParentIdsWithId(this.canvasService.allImagesWithIds);
    let params = {
      base64DataFile: base64DataFile,
      productId: this.mainService.productId,
      designId: atob(this.mainService.designId),
      sidesAndParentImageIDs: sidesAndParentImageIDs,
      orderId: this.orderId,
      name: this.name,
      number: this.number,
      nameNumberIndex: this.nameNumberIndex
    },
      url = 'namenumber/Index/generateNameNumberImage';
    this.mainService.getData(url, params, null).then(response => {
      this.loaderComponent.showMainLoader = false;
      window.history.back();
    }).catch(err => console.log(err));
  }
  showChild() {
    if (this.showAllNameNumber) {
      this.showAddNameNumber(false);
    }
    this.tabsService.showChildTabs('name-number');
  }

  showAddNameNumber(showAllNameNumber) {
    this.showAllNameNumber = showAllNameNumber;
    this.eventService.$pub('showFonts', { showAllFonts: this.showAllNameNumber, title: 'Name Number' });
  }

}
