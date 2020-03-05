import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SvgColorUpdateService {

  constructor() { }
  public init = function (params) {
    let selectedObj = params.obj,
      oldSvgColors = [],
      properties = params.properties,
      canvasService = params.service,
      canvas = (params.hasOwnProperty('canvas')) ? params.canvas : canvasService.currentCanvas,
      eventService = params.eventService;

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
        selectedObj.filter(obj => {
          if (obj && obj.objType == 'image' && obj.isSvg) {
            obj._objects.forEach((data) => {
              if (data.fill && properties['old_fill'] == data.fill) {
                var randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
                var uniqid = randLetter + Date.now();
                data = Object.assign(data, { uniqId: uniqid });
                oldSvgColors.push(Object.assign({}, data));
                data.set({ fill: properties['fill'] });
              }
            });
          }
        });
        canvas.renderAll();
        eventService.$pub('objectUpdated', selectedObj);
      },
      /**
       * This function is used to revert back the last updated object while using undo redo
       */
      unexec() {
        // if no canvas is selected
        if (!canvas) {
          return;
        }
        // return of obj is null
        if (!selectedObj) return;

        // 
        if (!oldSvgColors || !oldSvgColors.length) {
          return;
        }
        selectedObj.filter(obj => {
          if (obj && obj.objType == 'image' && obj.isSvg) {
            obj._objects.filter(o => {
              var tmp = oldSvgColors.find(colorObj => (o.hasOwnProperty('uniqId') && o.uniqId == colorObj.uniqId));
              if (tmp) {
                properties['fill'] = o.fill;
                o.set({ fill: tmp.fill });
              }
            });
          }
        });

        canvas.renderAll();
        eventService.$pub('objectUpdated', selectedObj);
      }
    };
  }
}
