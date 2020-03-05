import { Injectable } from '@angular/core';
declare var fabric: any;
@Injectable({
	providedIn: 'root'
})
export class ImageEffectsService {

	constructor() { }

	/**
	 * Init the service for operation : It initialise the variables
	 */
	public init = function (params) {
		let selectedObj = params.obj,
			properties = params.properties,
			canvasService = params.service,
			eventService = params.eventService;

		// if no object is passed, we will get active object
		if (selectedObj == null) selectedObj = canvasService.getActiveObject();

		// if no active object found, return from here
		if (selectedObj == false) return;

		let oldProperties = [];
		if (Array.isArray(selectedObj)) {
			oldProperties = selectedObj[0].filters;
		} else {
			oldProperties = selectedObj.filters;
		}

		return {
	        /**
	         * this function is used when special operation needs to be performed on objects(eg. bold/italic on text)
	         * 
	         */
			exec() {
				// if no active object found, return from here
				if (selectedObj == false) return;
				fabric.textureSize = 4096;
				selectedObj.filter(obj => {
					if (obj.objType == 'image' && !obj.isSvg) {
						// set properties to current object
						obj.filters = [];
						properties.imageEffects.forEach((object, index) => {
							let name = object.label.toLowerCase();

							if (properties.effectArray.indexOf(object.effect_name) >= 0) {
								if (object.effect_name == 'Sharpen') {
									obj.filters.push(new fabric.Image.filters.Convolute({ matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0] }));
								} else if (object.effect_name == 'Emboss') {
									obj.filters.push(new fabric.Image.filters.Convolute({ matrix: [1, 1, 1, 1, 0.7, -1, -1, -1, -1] }));
								} else if (object.effect_name == 'Hue') {

									let value = (properties.sliderValue != null) ? parseFloat(properties.sliderValue) : parseFloat(object.value);

									let objKeys = Object.keys(properties.sliderHistory);
									let getIndex = objKeys.indexOf("HueRotation");
									if (getIndex != -1 && object.effect_name != properties.effect) {
										value = properties.sliderHistory[objKeys[getIndex]];
									}

									let eff = new fabric.Image.filters.HueRotation({ rotation: value });

									if (object.effect_name == properties.effect) {
										eff = Object.assign(eff, { sliderValue: properties.sliderValue });
									} else {
										eff = Object.assign(eff, { sliderValue: properties.sliderHistory[objKeys[getIndex]] });
									}

									obj.filters.push(eff);
								} else {
									if (object.value != 0) {

										let value = (properties.sliderValue != null) ? parseFloat(properties.sliderValue) : parseFloat(object.value);

										let objKeys = Object.keys(properties.sliderHistory);
										let getIndex = objKeys.indexOf(object.effect_name);
										if (getIndex != -1 && object.effect_name != properties.effect) {
											value = properties.sliderHistory[objKeys[getIndex]];
										}

										let eff = new fabric.Image.filters[object.effect_name]({ [name]: value });

										if (object.effect_name == properties.effect) {
											eff = Object.assign(eff, { sliderValue: properties.sliderValue });
										} else {
											eff = Object.assign(eff, { sliderValue: properties.sliderHistory[objKeys[getIndex]] });
										}

										obj.filters.push(eff);
									} else {
										obj.filters.push(new fabric.Image.filters[object.effect_name]());
									}
								}
							}
						});
						obj.dirty = true;

						obj.setCoords();
						setTimeout(() => {

							obj.applyFilters();
						}, 50);
					}
				});

				// finally update the canvas object
				canvasService.currentCanvas.calcOffset();
				setTimeout(() => {
					canvasService.currentCanvas.renderAll();
					// Publish an event when new object is updated
					eventService.$pub('objectUpdated', selectedObj);
				}, 50);

			},
	        /**
	         * This function is used to revert back the last updated object while using undo redo
	         */
			unexec() {
				let canvas = canvasService.currentCanvas;
				// if no canvas is selected
				if (!canvas) return;

				// return of obj is null
				if (!selectedObj) return;

				selectedObj.filter(obj => {
					if (obj.objType == 'image' && !obj.isSvg) {
						obj.filters = [];
						oldProperties.forEach((prop, index) => {
							obj.filters.push(prop);
						});

						obj.applyFilters();
					}
				});
				// finally update the canvas object
				canvasService.currentCanvas.renderAll();
				eventService.$pub('objectUpdated', selectedObj);

			}
		};
	}
}
