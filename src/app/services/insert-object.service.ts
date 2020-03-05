import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class InsertObjectService {
    constructor() {
    }
    /**
    * initializing each fabric object
    * 
    * @param obj object to be added on canvas
    * @param properties object properties
    * @param isCenter flag variable that will indicate whether to centeralize the new object on canvas
    */

    public init = function (params) {
        var obj = params.obj,
        properties = params.properties,
        canvasService = params.service,
        isCenter = params.hasOwnProperty('isCenter') ? params.isCenter : true,
        canvas = params.canvas ? params.canvas : canvasService.currentCanvas,
        setActive = params.hasOwnProperty('setActive') ? params.setActive : true,
        eventService = params.eventService;

        obj.scaleFactor = canvasService.scaleFactor;
        if (!properties.id) {
            properties.id = 'id_' + Date.now();
        }
        properties.canvasWidth = canvas.width;
        properties.canvasHeight = canvas.height;
        properties.imageDesignId = '@' + canvas.image_id + '&' + canvas.designarea_id;

        // Center Scaling for object
        properties.centeredScaling = true;

        //When set to `true`, object's cache will be rerendered next render call.
        properties.dirty = true;
        properties.noScaleCache = false;
        properties.objectCaching = false;

        if (properties.objType && properties.objType == 'image' && !properties.ignoreBestFit) {

            // best fit properties
            let bestFitProperties = canvasService.getBestFitProperties(obj);

            // before filtering best fir object, we need to assign objType to current obj
            obj.objType = properties.objType;

            // filter properties
            bestFitProperties = canvasService.filterBestFitProperties(bestFitProperties, obj);
        }

        // set properties to current obj
        obj.set(properties);

        obj.isCenter = isCenter;

        return {
            /**
            * After initializing each fabric object, this method is called to apply->insert the same on canvas
            *
            */
            exec: function () {
                // return of obj is null
                if (!obj) return;

                // if no canvas is selected
                if (!canvas) {
                    return;
                }
                eventService.$pub('objectAddedBefore', obj);
                // add obj to current canvas and render the same
                canvas.add(obj);

                // set coordinates
                obj.setCoords();

                // if isCenter flag is true, centeralize the obj
                if (obj.isCenter === true) obj.center();

                // set current object as active
                var allCanvas = canvasService.containerCanvases;
                for (var key in allCanvas) {
                    allCanvas[key].discardActiveObject().renderAll();
                }
                canvasService.currentCanvas = canvas;

                // set object as selected
                if(obj.selectable != false && setActive){
                    canvas.setActiveObject(obj);
                }

                // render current canvas
                canvas.renderAll();

                // Publish an event when new object is added
                eventService.$pub('objectAdded', obj);

            },
            /**
            * This method will remove the object from canvas
            */
            unexec: function () {
                if (!obj) return;

                // if no canvas is selected
                if (!canvas) {
                    return;
                }
                canvas.remove(obj).renderAll();

                // publish an event when object is removed
                eventService.$pub('objectRemoved', obj);
            },
        };
    };

}
