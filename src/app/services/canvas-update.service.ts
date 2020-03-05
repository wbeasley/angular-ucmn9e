import { Injectable } from '@angular/core';
import { CanvasService } from './canvas.service';
import { PubSubService } from 'angular7-pubsub';
@Injectable({
	providedIn: 'root'
})
export class CanvasUpdateService {

	/**
   * Init the service for operation : It initialise the variables
   */
	public init = function (params) {
		let properties = params.properties,
			canvasService = params.service,
			currentCanvas = (params.hasOwnProperty('canvas')) ? params.canvas : canvasService.currentCanvas,
			eventService = params.eventService;
		let canvasProperties = [];
		for (let key in properties) {
			canvasProperties[key] = currentCanvas[key];
		}
		return {
            /**
             * this function is used when special operation needs to be performed on objects(eg. bold/italic on text)
             * 
             */
			exec() {
				for (let key in properties) {
					currentCanvas[key] = properties[key];
				}
				currentCanvas.renderAll();
				eventService.$pub('canvasBackgroundChange');
			},
			unexec() {
				for (let key in canvasProperties) {
					currentCanvas[key] = canvasProperties[key];
				}
				currentCanvas.renderAll();
				eventService.$pub('canvasBackgroundChange');
			}
		};
	}
}
