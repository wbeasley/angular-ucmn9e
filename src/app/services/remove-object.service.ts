import {Injectable} from '@angular/core';
declare var fabric: any;
@Injectable({
    providedIn: 'root'
})
export class RemoveObjectService {

    constructor() {
    }

    /**
     * Remove selected/any object from canvas
     */
     public init = function (params) {
        let obj = params.obj,
        properties = params.properties,
        canvasService = params.service,
        isCenter = params.hasOwnProperty('isCenter') ? params.isCenter : true,
        isSvg = params.hasOwnProperty('isSvg') ? params.isSvg : false,
        canvas = params.hasOwnProperty('canvas') ? params.canvas : canvasService.currentCanvas,
        eventService = params.eventService,
        removeUltimateObj = params.hasOwnProperty('removeUltimateObj') ? params.removeUltimateObj : false;

        // if no object is passed, we will get active object
        if (obj == null) obj = canvasService.getActiveObject();
        return {
            /**
   * After initializing each fabric object, this method is called to apply->insert the same on canvas
   * 
   */
   exec: function () {
    if (obj == false) return;

                // remove the object and render
                if (Array.isArray(obj)) {
                    for (let i in obj) {
                        if(obj[i].ultimatelock != true || removeUltimateObj == true){
                            canvas.remove(obj[i]).renderAll();
                        }
                    }
                } else {
                    if(obj.ultimatelock != true || removeUltimateObj == true){
                        canvas.remove(obj).renderAll();
                    }
                }

                canvas.discardActiveObject();

                // render current canvas
                canvas.renderAll();

                // publish an event when object is removed
                eventService.$pub('objectRemoved', obj);
            },
            /**
            * This method will add the object on canvas
            */
            unexec() {
                if (!obj) return;

                // if no canvas is selected
                if (!canvas) {
                    return;
                }
                if (Array.isArray(obj) && obj.length == 1) {
                    obj = obj[0];
                }
                if (Array.isArray(obj)) {
                    for (let i in obj) {
                        canvas.add(obj[i]).renderAll();
                        obj[i].setCoords();
                    }
                    // set group objects as active
                    var sel = new fabric.ActiveSelection(obj, {
                        canvas: canvas,
                    });
                    canvas.setActiveObject(sel);
                } else {
                    canvas.add(obj).renderAll();
                    obj.setCoords();

                    // set current object as active
                    canvas.setActiveObject(obj);
                }

                // render current canvas
                canvas.renderAll();

                // Publish an event when new object is added
                eventService.$pub('objectAdded', obj);
            }
        }
    }
}
