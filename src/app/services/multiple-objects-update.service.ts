import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MultipleObjectsUpdateService {

  constructor() { }

  public init = function (params) {
    let obj = params.obj,
      properties = params.properties,
      canvasService = params.service,
      isCenter = params.hasOwnProperty('isCenter') ? params.isCenter : false,
      isSVG = params.hasOwnProperty('isSvg') ? params.isSvg : false,
      isObjectModify = params.hasOwnProperty('isObjectModify') ? params.isObjectModify : false,
      eventService = params.eventService,
      currentCanvas = (params.hasOwnProperty('canvas')) ? params.canvas : canvasService.currentCanvas,
      setActiveObject = (params.hasOwnProperty('setActive')) ? params.setActive : true,
      selectedObjs = (params.selectedObjs) ? params.selectedObjs : [];

    // if no object is passed, we will get active object
    if (obj == null) obj = canvasService.getActiveObject();

    // if no active object found, return from here
    if (obj == false) return;

    // fetch object's current property in array
    let oldProperties = [];

    for (let i in properties) {
      oldProperties[i] = {};
      for (let key in properties[i]) {
        if (Array.isArray(obj)) {
          oldProperties[i][key] = obj[i][key];
        } else {
          oldProperties[i][key] = obj[key];
        }
      }
    }

    return {
      /**
       * this function is used when special operation needs to be performed on objects(eg. bold/italic on text)
       * 
       */
      exec() {
        // if no active object found, return from here
        if (obj == false) return;

        if (selectedObjs.length > 1 && setActiveObject) {
          currentCanvas.discardActiveObject().renderAll();
        }

        // set properties to current object       
        if (Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i++) {
            for (let key in properties[i]) {
              let property = properties[i][key];
              let functionName = key.charAt(0).toUpperCase() + key.substr(1);
              if (typeof obj[i]['set' + functionName] == 'function') {
                obj[i]['set' + functionName](property);
              } else {
                obj[i][key] = property;
              }
            }
            obj[i].dirty = true;
            if (obj[i].selectable)
              if (isCenter === true) obj[i].center();
            obj[i].setCoords();
          }
          if (setActiveObject) currentCanvas.setActiveObject(obj[0]);
        } else {
          for (let i in properties) {
            for (let key in properties[i]) {
              let property = properties[i][key];
              let functionName = key.charAt(0).toUpperCase() + key.substr(1);
              if (typeof obj['set' + functionName] == 'function') {
                obj['set' + functionName](property);
              } else {
                obj[key] = property;
              }
            }
          }
          obj.dirty = true;
          if (isCenter === true) obj.center();
          obj.setCoords();
        }

        if (selectedObjs.length > 1 && setActiveObject) {
          eventService.$pub('selectThisObjects', selectedObjs);
        }
        // finally update the canvas object
        currentCanvas.calcOffset();
        setTimeout(() => {
          currentCanvas.renderAll();
          // Publish an event when new object is updated
          eventService.$pub('objectUpdated', obj);
        }, 50);

      },
      /**
       * This function is used to revert back the last updated object while using undo redo
       */
      unexec() {
        let canvas = currentCanvas;
        if (selectedObjs.length > 1) {
          canvas.discardActiveObject().renderAll();
        }
        // if no canvas is selected
        if (!canvas) {
          return;
        }
        // return of obj is null
        if (!obj) return;

        // if no canvas is selected
        if (!canvas) {
          return;
        }

        // set properties to current object from undoPropertiesStack
        if (Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i++) {
            for (let key in oldProperties[i]) {
              let property = oldProperties[i][key];
              let functionName = key.charAt(0).toUpperCase() + key.substr(1);
              if (typeof obj[i]['set' + functionName] == 'function') {
                obj[i]['set' + functionName](property);
              } else {
                obj[i][key] = property;
              }
            }
            obj[i].setCoords();
            obj[i].dirty = true;
          }
        } else {
          for (let i in oldProperties) {
            for (let key in oldProperties[i]) {
              let property = oldProperties[i][key];
              let functionName = key.charAt(0).toUpperCase() + key.substr(1);
              if (typeof obj['set' + functionName] == 'function') {
                obj['set' + functionName](property);
              } else {
                obj[key] = property;
              }
            }
          }
          obj.setCoords();
          obj.dirty = true;
        }

        // finally update the canvas object
        if (selectedObjs.length > 1) {
          eventService.$pub('selectThisObjects', selectedObjs);
        }
        setTimeout(() => {
          currentCanvas.renderAll();
          eventService.$pub('objectUpdated', obj);
        }, 50);

      }
    };
  }
}
