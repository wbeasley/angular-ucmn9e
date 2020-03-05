import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MultipleObjectsStateUndoRedoService {

  constructor() { }

  public init = function (params) {
    let obj = params.obj,
      properties = params.properties,
      canvasService = params.service,
      eventService = params.eventService,
      currentCanvas = (params.hasOwnProperty('canvas')) ? params.canvas : canvasService.currentCanvas,
      scaleXArr = [],
      scaleYArr = [],
      angleArr = [];

    // if no object is passed, we will get active object
    if (obj == null) obj = canvasService.getActiveObject();

    // if no active object found, return from here
    if (obj == false) return;

    let oldProperties: any = {};
    for (let key in properties) {
      if (key == 'scaleX' || key == 'scaleY' || key == 'angle') {
        let stateProperties: any = null;
        let allObjects = canvasService.getObjects(currentCanvas), tmpObj;
        obj._objects.filter(o => {
          tmpObj = allObjects.find(obj => obj == o);
          if (tmpObj) {
            stateProperties = Object.assign({}, tmpObj._stateProperties);
            if (key == 'scaleX') {
              scaleXArr.push(stateProperties.scaleX);
            } else if (key == 'scaleY') {
              scaleYArr.push(stateProperties.scaleY);
            } else if (key == 'angle') {
              // if (tmpObj.angle) {
              angleArr.push({ angle: tmpObj.angle, left: tmpObj.left, top: tmpObj.top });
              // } else {
              //   angleArr.push({ angle: stateProperties.angle, left: stateProperties.left, top: stateProperties.top });
              // }
            }
          }
        });
      }
      oldProperties[key] = properties[key];
    }

    properties = [];

    return {
      /**
       * this function is used when special operation needs to be performed on objects(eg. bold/italic on text)
       * 
       */
      exec() {
        let canvas = currentCanvas;

        // if no canvas is selected
        if (!canvas) {
          return;
        }

        // if no active object found, return from here
        if (obj == false) return;

        let activeObj = canvas.getActiveObject();
        if (activeObj != obj && obj.hasOwnProperty('_objects') && obj._objects.length) {
          eventService.$pub('selectThisObjects', obj._objects);
          obj = canvas.getActiveObject();
        }

        for (let key in properties) {
          let property = properties[key];
          let functionName = key.charAt(0).toUpperCase() + key.substr(1);
          if (typeof obj['set' + functionName] == 'function') {
            obj['set' + functionName](property);
          } else {
            obj[key] = property;
          }
        }

        canvas.renderAll();
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

        // if no canvas is selected
        if (!canvas) {
          return;
        }

        // canvas.setActiveObject(obj).requestRenderAll();
        let activeObj = canvas.getActiveObject();
        if (activeObj != obj) {
          for (let key in oldProperties) {
            properties[key] = obj[key];
            if (key == 'angle' || key == 'scaleX' || key == 'scaleY') {
              let val;
              obj._objects.filter((o, index) => {
                if (key == 'angle') {
                  val = angleArr[index].angle;
                  o.left = angleArr[index].left;
                  o.top = angleArr[index].top;
                } else if (key == 'scaleX') {
                  val = scaleXArr[index];
                } else if (key == 'scaleY') {
                  val = scaleYArr[index];
                }
                o[key] = val;
              });
            }
          }
          eventService.$pub('selectThisObjects', obj._objects);
          obj = canvas.getActiveObject();
        } else {
          for (let key in oldProperties) {
            properties[key] = obj[key];
          }
        }

        for (let key in oldProperties) {
          let property = oldProperties[key];
          let functionName = key.charAt(0).toUpperCase() + key.substr(1);
          if (typeof obj['set' + functionName] == 'function') {
            obj['set' + functionName](property);
          } else {
            obj[key] = property;
          }
        }

        canvas.renderAll();
      }
    };
  }
}
