import { CanvasService } from 'src/app/services/canvas.service';
import { MainService } from 'src/app/services/main.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RightPanelService {
  public disabledLayers: any = [];
  public disableForSingleObj: boolean;
  public enableForMultipleObj: boolean;
  public enableUltimateLockFlag : boolean = true;
  constructor(
    public mainService: MainService,
    public canvasService: CanvasService
  ) { }

  manageFlagForEnableDisable() {

    this.disableForSingleObj = (this.enableForSingleObj() === true) ? false : true;
    this.enableForMultipleObj = this.enableForMultipleObject();
  }

  findObjMargin(allObjects, findMax: boolean = false, objKey: any = "left", skipThisObj: any = null) {

    // variable declaration
    let resultObj = allObjects[0], totalObjects = allObjects.length, i = 1, scaleKey, resultObjMargin,
      currentMargin, heightWidthKey, scaledResultObj, scaledCurrentObj;

    // determine values based on params
    scaleKey = (objKey == "left") ? "scaleX" : "scaleY";
    heightWidthKey = (objKey == "left") ? "width" : "height";

    // traverse each object one by one
    for (; i < totalObjects; i++) {

      // skip specified object from comparision
      if (skipThisObj && skipThisObj.hasOwnProperty('id') && skipThisObj.id == allObjects[i].id) continue;

      // prepare left/top obj for both selected and current object
      currentMargin = allObjects[i][objKey];
      resultObjMargin = resultObj[objKey];

      // get scaled height/width
      scaledResultObj = resultObj[heightWidthKey] * resultObj[scaleKey];
      scaledCurrentObj = allObjects[i][heightWidthKey] * allObjects[i][scaleKey];

      // when user clicks on left/top, 
      // all objects will be having same marig
      // in this case we will be checking by their scaled width/height
      if ((currentMargin == resultObjMargin && scaledCurrentObj >= scaledResultObj)) {
        resultObj = allObjects[i];
      }

      // in case of right/bottom
      // we will be checking if current traversing object is having hight marign
      // and scaling than selected one, replace the same
      else if (findMax === true) {
        if ((scaledCurrentObj + currentMargin) >= (scaledResultObj + resultObjMargin)) {
          resultObj = allObjects[i];
        }

        // in case of left/bottom, simple find object having minimum margin
      } else if (findMax === false && currentMargin < resultObjMargin) {
        resultObj = allObjects[i];
      }
    }

    // return object that will be used as flag
    return resultObj;
  }

  checkForLayers() {
    this.disabledLayers = [];
    let activeObj = this.canvasService.getActiveObject();

    if (activeObj == false) return;

    let totalCanvasObjects = Object.keys(this.canvasService.getObjects()).length - 1,
      objStack = this.canvasService.getObjects().indexOf(activeObj);

    if (objStack == 0) {
      this.disabledLayers.push('sendToBack');
    } else if (objStack == totalCanvasObjects) {
      this.disabledLayers.push('bringToFront');
    }
  }

  enableForMultipleObject(): boolean {
    let totalAddedObjects: any = (this.canvasService.currentCanvas && this.canvasService.getObjects()) ? this.canvasService.getObjects().length : 0;
    if (this.enableForSingleObj() === true && totalAddedObjects > 1 && this.canvasService.currentCanvas.getActiveObjects().length == 1) return false;
    return true;
  }

  enableForSingleObj(): boolean {
    let obj = this.canvasService.getActiveObject();
    if (this.mainService.isAdmin == false) {
      if (obj == false || obj.ultimatelock == true) return false;
      return true;
    } else {
      if (obj == false){
        this.enableUltimateLockFlag = true;        
        return false; 
      }else{
        if(obj && obj.ultimatelock == true){          
          this.enableUltimateLockFlag = false;
          return false;
        }else{
          this.enableUltimateLockFlag = true;
          return true;
        }
      }
    }
  }
}
