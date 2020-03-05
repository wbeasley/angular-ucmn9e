import { RemoveObjectService } from 'src/app/services/remove-object.service';
import { PubSubService } from 'angular7-pubsub';
import { CanvasService } from 'src/app/services/canvas.service';
import { MainService } from 'src/app/services/main.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { RightPanelService } from './right-panel.service';
declare var fabric: any;
declare let introJs: any;

@Component({
  selector: 'right-panel',
  templateUrl: './right-panel.component.html',
  styleUrls: ['./right-panel.component.scss']
})
export class RightPanelComponent implements OnInit {
  public disableCrop: boolean;
  public ultimateLockClass: boolean = false;
  public isOpenClass: boolean = false;
  @ViewChild('cropper') cropper;

  // will handle layers enable disable(for changing object z-index)
  public disabledLayers: any = [];
  public ultimateLockTooltip: any;
  constructor(
    private eventService: PubSubService,
    private mainService: MainService,
    public removeObjectService: RemoveObjectService,
    public rightPanelService: RightPanelService
  ) { }


  ngOnInit() {
    this.initData();
    this.subscribeEvents();
  }

  /**
   * will be called each time object is CRUD
   */
  initData() {
    this.disableCrop = (this.enableCropper() === true) ? false : true;
    this.rightPanelService.manageFlagForEnableDisable();
    this.rightPanelService.checkForLayers();
    this.disableDuplicate();
  }

  /**
   * Check if active image is of type image and active image is not svg image, then return true, false otherwise
   */
  enableCropper(): boolean {
    let activeObj = this.rightPanelService.canvasService.getActiveObject();
    return (activeObj && activeObj.objType == 'image' && activeObj.isSvg == false && activeObj.ultimatelock != true);
  }

  /*Enable tooltip*/
  enableTooltip(obj, isCanvas: boolean = false) {
    let self = this;
    let tabId: any = '';
    if (isCanvas) {
      tabId = obj.tabId;
    } else {
      tabId = ((obj.tab == "text") ? "1" : ((obj.tab == "clipart") ? "2" : ((obj.tab == "upload") ? "3" : '')));
    }
    if (tabId != "") {
      let getIndx = Object.keys(this.mainService.getAllTabs).indexOf(tabId);
      let tootltipObj = this.mainService.getAllTabs[getIndx + 1];
      let tootltipData: any = [];
      if (tootltipObj.second_tooltip != null) {
        tootltipData.push({ element: ".byi-right-panel", intro: tootltipObj.second_tooltip, position: 'right' });
        this.mainService.processToolTip(tootltipData, true);
        this.mainService.isToolTipEnable = false;
      } else {
        setTimeout(function () { introJs().exit(); self.mainService.isToolTipEnable = false; }, 10000);
      }
    }
  }

  changeTooltip(obj) {
    if (obj != "") {
      this.ultimateLockTooltip = (obj.ultimatelock == true) ? "Ultimate Unlock" : "Ultimate Lock";
    }
  }

  applyClassForUltimateLock(obj) {
    if (obj != "") {
      this.ultimateLockClass = (obj.ultimatelock == true) ? true : false;
    }
  }

  /**
   * Subscribe events and perform action here
   */
  subscribeEvents() {
    this.eventService.$sub('objectSelectionCreated', (obj) => {
      if (this.mainService.isToolTipEnable) {
        this.enableTooltip(obj);
      }
      this.initData();
      this.changeTooltip(obj);
      if (this.mainService.isAdmin == true) {
        this.applyClassForUltimateLock(obj);
      }
    });
    this.eventService.$sub('backgroundPatternsApplied', (canvas) => {
      if (this.mainService.isToolTipEnable == true) {
        canvas.tabId = '8';
        this.enableTooltip(canvas, true);
      }
    });
    this.eventService.$sub('backgroundPatternsUpdate', (canvas) => {
      if (this.mainService.isToolTipEnable == true) {
        canvas.tabId = '8';
        this.enableTooltip(canvas, true);
      }
    });
    this.eventService.$sub('objectSelectionUpdated', (obj) => {
      this.initData();
      if (this.mainService.isAdmin == true) {
        this.applyClassForUltimateLock(obj);
      }
    });
    this.eventService.$sub('objectSelectionCleared', () => {
      this.initData();
      this.ultimateLockClass = false;
    });
    this.eventService.$sub('objectUpdated', (obj) => {
      this.initData();
      this.changeTooltip(obj);
    });
    this.eventService.$sub('canvasObjectModified', () => {
      this.rightPanelService.checkForLayers();
    });
    this.eventService.$sub('closeSideBar', () => {
      this.isOpenClass = false;
    });
  }

  /**
   * Best fit object
   */
  bestFitObject() {
    // get current selected canvas object
    let obj = this.rightPanelService.canvasService.getActiveObject();

    // if object not found or object is angled, return from here and set the flag for the same
    if (!obj) return;

    // if not, then prepare best fit obj, filter it and store into local variable
    // let bestFitProperties = this.rightPanelService.canvasService.filterBestFitProperties(this.rightPanelService.canvasService.getBestFitProperties(), obj);
    let bestFitProperties = this.rightPanelService.canvasService.getBestFitProperties();

    bestFitProperties = Object.assign(bestFitProperties, { selectThisObject: false });
    // update that obj to current canvas obj
    let params = {
      obj: obj,
      properties: bestFitProperties,
      crudServiceString: 'this.bestFitObjectService',
      setActive: false
    };
    this.rightPanelService.canvasService.objectCRUD(params);
  }


  cropImage() {
    if (this.disableCrop === true) return;
    let obj = this.rightPanelService.canvasService.getActiveObject(), img = decodeURI(obj.getSrc());
    this.cropper.cropImage(img);
  }


  lockObject() {
    let objs = this.rightPanelService.canvasService.currentCanvas.getActiveObjects();
    let _this = this;
    objs.forEach(function (object, index) {
      _this.lockObjects(objs[index]);
    });
  }


  lockObjects(obj) {
    let properties;
    if (obj.selectable == false) {
      properties = { selectable: true };
    } else {
      properties = { selectable: false };
    }
    if (obj) {
      this.rightPanelService.canvasService.currentCanvas.discardActiveObject();

      let params = {
        obj: obj,
        properties: properties,
        crudServiceString: 'this.updateObjectService',
      };
      this.rightPanelService.canvasService.objectCRUD(params);
    }
  }

  setAlignment(option, obj = null) {
    let canvas = this.rightPanelService.canvasService.currentCanvas;
    let canvasService = this.rightPanelService.canvasService;
    let objects = canvas.getActiveObjects();
    if (objects && objects.length > 1 && obj == null) {
      this.alignMultipleObjects(objects, option);
      return;
    }
    obj = (obj == null) ? canvas.getActiveObject() : obj;
    let properties = {};
    let _this = this,
      eventParam = {
        option: option,
        newVal: null,
      };
    if (obj) {
      if (option == "left") {
        let left = this.rightPanelService.canvasService.clipX[canvas.designarea_id] / 2;
        if (obj.originX == 'center') {
          left += obj.width / 2;
        }
        properties = { left: left };
        eventParam.newVal = left;
        obj.setCoords();
      } else if (option == "right") {
        let right = (canvas.width - (this.rightPanelService.canvasService.clipX[canvas.designarea_id] / 2)) - obj.getBoundingRect().width;
        if (obj.originX == 'center') {
          right += obj.width / 2;
        }
        properties = { left: right };
        eventParam.newVal = right;
        obj.setCoords();
      } else if (option == "top") {
        let top = (this.rightPanelService.canvasService.clipY[canvas.designarea_id] / 2) + 1;
        if (obj.originY == 'center') {
          top += obj.height / 2;
        }
        properties = { top: top };
        eventParam.newVal = top;
        obj.setCoords();
      } else if (option == "bottom") {
        let bottom = (canvas.height - (this.rightPanelService.canvasService.clipY[canvas.designarea_id] / 2)) - obj.getBoundingRect().height;
        if (obj.originY == 'center') {
          bottom += obj.height / 2;
        }
        properties = { top: bottom };
        eventParam.newVal = bottom;
        obj.setCoords();
      } else if (option == "alignHorizontalCenter") {
        let poscenter = canvas.width / 2;
        if (obj.originX != 'center') {
          poscenter -= (obj.width * obj.scaleX / 2);
        }
        properties = { left: poscenter };
        eventParam.newVal = poscenter;
      } else if (option == "alignVerticalCenter") {
        let posmiddle = canvas.height / 2;
        if (obj.originY != 'center') {
          posmiddle -= (obj.height * obj.scaleY / 2);
        }
        properties = { top: posmiddle };
        eventParam.newVal = posmiddle;
      }
      let params = {
        obj: obj,
        properties: properties,
        crudServiceString: 'this.updateObjectService',
      };
      this.rightPanelService.canvasService.objectCRUD(params);
      this.eventService.$pub('alignment', eventParam);
    }
  }


  alignMultipleObjects(allObjects, alignment) {

    // prepare variables
    let objToBeCompared = null, newValue = null, mainMargin, currentMargin, params = {
      obj: [],
      properties: [],
      crudServiceString: 'this.multipleObjectsUpdateService',
      selectedObjs: allObjects
    }, objs = [], properties = [], canvas = this.rightPanelService.canvasService.currentCanvas;

    this.rightPanelService.canvasService.deselectAllObjects();

    // horizontal/vertical alignment object wise
    if (alignment == 'alignHorizontalCenter' || alignment == 'alignVerticalCenter') {
      // this.mainService.canvasService.deselectAllObjects();
      allObjects.filter(currObj => {
        if (alignment == "alignHorizontalCenter") {
          let poscenter = canvas.width / 2;
          if (currObj.originX != 'center') {
            poscenter -= (currObj.width * currObj.scaleX / 2);
          }
          objs.push(currObj);
          properties.push(Object.assign({}, { left: poscenter }));
        } else if (alignment == "alignVerticalCenter") {
          let posmiddle = canvas.height / 2;
          if (currObj.originY != 'center') {
            posmiddle -= (currObj.height * currObj.scaleY / 2);
          }
          objs.push(currObj);
          properties.push(Object.assign({}, { top: posmiddle }));
        }
        // this.setAlignment(alignment, currObj);
      });
      // this.eventService.$pub('selectThisObjects', allObjects);
    }

    // if alignment option value is right
    else if (alignment == 'right') {
      objToBeCompared = this.rightPanelService.findObjMargin(allObjects, true);
      mainMargin = objToBeCompared.width * objToBeCompared.scaleX;
      allObjects.filter(currObj => {
        if (currObj.id != objToBeCompared.id) {
          currentMargin = currObj.width * currObj.scaleX;
          newValue = objToBeCompared.left + (mainMargin - currentMargin);
          objs.push(currObj);
          properties.push(Object.assign({}, { left: newValue }));
        }
      });
    }

    // if alignment option value is left
    else if (alignment == 'left') {
      objToBeCompared = this.rightPanelService.findObjMargin(allObjects);
      allObjects.filter(currObj => {
        if (currObj.id != objToBeCompared.id) {
          objs.push(currObj);
          properties.push(Object.assign({}, { left: objToBeCompared.left }));
        }
      });
    }

    // if alignment option value is top
    else if (alignment == 'top') {
      objToBeCompared = this.rightPanelService.findObjMargin(allObjects, false, "top");
      allObjects.filter(currObj => {
        if (currObj.id != objToBeCompared.id) {
          objs.push(currObj);
          properties.push(Object.assign({}, { top: objToBeCompared.top }));
        }
      });
    }

    // if alignment option value is bottom
    if (alignment == 'bottom') {
      objToBeCompared = this.rightPanelService.findObjMargin(allObjects, true, "top");
      mainMargin = objToBeCompared.height * objToBeCompared.scaleY;
      allObjects.filter(currObj => {
        if (currObj.id != objToBeCompared.id) {
          currentMargin = currObj.height * currObj.scaleY;
          newValue = objToBeCompared.top + (mainMargin - currentMargin);
          objs.push(currObj);
          properties.push(Object.assign({}, { top: newValue }));
        }
      });
    }
    // 
    if (objs.length && properties.length) {
      params.obj = objs;
      params.properties = properties;
      params = Object.assign(params, { objsToSelect: allObjects });
      this.rightPanelService.canvasService.objectCRUD(params);
    }
  }

  copyObject() {

    // prepare variables
    let activeObjs = this.rightPanelService.canvasService.currentCanvas.getActiveObjects(), properties: any = {}, params: any = {},
      left, top, activeGroup = this.rightPanelService.canvasService.currentCanvas.getActiveObject(),
      clonedObjs = [];

    // if no active object found, return
    if (!activeObjs || !activeObjs.length) return;

    // clone each object one by one and 
    // add the same to canvas
    let preventObject: boolean = false;
    activeObjs.filter((selectedObj, index) => {
      selectedObj.clone((clonedObj) => {
        
        preventObject = false;
       
        if(this.rightPanelService.canvasService.checkObjectLimitByTabName(selectedObj.tab) == true) {
          let errorEventName = (selectedObj.tab == 'text') ? 'displayTextLimitError' : ((selectedObj.tab == 'clipart') ? 'displayClipartLimitError' : 'displayUploadImageLimitError');
          this.eventService.$pub(errorEventName);
          preventObject = true;
        }

        if (selectedObj.type == 'textbox') {
          preventObject = true;
        }

        if (!preventObject) {
          left = selectedObj.left;
          top = selectedObj.top;
          left = (index == 0 && activeObjs.length > 1) ? left + (activeGroup.width / 2) + activeGroup.left : left;
          top = (index == 0 && activeObjs.length > 1) ? top + (activeGroup.height / 2) + activeGroup.top : top;
          properties = {
            left: left + 10,
            top: top + 10,
            objType: selectedObj.objType,
            tab: selectedObj.tab,
            ignoreBestFit: true,
            src: selectedObj.src
          };
          properties = (selectedObj.objType == 'image') ? properties = Object.assign(properties, { isSvg: selectedObj.isSvg }) : properties;
          params = {
            obj: clonedObj,
            properties: properties,
            crudServiceString: 'this.insertObjectService'
          };
          this.rightPanelService.canvasService.objectCRUD(params);
          clonedObjs.push(clonedObj);
        }
      });
    });

    // reseselect all objects after few seconds    
    setTimeout(() => {
      if (clonedObjs.length > 1) {
        this.eventService.$pub('selectThisObjects', clonedObjs);
      }
    }, 100);
  }

  /**
   * Disable duplicate if no object selected
   * or selected object is of type name number
   */
  disableDuplicate() {
    if (!this.rightPanelService.mainService.canvasService.currentCanvas) return true;
    let disable: boolean = false,
      selectedObjs = this.rightPanelService.mainService.canvasService.currentCanvas.getActiveObjects();
    if (this.rightPanelService.disableForSingleObj) {
      disable = true;
    } else if (selectedObjs && selectedObjs.length > 0) {
      let isNameNumberObjExists;
      isNameNumberObjExists = selectedObjs.find(currObj => (currObj.hasOwnProperty('addObj') && (currObj.addObj == 'name' || currObj.addObj == 'number')));
      disable = (isNameNumberObjExists) ? true : false;
    }

    if (selectedObjs.length == 1 && selectedObjs[0].type == 'textbox') {
      disable = true;
    }
    return disable;
  }

}
