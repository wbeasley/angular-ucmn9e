import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ObjectPositionUpdateService {

  constructor() { }

  public init = function (params) {
    let selectedObj = params.obj,
      newProperties = params.properties,
      oldProperties = [],
      canvasService = params.service,
      enableRedo = false,
      eventService = params.eventService,
      selectedObjs = params.hasOwnProperty('selectedObj') ? params.selectedObj : [];

    // if no object is passed, we will get active object
    if (selectedObj == null) selectedObj = canvasService.getActiveObject();

    // if no active object found, return from here
    if (selectedObj == false) return;

    // 
    let tmpValue = null;
    if (newProperties && newProperties.length) {
      newProperties.filter((property, index) => {
        oldProperties[index] = {};
        for (let key in property) {
          tmpValue = selectedObj[index][key];
          if (key == 'left') tmpValue = selectedObj[index].prevLeft;
          if (key == 'top') tmpValue = selectedObj[index].prevTop;
          oldProperties[index][key] = tmpValue;
        }
      });
    }

    return {
      /**
       * this function is used when special operation needs to be performed on objects(eg. bold/italic on text)
       * 
       */
      exec() {
        // if no active object found, return from here
        if (selectedObj == false) return;

        if (enableRedo == false) return;
        if (selectedObjs && selectedObjs.length) canvasService.deselectAllObjects();
        if (newProperties && newProperties.length) {
          newProperties.filter((property, index) => {
            for (let key in property) {
              selectedObj[index][key] = property[key];
            }
          });
        }

        canvasService.currentCanvas.renderAll();
        if (selectedObjs && selectedObjs.length) eventService.$pub('selectThisObjects', selectedObjs);
        eventService.$pub('objectUpdated', selectedObj);
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

        // 
        // 
        if (selectedObjs && selectedObjs.length) canvasService.deselectAllObjects();
        if (oldProperties && oldProperties.length) {
          oldProperties.filter((property, index) => {
            for (let key in property) {
              selectedObj[index][key] = property[key];
            }
          });
        }
        enableRedo = true;
        canvasService.currentCanvas.renderAll();
        if (selectedObjs && selectedObjs.length) eventService.$pub('selectThisObjects', selectedObjs);
        eventService.$pub('objectUpdated', selectedObj);
      }
    };
  }
}
