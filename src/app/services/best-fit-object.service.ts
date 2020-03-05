import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BestFitObjectService {

  constructor() { }

  public init = function (params) {
    let obj = params.obj,
      bestFitProperties = params.properties,
      canvasService = params.service,
      isCenter = true,
      eventService = params.eventService,
      currentCanvas = (params.hasOwnProperty('canvas')) ? params.canvas : canvasService.currentCanvas,
      setActiveObject = (params.hasOwnProperty('setActive')) ? params.setActive : true;

    // if no object is passed, we will get active object
    if (obj == null) obj = canvasService.getActiveObject();

    // if no active object found, return from here
    if (obj == false) return;

    // fetch object's current property in array
    let oldProperties: any = {};

    for (let key in bestFitProperties) {
      if (Array.isArray(obj)) {
        oldProperties[key] = obj[0][key] * obj[0].scaleX;
      } else {
        oldProperties[key] = obj[key] * obj.scaleX;
      }
    }

    let currentAlignment = (Array.isArray(obj)) ? obj[0].textAlign : obj.textAlign;
    let left = (Array.isArray(obj)) ? obj[0].left : obj.left;
    let top = (Array.isArray(obj)) ? obj[0].top : obj.top;
    let scaleX = (Array.isArray(obj)) ? obj[0].scaleX : obj.scaleX;
    let scaleY = (Array.isArray(obj)) ? obj[0].scaleY : obj.scaleY;
    oldProperties = Object.assign(oldProperties, { textAlign: currentAlignment });
    oldProperties = Object.assign(oldProperties, { left: left });
    oldProperties = Object.assign(oldProperties, { top: top });
    oldProperties = Object.assign(oldProperties, { scaleX: scaleX });
    oldProperties = Object.assign(oldProperties, { scaleY: scaleY });

    return {
      /**
       * this function is used when special operation needs to be performed on objects(eg. bold/italic on text)
       * 
       */
      exec() {
        // if no active object found, return from here
        if (obj == false) return;
        if (obj.hasOwnProperty('_objects') && obj._objects.length && !obj.hasOwnProperty('objType')) {
          eventService.$pub("selectThisObjects", obj._objects);
          obj = canvasService.currentCanvas.getActiveObject();
        }

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
            break;
        }
        // finally update the canvas object
        currentCanvas.calcOffset();
        setTimeout(() => {
          obj.center();
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
        // if no canvas is selected
        if (!canvas) {
          return;
        }
        // return of obj is null
        if (!obj) return;

        // if (obj.hasOwnProperty('_objects') && obj._objects.length) {
        //   eventService.$pub('selectThisObjects', obj._objects);
        // }

        // if no canvas is selected
        let objType = obj.objType;

        // Check object type and perform operation accordingly
        switch (objType) {

          // in case of image, we will scale to best fit and remove height and width from property object
          case 'image':
            obj.scaleToHeight(oldProperties.height);
            obj.scaleToWidth(oldProperties.width);
            delete oldProperties.height;
            delete oldProperties.width;
            break;

          // in case of text, we will calculate scaleX and scaleY and remove top and left from property object
          case 'text':
          default:
            obj = Object.assign(obj, {
              scaleX: (oldProperties.width / obj.width),
              scaleY: (oldProperties.height / obj.height)
            });
            break;
        }
        delete oldProperties.height;
        delete oldProperties.width;
        for (let prop in oldProperties) {
          obj[prop] = oldProperties[prop];
        }
        // finally update the canvas object
        currentCanvas.calcOffset();
        setTimeout(() => {
          currentCanvas.renderAll();
          // Publish an event when new object is updated
          eventService.$pub('objectUpdated', obj);
        }, 50);
      }
    };
  }
}
