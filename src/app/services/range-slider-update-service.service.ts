import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RangeSliderUpdateServiceService {
  constructor() {
  }
  /**
   * Init the service for operation : It initialise the variables
   */
  public init = function (params) {
    let selectedObj = params.obj,
      properties = params.properties,
      canvasService = params.service,
      redoStack = {},
      eventService = params.eventService,
      selectedObjs = params.hasOwnProperty('selectedObj') ? params.selectedObj : [],
      setActive = params.hasOwnProperty('setActive') ? params.setActive : false;

    // if no object is passed, we will get active object
    if (selectedObj == null) selectedObj = canvasService.getActiveObject();

    // if no active object found, return from here
    if (selectedObj == false) return;

    return {
      /**
       * this function is used when special operation needs to be performed on objects(eg. bold/italic on text)
       * 
       */
      exec() {
        // if no active object found, return from here
        if (selectedObj == false) return;

        if (redoStack && Object.keys(redoStack).length > 0) {
          for (let key in redoStack) {
            if (Array.isArray(selectedObj)) {
              selectedObj.filter(currObj => currObj[key] = redoStack[key]);
            } else {
              selectedObj[key] = redoStack[key];
            }
          }
          // 
          for (let key in properties) {
            redoStack[key] = properties[key];
          }
          canvasService.currentCanvas.renderAll();
          // if (selectedObjs && selectedObjs.length) canvasService.deselectAllObjects();
          // if (selectedObjs && selectedObjs.length) eventService.$pub('selectThisObjects', selectedObjs);
          if(Array.isArray(selectedObj)) {
            canvasService.deselectAllObjects();
            eventService.$pub('selectThisObjects', selectedObj);
          }
          eventService.$pub('objectUpdated', selectedObj);
        }
      },

      /**
       * This function is used to revert back the last updated object while using undo redo
       */
      unexec() {
        let canvas = canvasService.currentCanvas;
        // if no canvas is selected
        if (!canvas) {
          return;
        }

        // return of obj is null
        if (!selectedObj) return;

        // if no canvas is selected
        if (!canvas) {
          return;
        }

        if (selectedObj && selectedObj.length) canvasService.deselectAllObjects();
        // 
        // redoStack = Object.assign({}, properties);

        // 
        for (let key in properties) {
          redoStack[key] = (Array.isArray(selectedObj)) ? selectedObj[0][key] : selectedObj[key];
        }

        // 
        if (Array.isArray(selectedObj)) {
          selectedObj.filter(obj => {
            obj = Object.assign(obj, properties);
          });
        } else {
          selectedObj = Object.assign(selectedObj, properties);
        }
        if (setActive && !Array.isArray(selectedObj)) canvasService.currentCanvas.setActiveObject(selectedObj);
        canvasService.currentCanvas.renderAll();
        if (Array.isArray(selectedObj)) eventService.$pub('selectThisObjects', selectedObj);
        eventService.$pub('objectUpdated', selectedObj);
      }
    };
  }
}
