import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CropperUpdateService {

  constructor() {
  }
  /**
   * Init the service for operation : It initialise the variables
   */
  public init = function (params) {
    let obj = params.obj,
      newSrc = params.newSrc,
      canvasService = params.service,
      eventService = params.eventService;

    // if no object is passed, we will get active object
    if (obj == null) obj = canvasService.getActiveObject();

    // if no active object found, return from here
    if (obj == false) return;

    // if (isCenter === true) obj.center();

    // fetch object's current property in array
    let oldSrc = obj.getSrc();

    return {
      /**
       * this function is used when special operation needs to be performed on objects(eg. bold/italic on text)
       * 
       */
      exec() {
        // if no active object found, return from here
        if (obj == false) return;

        obj.setSrc(newSrc, () => {
          canvasService.currentCanvas.renderAll();
          eventService.$pub('imageCropped');
        });

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
        if (!obj) return;

        // if no canvas is selected
        if (!canvas) {
          return;
        }
        obj.setSrc(oldSrc, () => {
          canvasService.currentCanvas.renderAll();
          eventService.$pub('objectUpdated', obj);
        });
      }
    };
  }
}
