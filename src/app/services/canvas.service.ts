import { CropperUpdateService } from 'src/app/essentials/components/cropper/cropper-update.service';
import { PubSubService } from 'angular7-pubsub';
import { Injectable } from '@angular/core';
import { InsertObjectService } from './insert-object.service';
import { UpdateObjectService } from './update-object.service';
import { RemoveObjectService } from './remove-object.service';
import { CanvasUpdateService } from './canvas-update.service';
import { AddImageService } from './add-image.service';
import { ImageEffectsService } from 'src/app/common/components/image-effects/image-effects.service';
import { HistoryService } from './history.service';
import { fabric } from 'fabric';
import { RightPanelUpdateService } from 'src/app/essentials/components/right-panel/right-panel-update.service';
import { RangeSliderUpdateServiceService } from './range-slider-update-service.service';
import { SvgColorUpdateService } from './svg-color-update.service';
import { MultipleObjectsUpdateService } from './multiple-objects-update.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import { BestFitObjectService } from './best-fit-object.service';
import { ObjectPositionUpdateService } from './object-position-update.service';
import { MultipleObjectsStateUndoRedoService } from './multiple-objects-state-undo-redo.service';
import Swal from 'sweetalert2';
@Injectable({
  providedIn: 'root'
})
export class CanvasService {

  public containerCanvases = {};
  public currentCanvas;
  public isResponsive;
  public activeImageId;
  public firstImageId;
  public allImagesWithIds = {};
  public allImages = [];
  public scaleFactor: any = 1;
  public zoom: any = 0;
  public clipX = {};
  public clipY = {};
  public allObjects: any = [];
  public mod: number = 0;
  scalingProperties: any;
  usedColorArr: any = [];
  usedColorCounter: any;
  disableAddToCartAlert: boolean = false;
  currentDocumentEvent: any;
  // for customize control corner size
  public cornerSize: number = 20;

  // Object custom Properties;
  public objProperties: any = ["scaleFactor", "tab", "objType", "font_file", "id", 'price', 'isSvg', 'canvasWidth', 'canvasHeight', 'imageSrc', 'src', 'imageDesignId', 'zcustomObjects'];

  // we will save background of current canvas before changing image side
  public oldCanvasBackground: any = {};

  // 
  public associatedProductId: any;
  public productId: any;

  // public
  public objsToIgnore: any;  

  // object limit variable
  public objectLimit: any = {};

  public modalOpened: boolean = false;

  // image upload confirm box flag
  confimationclass: any;
  checkConfimation: any = false;
  public uploadFile: any = [];

  constructor(
    private insertObjectService: InsertObjectService,
    private updateObjectService: UpdateObjectService,
    private removeObjectService: RemoveObjectService,
    private canvasUpdateService: CanvasUpdateService,
    /*private addImageService: AddImageService,*/
    private imageEffectsService: ImageEffectsService,
    public eventService: PubSubService,
    private historyService: HistoryService,
    private rightPanelUpdateService: RightPanelUpdateService,
    private cropperUpdateService: CropperUpdateService,
    public rangeSliderUpdateService: RangeSliderUpdateServiceService,
    public svgColorUpdate: SvgColorUpdateService,
    public multipleObjectsUpdateService: MultipleObjectsUpdateService,
    public modalService: BsModalService,
    public bestFitObjectService: BestFitObjectService,
    public objectPositionUpdateService: ObjectPositionUpdateService,
    public multipleObjectStateUndoRedoService: MultipleObjectsStateUndoRedoService
  ) {
    if (!this.historyService.canvasService) {
      this.historyService.initCanvasService(this);
    }
    // call to method that will create initial events
    this.initiateEvents();
  }

  /**
   * Create initial events (eg. events for canvas)
   */
  initiateEvents() {
    let _this = this;

    document.onkeyup = ((event: KeyboardEvent) => {
      if (this.currentDocumentEvent != null) this.currentDocumentEvent = null;
    });

    document.onkeydown = ((event: KeyboardEvent) => {
      this.currentDocumentEvent = event;
      if (event && event.shiftKey) {
        _this.checkObjectSelection();
      }
      if (event.keyCode === 46) { /**  Delete key **/
        let totalModals = this.modalService.getModalsCount();
        if (totalModals > 0) return;
        let elements: any = document.getElementsByClassName("noDeleteObject");
        let removeObject = 0;
        for (let ctl of elements) {
          if (ctl && ctl.selectionStart) {
            let startPos = ctl.selectionStart;
            let endPos = ctl.selectionEnd;
            if (ctl.value.length == startPos && ctl.value.length == endPos) {
              removeObject++;
            }
          } else {
            removeObject++;

          }
        }
        if (removeObject == elements.length) {
          this.removeCurrentObject();
        }
      }

    });

    document.ontouchend = ((event: any) => {
      this.checkClasses(event);
    });

    // when canvas is created we have published this event
    // we are subscribing it here because as soon as canvas is created, we need to set events like object selected
    this.eventService.$sub('canvasCreated', (canvas) => {
      this.setEventsForCanvas(canvas);
      this.moveObjectsFromCanvasToCanvas(canvas);
    });
    this.eventService.$sub('allcanvasCreated', () => {
      if (this.allObjects.length > 0) {
        this.loadThisDesign(this.allObjects);
      }
    });
    let self = this;
    window.addEventListener("beforeunload", function (t) {
      if (self.hasCanvasObjectOrBackgroundAll() && self.disableAddToCartAlert == false) {
        t.returnValue = "Your custom message.";
      }
    });
    this.eventService.$sub('selectThisObjects', (objList) => {
      this.selectTheseObjects(objList);
    });
    this.prepareObjsToIgnore();
  }  

  /**
   * This function will prepare productimage object
   * this object is used in getObjects function of current service
   * all objects that matches any of the productimage properties, will be ignored
   */
  prepareObjsToIgnore() {
    this.objsToIgnore = [
      {
        key: 'productimage',
        value: true,
        ignorable: false
      },
      {
        key: 'isPattern',
        value: true,
        ignorable: true
      }
    ];
  }

  isObjectExists(key, value, canvas: any = null, checkFromAllCanvas: boolean = false) {
    let foundObj: any = null, allObjects: any = null;
    if (checkFromAllCanvas === false) {
      canvas = (canvas == null) ? this.currentCanvas : canvas;
      allObjects = this.getObjects(canvas);
      foundObj = allObjects.find(currObj => currObj[key] == value);
    } else {
      let allCanvas = this.containerCanvases;
      for (let key in allCanvas) {
        canvas = allCanvas[key];
        allObjects = this.getObjects(canvas);
        foundObj = allObjects.find(currObj => currObj[key] == value);
        if (foundObj) break;
      }
    }

    return foundObj;
  }

  checkClasses(event: any) {
    this.checkObjectSelection();
    let toggleElementEvents: any = {
      '.byi-products-inner,.product-tooltip': 'closeAllProducts',
      '.byi-imagecolor-list .byic_color_action , .byi-imagecolor-list .byic-colors-select,.byie-custom-color': 'closeColorPicker',
      '.byi-imagecolor-list .byic_color_action , .byi-imagecolor-list .byic-colors-select': 'closeImageEffectColorPicker',
      '.byi-fonts': 'closeFontWrapper',
      '.byi-layer-box': 'closeLayer',
      // '.byi-mob-output-action': 'closeHeaderIcon',
      '.byi-product-attr': 'closeProductOptions',
      '.byi-general-option-mob': 'closeSideBar',
      '.cart-info, .byi-info-display': 'closePriceInfo',
    };

    let elements: any = [];
    let outsideClickCounter = 0;
    for (let elementClass in toggleElementEvents) {
      let eventName = toggleElementEvents[elementClass];
      elements = document.querySelectorAll(elementClass);
      outsideClickCounter = 0;
      for (let element of elements) {
        if (!element.contains(event.target) && eventName != 'closeLayer') {
          outsideClickCounter++;
        } else if (eventName == 'closeLayer') {
          let id: any = event.target.id;
          if (!element.parentElement.contains(event.target) && !event.target.classList.contains('icon-t-delete') && id != 'delete') {
            outsideClickCounter++;
          }
        }
      }
      if (outsideClickCounter == elements.length) {
        this.eventService.$pub(eventName);
      }
    }

    let selectClassList = event.target.classList;
    for (var i = 0; i < selectClassList.length; i++) {
      let className = selectClassList[i];
      // To discard Active Object from Canvas
      if (className == 'byi-svg-editor-box' || className == 'product-designer-main-content') {
        this.discardActiveObjectAllCanvas();
      }
    }

    elements = document.querySelectorAll('.nav-item:not(.isResponsiveTab)');
    for (let element of elements) {
      if (element.contains(event.target)) {
        this.discardActiveObjectAllCanvas();
        break;
      }
    }

    elements = document.querySelectorAll('.byi-idea .byi-accordion-title');
    for (let element of elements) {
      if (element.contains(event.target)) {
        this.discardActiveObjectAllCanvas();
        break;
      }
    }

  }

  /**
   this method will do CRUD operation like insert/remove/update based on crudService variable
   * @param  params 
   * @return {[type]}        [description]
   */
  objectCRUD(params) {
    let crudServiceString = params.hasOwnProperty('crudServiceString') ? params.crudServiceString : null;
    params.isCenter = params.hasOwnProperty('isCenter') ? params.isCenter : false;
    params.isHistory = params.hasOwnProperty('isHistory') ? params.isHistory : true;
    params.isSvg = params.hasOwnProperty('isSvg') ? params.isSvg : false;
    params.isObjectModify = params.hasOwnProperty('isObjectModify') ? params.isObjectModify : false;
    params.service = this;
    params.eventService = this.eventService;
    params.canvas = params.hasOwnProperty('canvas') ? params.canvas : this.currentCanvas;
    params.setActive = params.hasOwnProperty('setActive') ? params.setActive : true;
    let crudService;
    if (crudServiceString) {
      crudService = eval(crudServiceString);
    } else {
      crudService = params.crudService;
    }
    // This method initialise object properties
    let cmd = new crudService.init(params);

    // This method execute the current CRUD operation
    cmd.exec();

    // This method push the current service into history
    if (params.isHistory) {
      this.historyService.push(cmd);
    }
  }
  /**
   * Prepare and return property object for best fit opearation
   * 
   * @param obj canvas object(if null then we will fetch current active object)
   */
  getBestFitProperties(obj: any = null) {
    // if no obj is provided, we will fetch current object
    // this is set as default parameter because in case of insertCanvas, we need to specify the object
    if (obj == null) obj = this.getActiveObject();

    // if no object is found, return from here
    if (!obj) return;

    // variable declaration
    let imageAspectRatio = obj.width / obj.height,
      canvas = this.currentCanvas,
      canvasAspectRatio = canvas.width / canvas.height,
      renderableHeight, renderableWidth, xStart, yStart,
      mainHeight = canvas.height - this.clipY[canvas.designarea_id],
      mainWidth = canvas.width - this.clipX[canvas.designarea_id],
      objWidth = obj.width,
      objHeight = obj.height;

    // If image's aspect ratio is less than canvas's we fit on height
    // and place the image centrally along width
    if (imageAspectRatio < canvasAspectRatio) {
      renderableHeight = mainHeight;
      renderableWidth = objWidth * (renderableHeight / objHeight);
      xStart = (mainWidth - renderableWidth) / 2;
      yStart = 0;
    }

    // If image's aspect ratio is greater than canvas's we fit on width
    // and place the image centrally along height
    else if (imageAspectRatio > canvasAspectRatio) {
      renderableWidth = mainWidth
      renderableHeight = objHeight * (renderableWidth / objWidth);
      xStart = 0;
      yStart = (mainHeight - renderableHeight) / 2;
    }

    // Happy path - keep aspect ratio
    else {
      renderableHeight = mainHeight;
      renderableWidth = mainWidth;
      xStart = 0;
      yStart = 0;
    }

    // return in object format
    return { left: xStart, top: yStart, width: renderableWidth, height: renderableHeight };
  }

  /**
   * Filter best fit object based on object type
   * 
   * @param bestFitProperties best fit object
   * @param obj canvas object
   */
  filterBestFitProperties(bestFitProperties, obj: any = null) {

    // if no object found, fetch current active object
    if (obj == null) obj = this.getActiveObject();

    // store objType to local variable
    let objType = obj.objType;

    // Check object type and perform operation accordingly
    switch (objType) {

      // in case of image, we will scale to best fit and remove height and width from property object
      case 'image':
        obj.scaleToHeight(bestFitProperties.height);
        obj.scaleToWidth(bestFitProperties.width);
        delete bestFitProperties.height;
        delete bestFitProperties.width;
        break;

      // in case of text, we will calculate scaleX and scaleY and remove top and left from property object
      case 'text':
      default:
        obj.textAlign = 'center';
        obj = Object.assign(obj, {
          scaleX: (bestFitProperties.width / obj.width),
          scaleY: (bestFitProperties.height / obj.height)
        });
        bestFitProperties = obj;
        break;
    }

    // finally return the property object
    return bestFitProperties;
  }

  /**
   * this function checks whether any object is selected on current canvas, if yes return the object, false otherwise
   */
  getActiveObject() {
    // if no canvas is selected currently, return false
    if (!this.currentCanvas) return false;

    // store current active obj to local var
    let obj = this.currentCanvas.getActiveObject();

    // check whether it's empty, if so replace it with false boolean
    obj = (obj) ? obj : false;

    // return above local variable
    return obj;
  }

  /**
   * Get Active object from all present canvases
   * On load template selected canvas and selected object may not be same
   */
  getActiveObjectFromAllCanvases() {

    // if no canvases present, return false
    if (!this.containerCanvases || !Object.keys(this.containerCanvases).length) return false;

    // variable declaration
    let allCanvases = this.containerCanvases, currCanvas, selectedObj;

    // traverse through each canvas
    for (let key in allCanvases) {

      // get canvas instance
      currCanvas = allCanvases[key];

      // get active object of current canvas instance
      selectedObj = currCanvas.getActiveObject();

      // if found, break the loop
      if (selectedObj) break;
    }

    // is object is found, return the same, return false otherwise
    return (selectedObj) ? selectedObj : false;
  }

  /**
   * this method will set common usefull events for specified canvas
   * 
   * @param canvas canvas obj
   */
  setEventsForCanvas(canvas) {
    canvas.on('object:added', (event) => {
      let obj = (event && event.target) ? event.target : false;
      if (obj && obj.hasOwnProperty('ultimatelock')) {
        obj = this.applyUltimateLock(obj);
        this.currentCanvas.renderAll();
      }
    });
    canvas.on('object:modified', (event) => {
      this.mod++;
      this.eventService.$pub('canvasObjectModified', event.target);
    });
    canvas.on('object:moving', (event) => {
      this.eventService.$pub('canvasObjectMoving', event.target);
    });
    canvas.on('object:scaling', (event) => {
      this.eventService.$pub('canvasObjectScaling', event.target);
    });
    canvas.on('object:scaled', (event) => {
      this.eventService.$pub('canvasObjectScaled', event.target);
    });
    canvas.on('before:selection:cleared', (event) => {
      this.eventService.$pub('objectBeforeSelectionCleared', event.target);
    });
    canvas.on('selection:cleared', (event) => {
      this.usedColorsCounter();
      this.eventService.$pub('objectSelectionCleared', event.target);
    });
    canvas.on('selection:created', (event) => {
      this.checkObjectSelection();
      this.usedColorsCounter();
      this.eventService.$pub('objectSelectionCreated', event.target);
    });
    canvas.on('selection:updated', (event) => {
      this.usedColorsCounter();
      this.eventService.$pub('objectSelectionUpdated', event.target);
    });
    this.eventService.$sub('objectUpdated', () => {
      this.usedColorsCounter();
    });
    canvas.on('object:removed', (object) => {
      this.eventService.$pub('canvasObjectRemoved', (object));
    });
    this.eventService.$sub('canvasBackgroundChange', () => {
      this.usedColorsCounter();
    });
    this.eventService.$sub('backgroundPatternsApplied', () => {
      this.usedColorsCounter();
    });
    canvas.on("after:render", (event) => {
      this.eventService.$pub('canvasAfterRender', canvas);
    });
  }

  checkObjectSelection() {
    if (!this.currentCanvas) return;
    let selectedObj = this.currentCanvas.getActiveObjects(), objToSelect = [], checkIfUltimateLock;
    checkIfUltimateLock = selectedObj.find(obj => (obj.ultimatelock == true));
    if (checkIfUltimateLock && selectedObj.length > 1) {

      selectedObj.filter(currObj => {
        if (!currObj.ultimatelock) {
          objToSelect.push(currObj);
        }
      });
      if (objToSelect.length > 0) {
        let canvas = this.currentCanvas;
        let temp: any = [];
        objToSelect.forEach(function (obj) {
          if (obj.ultimatelock != true && obj.selectable == true) {
            temp.push(obj);
          }
        });

        canvas.discardActiveObject();
        let sel = new fabric.ActiveSelection(temp, {
          canvas: canvas,
        });

        canvas.setActiveObject(sel);
        canvas.requestRenderAll();
      } else {
        this.deselectAllObjects();
      }
    }
  }

  /**
   * Deselect all objects on canvas
   */
  deselectAllObjects() {
    if (!this.currentCanvas) {
      return;
    }
    this.currentCanvas.discardActiveObject().renderAll();
  }
  /**
   * [Fetches all objects of all container canvases]
   */
  fetchAllObjects() {
    let index: number = 0;
    for (let key of Object.keys(this.containerCanvases)) {
      let canvas = this.containerCanvases[key];

      this.allObjects[index] = [];
      this.allObjects[index] = this.getObjects(canvas, false, true);

      let background: any = null;
      if (canvas.backgroundColor) {
        background = { key: 'backgroundColor', val: canvas.backgroundColor };
      } else if (canvas.backgroundImage) {
        background = { key: 'backgroundImage', val: canvas.backgroundImage };
      }
      if (background != null)
        this.allObjects[index] = Object.assign(this.allObjects[index], { background: background });
      index++;
    }
  }

  /**
   * [It will move all objects from one canvas to another if product options are changed, Add all fetched objects to current canvas]
   * @param canvas [current canvas]
   */
  moveObjectsFromCanvasToCanvas(canvas) {
    if (Object.keys(this.allObjects).length > 0) {
      let objects = this.allObjects[canvas.designarea_id];
      for (let index in objects) {
        let obj = objects[index];
        this.currentCanvas = canvas;
        let params = {
          obj: obj,
          properties: {},
          crudServiceString: 'this.insertObjectService',
          isCenter: false,
          isHistory: false,
        };
        this.objectCRUD(params);
      }
      this.allObjects[canvas.designarea_id] = {};
    }
    if (this.oldCanvasBackground && Object.keys(this.oldCanvasBackground).length > 0) {
      let properties: any = {}, params = {
        crudServiceString: 'this.canvasUpdateService',
        isHistory: true
      };
      properties[this.oldCanvasBackground.key] = this.oldCanvasBackground.val;
      params = Object.assign(params, { properties: properties })
      setTimeout(() => {
        this.objectCRUD(params);
      }, 100);
    }
  }

  loadThisDesign(designObj) {
    let allCanvases = this.containerCanvases, index: number = 0, params = {
      obj: null, properties: {}, canvas: {}, crudServiceString: 'this.insertObjectService', isCenter: false,
      isHistory: false
    }, obj: any = null;
    for (let key in allCanvases) {
      if (designObj[index]) {
        obj = designObj[index];
        params.properties = {};
        params.crudServiceString = 'this.insertObjectService';
        params.canvas = allCanvases[key];
        obj.filter(o => {
          params.obj = o;
          this.objectCRUD(params);
        });
        if (obj.hasOwnProperty('background')) {
          params.properties[obj.background.key] = obj.background.val;
          params.crudServiceString = 'this.canvasUpdateService';
          this.objectCRUD(params);
        }
      }
      index++;
    }
  }

  /**
   * [Resize all objects of canvas based on scaleFactor]
   * @param {[type]} canvas [current canvas]
   */
  resizeCanvasObjects(canvas) {
    let objectsLen = canvas.getObjects().length;
    if (objectsLen > 0) {
      for (var i = 0; i < objectsLen; i++) {
        if (canvas.getObjects()[i].isPattern == true) {
          continue;
        }
        let obj = this.resizeObjectAsPerScale(canvas.getObjects()[i]);
        obj.setCoords();
      }
    }
  }


  getActiveObjectValue(objType: string, objKeyName: string) {
    let value: any = false, obj = this.getActiveObject();
    if (obj && obj.type == objType && obj[objKeyName]) {
      value = obj[objKeyName];
    }
    return value;
  }


  getObject(objtype: string) {
    let objCount = 0;
    let allObj = this.getObjects();
    allObj.filter(obj => {
      if (obj.type == objtype) objCount++;
    });
    return objCount;
  }

  getObjectTypeFromAllCanvas(key: string, value: string) {
    let objCount = 0;
    let allCanvas = this.containerCanvases;
    for (let canvasKey in allCanvas) {

      let allObj = this.getObjects(allCanvas[canvasKey]);
      allObj.filter(obj => {
        if (obj.hasOwnProperty(key) && obj[key] && obj[key] == value && !obj.hasOwnProperty('templateObj')) objCount++;
      });
    }
    return objCount;
  }

  getObjectTypeFromAllCanvasForPriceinfo(key: string, value: string) {
    let objCount = 0;
    let allCanvas = this.containerCanvases;
    for (let canvasKey in allCanvas) {

      let allObj = this.getObjects(allCanvas[canvasKey]);
      allObj.filter(obj => {
        if (obj.hasOwnProperty(key) && obj[key] && obj[key] == value) objCount++;
      });
    }
    return objCount;
  }

  calculateTax(tax, price, includeTax: boolean) {
    return parseFloat(price);
  }

  /* for Price */
  fetchAllObjectPrices(priceObj: any) {
    let totalTextPrice = 0;
    let totalClipartImgPrice = 0;
    let totalUploadImgPrice = 0;
    let totalTextExcluTaxPrice = 0;
    let totalClipartImgExcluTaxPrice = 0;
    let totalUploadImgExcluTaxPrice = 0;
    for (let key of Object.keys(this.containerCanvases)) {
      let canvas = this.containerCanvases[key];
      this.getObjects(canvas).filter(obj => {
        if ((obj.type == 'text' || obj.type == 'textbox')) {
          totalTextPrice += this.calculateTax(priceObj.tax, priceObj.textPrice, priceObj.addTax);
          totalTextExcluTaxPrice += priceObj.textPrice;
        }
        if (obj.tab == 'clipart') {
          let clipartPrice = (obj.price != "" && obj.price != null && obj.price > 0) ? parseFloat(obj.price) : parseFloat(priceObj.addImagePrice);
          totalClipartImgPrice += this.calculateTax(priceObj.tax, clipartPrice, priceObj.addTax);
          totalClipartImgExcluTaxPrice += clipartPrice;
        }
        if (obj.tab == 'upload') {
          let UploadImgPrice: any = (parseFloat(priceObj.uploadPrice) + parseFloat(priceObj.addImagePrice));
          totalUploadImgPrice += this.calculateTax(priceObj.tax, UploadImgPrice, priceObj.addTax);
          totalUploadImgExcluTaxPrice += UploadImgPrice;
        }
      });
    }
    return {
      totalTextPrice: totalTextPrice,
      totalClipartImgPrice: totalClipartImgPrice,
      totalUploadImgPrice: totalUploadImgPrice,
      totalTextExcluTaxPrice: totalTextExcluTaxPrice,
      totalClipartImgExcluTaxPrice: totalClipartImgExcluTaxPrice,
      totalUploadImgExcluTaxPrice: totalUploadImgExcluTaxPrice
    };
  }
  initZoom() {
    if (window.innerWidth > 1024 && window.innerHeight < 768 && this.zoom == 0) {
      this.zoom = -0.4;
    }
    if (window.innerWidth > 1024 && window.innerHeight > 900 && this.zoom == 0) {
      this.zoom = 0.2;
    }
  }
  initScaleFactor() {
    if (window.innerWidth < 640) {
      if (window.innerWidth < 640 && window.innerWidth >= 480) {
        this.scaleFactor = 1.4;
      }
      if (window.innerWidth < 480 && window.innerWidth >= 320) {
        this.scaleFactor = 1.8;
      }
      if (window.innerWidth < 320) {
        this.scaleFactor = 3.4;
      }
    } else {
      this.scaleFactor = 1;
    }

    this.scaleFactor = this.scaleFactor - this.zoom;
    return this.scaleFactor;
  }
  /**
   * Return data url of canvases of mentioned image id
   * @param  currentImageId [Image id of canvas]
   */
  getCanvasDataUrl(currentImageId) {
    let images = {};
    for (let key of Object.keys(this.containerCanvases)) {
      let canvas = this.containerCanvases[key];
      if (this.hasCanvasObjectOrBackground(canvas)) {
        if (canvas.image_id == currentImageId) {
          let image = canvas.toDataURL({
            format: "png",
            multiplier: this.scaleFactor,
            quality: 1.0
          });
          image = image.substr(image.indexOf(',') + 1).toString();
          images[key] = image;
        }
      }
    }
    return images;
  }

  getCanvasToJson() {
    let containerCanvasesJSON = {};
    for (let key of Object.keys(this.containerCanvases)) {
      let canvas = this.containerCanvases[key];
      if (this.hasCanvasObjectOrBackground(canvas)) {
        let canvasJson = canvas.toJSON(this.objProperties);
        containerCanvasesJSON[key] = canvasJson;
      }
    }
    return containerCanvasesJSON;
  }
  /**
   * Load design based on json
   */
  loadDesign(designData) {
    let jsonObjects = JSON.parse(designData.json_objects);
    let containerCanvasesKeys = Object.keys(this.containerCanvases);
    let containerCanvasesKeysFlag = 0;
    let jsonObjectsFlag = 0;
    let data = {
      containerCanvasesKeys: containerCanvasesKeys,
      containerCanvasesKeysFlag: containerCanvasesKeysFlag,
      jsonObjectsFlag: jsonObjectsFlag,
      jsonObjects: jsonObjects,
      productId: designData.associated_product_id,
      currentProductId: designData.currentProductId,
    }
    this.loadSingleCanvasDesign(data);
    setTimeout(() => {
      this.forceLoadFirstSide();
    }, 400);
  }

  /**
   * It will add object in current canvas and will call next canvas load 
   */
  loadSingleCanvasDesign(data) {
    let self = this;
    let imageDesignId = data.containerCanvasesKeys[data.containerCanvasesKeysFlag];
    if (imageDesignId == undefined) {
      return;
    }
    let canvas = this.containerCanvases[imageDesignId];
    let params: any = {
      canvas: canvas
    }
    let currentJsonObjects = data.jsonObjects[imageDesignId];
    /**
     * If Product is different then fetch object from json object and add to canvas
     */
    if (currentJsonObjects == undefined) {
      if (data.productId != data.currentProductId) {
        currentJsonObjects = data.jsonObjects[Object.keys(data.jsonObjects)[data.containerCanvasesKeysFlag + data.jsonObjectsFlag]];
        if (currentJsonObjects == undefined) {
          return;
        }
        data.differentProduct = true;
        if (currentJsonObjects.objects.length == 0) {
          data.jsonObjectsFlag++;
          self.loadSingleCanvasDesign(data);
        }
        params.differentProduct = data.differentProduct ? data.differentProduct : false;
      } else {
        data.containerCanvasesKeysFlag++;
        self.loadSingleCanvasDesign(data);
      }
    }
    if (currentJsonObjects == undefined) {
      return;
    }
    if (currentJsonObjects && currentJsonObjects.background) {
      if (typeof currentJsonObjects.background != 'object') {
        canvas.setBackgroundColor(currentJsonObjects.background);
      }
      canvas.renderAll();
    }
    fabric.util.enlivenObjects(currentJsonObjects.objects, function (objectData) {
      let totalObjects = objectData.length;
      let count = 1;
      if (objectData.length > 0) {
        objectData.forEach(function (obj) {
          params.obj = obj;
          self.addObjectAsPerScale(params);
          if (totalObjects == count) {
            data.containerCanvasesKeysFlag++;
            self.loadSingleCanvasDesign(data);
          }
          count++;
        });
      } else {
        data.containerCanvasesKeysFlag++;
        self.loadSingleCanvasDesign(data);
      }
    });
    this.forceLoadFirstSide();
  }

  forceLoadFirstSide() {
    let canvas: any = Object.values(this.containerCanvases);
    canvas = canvas[0];
    this.currentCanvas = canvas;
    let eventParam = {
      canvas: canvas,
      index: 0
    };
    this.eventService.$pub('changeImageSide', eventParam);

    this.deselectAllObjects();

    //let allObj = canvas.getObjects();
    let allObj = this.getObjects(canvas);
    if (allObj && allObj.length) {
      setTimeout(() => {
        canvas.setActiveObject(allObj[0]).renderAll();
      }, 200);
    }
  }

  async addSvgImage(obj, properties, isCenter): Promise<any> {
    const self = this;
    return new Promise(async (resolve, reject) => {
      new fabric.loadSVGFromURL(obj.src, (svgImgObject, options) => {
        let imgObj = new fabric.Group(svgImgObject);
        imgObj['src'] = obj.src;
        let oldFill = [];

        //get style of orignal object
        obj._objects.forEach((data) => {
          oldFill.push(data.fill);
        });

        //add style to new object
        imgObj._objects.forEach((data, index) => {
          data.set({ fill: oldFill[index] });
        });
        this.objProperties.filter(customProperty => {
          properties[customProperty] = obj[customProperty];
        })

        let params = {
          obj: imgObj,
          canvas: properties.canvas,
          properties: properties,
          crudServiceString: 'this.insertObjectService',
          isCenter: isCenter,
          isHistory: false,
        };
        self.objectCRUD(params);
        /*this.cdr.detectChanges();*/
        resolve();
      });
    });
  }

  /**
   * It will add object by load
   * @param objectData [canvas and object details]
   */
  async addObjectAsPerScale(objectData): Promise<any> {

    return new Promise(async (resolve, reject) => {
      let canvas = objectData.canvas;
      let oldScaleFactor = objectData.obj.scaleFactor;
      let obj = this.resizeObjectAsPerScale(objectData.obj);
      /**
    * If different product then change left top and scaleX scaleY with current canvas
    */
      if (objectData.differentProduct) {
        obj = this.resizeObjectAsPerCanvas(obj, canvas);
      }

      if (obj.isPattern) {
        obj.scaleFactor = oldScaleFactor;
        let pattern = {
          obj: obj,
          canvas: canvas,
        }
        this.eventService.$pub('loadBackgroundPattern', pattern);
      } /*else if (obj.type == "group") {
      let data = obj.toJSON();
      delete data.objects;
      data.canvas = canvas;
      await this.addSvgImage(obj, data, false);
          //if (this.activeImageId == canvas.image_id) {
            let canvasData = { image_id: canvas.image_id, design_area_id: canvas.designarea_id };
            this.eventService.$pub('imageSideChangeBefore', canvasData);
          //}
          resolve(true);
        } */else {
        let params = {
          obj: obj,
          canvas: canvas,
          properties: {},
          crudServiceString: 'this.insertObjectService',
          isHistory: false,
          isCenter: false
        };
        this.objectCRUD(params);
        // if (this.activeImageId == canvas.image_id) {
        let canvasData = { image_id: canvas.image_id, design_area_id: canvas.designarea_id };
        this.eventService.$pub('imageSideChangeBefore', canvasData);
        // }
        resolve(true);
      }
    });
  }
  /**
  * It will resize object as per current canvas
  */
  resizeObjectAsPerCanvas(obj, canvas) {
    obj.left = (canvas.width * obj.left) / obj.canvasWidth;
    obj.top = (canvas.height * obj.top) / obj.canvasHeight;
    obj.scaleX = (canvas.width * obj.scaleX) / obj.canvasWidth;
    obj.scaleY = (canvas.height * obj.scaleY) / obj.canvasHeight;
    return obj;
  }
  /**
   * It will resize object as per current scaleFactor
   */
  resizeObjectAsPerScale(obj) {
    obj.top = (obj.scaleFactor * obj.top) / this.scaleFactor;
    obj.left = (obj.scaleFactor * obj.left) / this.scaleFactor;
    obj.scaleX = (obj.scaleFactor * obj.scaleX) / this.scaleFactor;
    obj.scaleY = (obj.scaleFactor * obj.scaleY) / this.scaleFactor;
    obj.scaleFactor = this.scaleFactor;
    return obj;
  }
  /**
   * It discard all active objects from canvas
   */
  discardActiveObjectAllCanvas() {
    for (let key of Object.keys(this.containerCanvases)) {
      let canvas = this.containerCanvases[key];
      canvas.discardActiveObject().renderAll();
    }
  }
  deleteThisObject(obj) {
    for (let key of Object.keys(this.containerCanvases)) {
      let canvas = this.containerCanvases[key];
      canvas.remove(obj).renderAll();
    }
  }
  // It will remove all objects from canvas
  clearCanvas(c: any = null) {
    if (c) {
      let objects = this.getObjects(c, false, true);
      if (objects.length > 0) {
        for (let obj of objects) {
          let params = {
            obj: obj,
            canvas: c,
            properties: null,
            crudServiceString: 'this.removeObjectService',
            isHistory: false,
            removeUltimateObj: true
          };
          this.objectCRUD(params);
        }
      }
      let params = {
        properties: {
          backgroundColor: null
        },
        crudServiceString: 'this.canvasUpdateService',
        isHistory: false,
        canvas: c,
      };
      this.objectCRUD(params);
      this.usedColorsCounter();
    } else {
      for (let key of Object.keys(this.containerCanvases)) {
        let canvas = this.containerCanvases[key];
        let objects = this.getObjects(canvas, false, true);
        if (objects.length > 0) {
          for (let obj of objects) {
            let params = {
              obj: obj,
              canvas: canvas,
              properties: null,
              crudServiceString: 'this.removeObjectService',
              isHistory: false,
              removeUltimateObj: true
            };
            this.objectCRUD(params);
          }
        }
        let params = {
          properties: {
            backgroundColor: null
          },
          crudServiceString: 'this.canvasUpdateService',
          isHistory: false,
          canvas: canvas
        };
        this.objectCRUD(params);
        this.usedColorsCounter();
        canvas.renderAll();
      }
    }
  }
  /**
   * This method clears all the history
   */
  clearHistory() {
    this.historyService.clear();
  }

  /**
  Get Object Type 
  **/
  getObjectType(obj, type) {
    let response: any = false;
    if (obj._objects == undefined) {
      response = (obj.objType == type) ? true : false;
    } else {
      let stop = true;
      obj._objects.forEach(function (obj) {
        if (obj.objType == type && stop) {
          response = true;
          stop = false;
        }
      });
    }
    return response;
  }

  /**
  * fetch data URLs of single canvase
  */
  fetchSingleCanvasDataURL(data) {
    let canvasDataUrls = {};
    let response: any = {};
    if (data.containerCanvasesKeys[data.containerCanvasesKeysFlag]) {
      let imageDesignId = data.containerCanvasesKeys[data.containerCanvasesKeysFlag];
      let canvas = this.containerCanvases[imageDesignId];
      let canvasDataUrl = {};
      if (this.hasCanvasObjectOrBackground(canvas)) {
        this.setOpacity(canvas, 0);
        let canvasDataUrl = canvas.toDataURL({
          format: "png",
          multiplier: this.fetchOutPutScaleFactor(canvas),
          quality: 1.0
        });
        canvasDataUrl = canvasDataUrl.substr(canvasDataUrl.indexOf(',') + 1).toString();
        canvasDataUrls[imageDesignId] = canvasDataUrl;
        this.setOpacity(canvas, 1);
      }
      response.status = 'pending';
      response.canvasDataUrls = canvasDataUrls;
    } else {
      response.status = 'completed';
    }
    return response;
  }
  setOpacity(canvas, opacity) {
    for (let obj of canvas.getObjects()) {
      if (obj.productimage == true) {
        obj.set({
          opacity: opacity
        });
      }
    }
    canvas.renderAll();
  }
  /**
   * Return multiplier of canvas
   */
  fetchOutPutScaleFactor(canvas) {
    let multiplier: any;
    if (canvas.size.origWidth > canvas.size.origHeight) {
      let actualCanvasWidth = (canvas.size.origWidth * canvas.width) / (canvas.size.toolWidth / this.scaleFactor);
      multiplier = actualCanvasWidth / canvas.width;
    } else {
      let actualCanvasHeight = (canvas.size.origHeight * canvas.height) / (canvas.size.toolHeight / this.scaleFactor);
      multiplier = actualCanvasHeight / canvas.height;
    }
    return multiplier;
  }
  /**
   * This check if canvas has objects or background
   */
  hasCanvasObjectOrBackground(canvas) {
    let hasObjects = this.getObjects(canvas).length > 0;
    let hasBackground = canvas.backgroundColor || canvas.backgroundImage;
    let hasIgnorableObjects = this.getObjects(canvas, false, true).length > 0;
    return hasObjects || hasBackground || hasIgnorableObjects;
  }

  hasCanvasObjectOrBackgroundAll() {
    let allcanvas: any = Object.values(this.containerCanvases), totalCanvases = allcanvas.length,
      i = 0, hasObjects: boolean = false, hasBackground: boolean = false;

    for (; i < totalCanvases && !hasObjects && !hasBackground; i++) {
      // hasObjects = allcanvas[i].getObjects().length > 0;
      hasObjects = this.getObjects(allcanvas[i], false, true).length > 0;
      hasBackground = allcanvas[i].backgroundColor || allcanvas[i].backgroundImage;
    }
    return hasObjects || hasBackground;
  }

  hasAnyCanvasDesign() {
    let response: boolean = false;
    for (let key of Object.keys(this.containerCanvases)) {
      let canvas = this.containerCanvases[key];
      if (this.hasCanvasObjectOrBackground(canvas)) {
        response = true;
      }
    }
    return response;
  }

  Flip(alignment) {
    let canvas = this.currentCanvas;
    let selectedObjs = canvas.getActiveObjects();
    if (!selectedObjs || !selectedObjs.length) return;

    selectedObjs.filter(obj => {
      let flipValue: any; let properties = {};
      if (obj) {
        if (alignment == "horizontal") {
          flipValue = (obj.flipX == false) ? true : false;
          properties = { flipX: flipValue };
        } else {
          flipValue = (obj.flipY == false) ? true : false;
          properties = { flipY: flipValue };
        }
        let params = {
          obj: obj,
          properties: properties,
          crudServiceString: 'this.updateObjectService',
          preventDeselection: false
        };
        this.objectCRUD(params);
      }
    });
    this.eventService.$pub('selectThisObjects', selectedObjs);
  }

  ObjectLayer(option, object: any = {}) {
    let canvas = this.currentCanvas, totalObjects = Object.keys(object).length,
      selectedObj = (totalObjects === 0) ? canvas.getActiveObject() : object,
      properties = { option: option };
    let params = {
      obj: selectedObj,
      properties: properties,
      crudServiceString: 'this.rightPanelUpdateService'
    }
    this.objectCRUD(params);
  }

  checkSelectable(obj) {
    return (obj.selectable) ? true : false;
  }

  deleteObject(object: any = {}) {
    let activeObjs = this.currentCanvas.getActiveObjects();
    let removeObjects = (Object.keys(object).length === 0) ? activeObjs : object;
    let selectable = true;
    if (activeObjs.length == 0 && this.checkSelectable(removeObjects) == false) {
      selectable = false;
    }
    if (selectable) {
      let params = {
        obj: removeObjects,
        properties: null,
        crudServiceString: 'this.removeObjectService',
      };
      this.objectCRUD(params);
      this.currentCanvas.discardActiveObject();
      this.currentCanvas.requestRenderAll();
    }
  }
  calculateLowResolutionWarning() {
    let lowResolutionObjects = 0;
    for (let key of Object.keys(this.containerCanvases)) {
      let canvas = this.containerCanvases[key];
      for (let obj of this.getObjects(canvas)) {
        if (obj.type == "image") {
          let desiredWidth = (canvas.size.origWidth * obj.scaleX * obj.width) / canvas.size.toolWidth;
          if (desiredWidth > obj.width) {
            lowResolutionObjects++;
          }
        }
      }
    }
    if (lowResolutionObjects != 0) {
      return true;
    }
    return false;
  }

  getObjectCount(tab) {
    let totalCount = 0;
    for (let key of Object.keys(this.containerCanvases)) {
      let canvas = this.containerCanvases[key];
      if (canvas != undefined) {
        let getObjs = this.getObjects(canvas);
        getObjs.filter(object => {
          if (object.tab == tab) {
            totalCount++;
          }
        });
      }
    }
    return totalCount;
  }

  usedColorsCounter() {
    this.usedColorArr = [];
    let canvasKeys = Object.keys(this.containerCanvases),
      canvasObjects;
    let backgroundPatterColors = 0;
    for (let key of canvasKeys) {
      canvasObjects = this.getObjects(this.containerCanvases[key]);
      canvasObjects.forEach((data) => {
        if ((data.type == 'text' || data.type == 'textbox')) {
          let fill = data.fill;
          let stroke = data.stroke ? data.stroke : null;
          let shadow = data.shadow ? data.shadow.color : null;
          if (fill)
            this.usedColorArr.push(fill);
          if (stroke)
            this.usedColorArr.push(stroke);
          if (shadow) {
            this.usedColorArr.push(shadow);
          }
        }
        if (data.objType == 'image' && data.isSvg == true) {
          data._objects.forEach((svgColor) => {
            if (svgColor.fill) {
              if (this.usedColorArr.indexOf(svgColor.fill) == -1) {
                this.usedColorArr.push(svgColor.fill);
              }
            }
          });
        }
      });
      let backgroundColor = this.containerCanvases[key].backgroundColor;
      if (backgroundColor) {
        this.usedColorArr.push(backgroundColor);
      }

    }
    let colorArr: any = [];
    for (var i = 0; i < this.usedColorArr.length; i++) {
      if (!colorArr.includes(this.usedColorArr[i])) {
        colorArr.push(this.usedColorArr[i]);
      }
    }
    this.usedColorCounter = colorArr.length + backgroundPatterColors;
  }

  applyUltimateLock(obj, loadDesign = true) {
    if (!loadDesign) {
      if (obj.ultimatelock) {
        obj.ultimatelock = obj.lockMovementX = obj.lockMovementY = false;
        obj.hasControls = true;
      } else {
        obj.ultimatelock = obj.lockMovementX = obj.lockMovementY = true;
        obj.hasControls = false;
      }
    } else {
      if (obj.ultimatelock) {
        obj.ultimatelock = obj.lockMovementX = obj.lockMovementY = true;
        obj.hasControls = false;
      }
    }
    return obj;
  }

  removeCurrentObject() {
    let activeObjects = this.currentCanvas.getActiveObjects();
    let params = {
      obj: activeObjects,
      properties: null,
      crudServiceString: 'this.removeObjectService',
    };
    this.objectCRUD(params);
  }

  /**
   * canavs object
   *
   * @param canvas 
   */
  getObjects(canvas: any = null, checkActiveObj: boolean = false, ignorable: boolean = false) {
    // if no canvas object is passed, current canvas will be used
    canvas = (canvas == null) ? this.currentCanvas : canvas;

    // prepare local variables
    let allObjects = (!checkActiveObj) ? canvas.getObjects() : canvas.getActiveObjects(), resultObjs: any = [], ignoreThis: any = null, self = this;

    // traverse through allObjects object
    allObjects.filter(currObj => {

      // ignoreThis works as a flag
      // which will check whether current object matches any of the properties specified
      // in objsToIgnore
      if (ignorable === false) {

        ignoreThis = self.objsToIgnore.indexOf(self.objsToIgnore.find(objToIgnore => (currObj.hasOwnProperty(objToIgnore.key) && currObj[objToIgnore.key] == objToIgnore.value)));
      } else {
        ignoreThis = self.objsToIgnore.indexOf(self.objsToIgnore.find(objToIgnore => (currObj.hasOwnProperty('ignorable') && currObj.ignorable == false)));
      }

      // if ignoreThis is -1, that means current object does not match any properties to ignore
      // so we will push this object to our resultObjs variable
      if (ignoreThis == -1) resultObjs.push(currObj);
    });

    // finally return this array of object
    return resultObjs;
  }

  rangeSliderUndoRedo(properties) {
    let params = {
      obj: this.currentCanvas.getActiveObjects(),
      canvas: this.currentCanvas,
      crudServiceString: 'this.rangeSliderUpdateService'
    };
    params = Object.assign(params, { properties: properties });
    this.objectCRUD(params);
  }

  objectPositionUndoRedo(properties) {

    let params = {
      obj: this.currentCanvas.getActiveObjects(),
      canvas: this.currentCanvas,
      crudServiceString: 'this.objectPositionUpdateService'
    };
    params = Object.assign(params, { properties: properties });
    params = Object.assign(params, { selectedObj: this.currentCanvas.getActiveObjects() });
    this.objectCRUD(params);
  }

  /**
   * This function will force fabric to deselect current active object(s)
   * & select specified list of objects as a group
   * remember input must be array
   * 
   * @param objectList array of canvas objects
   */
  selectTheseObjects(objectList, selectAll: boolean = false) {

    if (!objectList || !objectList.length) {
      if (selectAll === false) return false;
      objectList = this.currentCanvas.getObjects();
    }

    // init temp obj that will filter objects to be selected
    // objects which are been locked won't be selected
    let temp: any = [];

    // traversal
    objectList.forEach(function (obj) {

      // if no lock/ultimate lock is set
      // add that obj to tmp arry
      if (obj.ultimatelock != true && obj.selectable == true) {
        temp.push(obj);
      }
    });

    // deselect current active object(s)
    this.currentCanvas.discardActiveObject();

    // init object to be selected
    let sel: any = null;

    // if array is having single object
    // select individual
    if (temp.length == 1) {
      sel = temp[0];
    }

    // else create group object
    else {

      // prepare group object
      sel = new fabric.ActiveSelection(temp, {
        canvas: this.currentCanvas,
      });
    }

    // set sel object as active object
    this.currentCanvas.setActiveObject(sel);

    // render
    this.currentCanvas.requestRenderAll();
  }

  /**
   * This function will return true if specified object exceeds allowed limit
   * 
   * @param tabName eg text, clipart, upload
   */
  checkObjectLimitByTabName(tabName) {

    // if all limits are disabled, return true
    if (!this.objectLimit.textLimitEnable && !this.objectLimit.clipartLimitEnable && !this.objectLimit.uploadLimitEnable) {
      return false;
    }

    // variables
    let isLimitExceed: boolean = false, limitEnabled, totalLimitAllowed;

    // switch case to determine enable limit flag and limit value
    switch (tabName) {

      // for text objects
      case 'text':
        limitEnabled = this.objectLimit.textLimitEnable;
        totalLimitAllowed = this.objectLimit.textLimitCounter;
        break;

      // for clipart objects
      case 'clipart':
        limitEnabled = this.objectLimit.clipartLimitEnable;
        totalLimitAllowed = this.objectLimit.clipartImageLimit;
        break;

      // for upload-image objects
      case 'upload':
        limitEnabled = this.objectLimit.uploadLimitEnable;
        totalLimitAllowed = this.objectLimit.uploadImageLimit;
        break;
    }

    // if limit is enabled
    if (limitEnabled) {

      // get total objects of specified tab
      let totalCanvasObjects = this.getObjectCount(tabName);

      // check if canvas objects are greater than total allowed objects
      isLimitExceed = (totalCanvasObjects >= totalLimitAllowed) ? true : false;
    }

    // return flag value
    return isLimitExceed;
  }
}
