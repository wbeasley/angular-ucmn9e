import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RightPanelUpdateService {

  public init = function (params) {
    let properties = params.properties,
      option = properties.option,
      selectedObj = params.obj,
      canvasService = params.service,
      eventService = params.eventService;

    return {
      /**
       * this function is used when special operation needs to be performed on objects(eg. bold/italic on text)
       * 
       */
      exec() {
        if (option == "front") {
          canvasService.currentCanvas.bringToFront(selectedObj);
        } else if (option == "back") {
          canvasService.currentCanvas.sendToBack(selectedObj);
        } else if (option == "forward") {
          canvasService.currentCanvas.bringForward(selectedObj);
        } else if (option == "backward") {
          canvasService.currentCanvas.sendBackwards(selectedObj);
        }
        canvasService.currentCanvas.renderAll();
        eventService.$pub('canvasObjectModified', selectedObj);
      },
      unexec() {
        if (option == "front") {
          canvasService.currentCanvas.sendToBack(selectedObj);
        } else if (option == "back") {
          canvasService.currentCanvas.bringToFront(selectedObj);
        } else if (option == "forward") {
          canvasService.currentCanvas.sendBackwards(selectedObj);
        } else if (option == "backward") {
          canvasService.currentCanvas.bringForward(selectedObj);
        }
        canvasService.currentCanvas.renderAll();
        eventService.$pub('canvasObjectModified', selectedObj);
      }
    };
  }
}
