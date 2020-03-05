import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class UpdateObjectService {

    constructor() {
    }
    /**
     * Init the service for operation : It initialise the variables
     */
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
            preventDeselection = (params.hasOwnProperty('preventDeselection')) ? params.preventDeselection : true;

        // if no object is passed, we will get active object
        if (obj == null) obj = canvasService.getActiveObject();

        // if no active object found, return from here
        if (obj == false) return;

        // fetch object's current property in array
        let oldProperties = {};

        if (isSVG == true || isObjectModify) {
            for (let key in properties) {
                oldProperties[key] = properties[key];
            }
        } else {
            for (let key in properties) {
                if (Array.isArray(obj)) {
                    oldProperties[key] = obj[0][key];
                } else {
                    oldProperties[key] = obj[key];
                }
            }
        }

        // If object is modified due to inbuilt fabric property then no updation required
        if (isObjectModify) {
            properties = {};
        }
        return {
            /**
             * this function is used when special operation needs to be performed on objects(eg. bold/italic on text)
             * 
             */
            exec() {
                // if no active object found, return from here
                if (obj == false) return;

                let selectedObjs = canvasService.currentCanvas.getActiveObjects();
                if (selectedObjs.length > 1 && preventDeselection) {
                    // canvasService.deselectAllObjects();
                }

                if (!Array.isArray(obj)) {
                    if (setActiveObject) {
                        currentCanvas.setActiveObject(obj);
                        obj = canvasService.currentCanvas.getActiveObject();
                    }
                }

                // set properties to current object
                if (isSVG) {
                    obj._objects.forEach((data) => {
                        if (data.fill && properties['old_fill'] == data.fill) {
                            data.set({ fill: properties['fill'] });
                        }
                    });
                } else {
                    if (Array.isArray(obj)) {
                        for (let i = 0; i < obj.length; i++) {
                            //obj[i] = Object.assign(obj[i], properties);
                            for (let key in properties) {
                                let property = properties[key];
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
                        for (let key in properties) {
                            let property = properties[key];
                            let functionName = key.charAt(0).toUpperCase() + key.substr(1);
                            if (typeof obj['set' + functionName] == 'function') {
                                obj['set' + functionName](property);
                            } else {
                                obj[key] = property;
                            }
                        }
                        obj.dirty = true;
                        if (isCenter === true) obj.center();
                        if (obj.selectable && setActiveObject)
                            currentCanvas.setActiveObject(obj);
                        obj.setCoords();
                    }

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
                // if no canvas is selected
                if (!canvas) {
                    return;
                }
                // return of obj is null
                if (!obj) return;

                let activeObj = canvas.getActiveObject();
                if (activeObj != obj) {
                    if (obj.hasOwnProperty('tab')) {
                        canvas.setActiveObject(obj).renderAll();
                    } else if (obj.hasOwnProperty('_objects') && obj._objects.length) {
                        eventService.$pub('selectThisObjects', obj._objects);
                    }
                    obj = canvas.getActiveObject();
                }

                if (!obj) return;

                let selectedObjs = canvasService.currentCanvas.getActiveObjects();
                if (selectedObjs.length > 1 && preventDeselection) {
                    // canvasService.deselectAllObjects();
                }

                if (isObjectModify) {
                    for (let key in oldProperties) {
                        properties[key] = obj[key];
                    }
                }
                if (isSVG) {
                    obj._objects.forEach((data) => {
                        if (data.fill && oldProperties['fill'] == data.fill) {
                            data.set({ fill: oldProperties['old_fill'] });
                        }
                    });
                }
                else {
                    // set properties to current object from undoPropertiesStack
                    if (Array.isArray(obj)) {
                        for (let i = 0; i < obj.length; i++) {
                            //obj[i] = Object.assign(obj[i], oldProperties);
                            for (let key in oldProperties) {
                                let property = oldProperties[key];
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
                        if (setActiveObject) currentCanvas.setActiveObject(obj[0]);
                    } else {
                        for (let key in oldProperties) {
                            let property = oldProperties[key];
                            let functionName = key.charAt(0).toUpperCase() + key.substr(1);
                            if (typeof obj['set' + functionName] == 'function') {
                                obj['set' + functionName](property);
                            } else {
                                obj[key] = property;
                            }
                        }
                        obj.setCoords();
                        obj.dirty = true;
                        if (setActiveObject) currentCanvas.setActiveObject(obj);
                    }

                }
                // finally update the canvas object
                currentCanvas.renderAll();
                eventService.$pub('objectUpdated', obj);

            }
        };
    }
}
