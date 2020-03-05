import { Injectable } from '@angular/core';
declare var fabric:any;

@Injectable({
	providedIn: 'root'
})
export class ApplyPatternsService {

	constructor() {
	}
	public init = function (params) {

		var pattern = params.pattern,
		canvasService = params.service,
		obj = params.obj,
		canvas = params.canvas ? params.canvas : canvasService.currentCanvas,
		eventService = params.eventService,
		patternService = params.patternService;
		let oldPattern = null;
		let updatePattern = {};
		if(params.oldPattern){
			updatePattern =  params.oldPattern;
		}
		let object = patternService.fetchPatternObjectFromCanvas(canvas);
		if(object){
			oldPattern = object.fill;	
		}
		return { 
			exec: function () {
				if(Object.keys(updatePattern).length > 0){
					pattern = Object.assign(updatePattern, pattern);
				}else{
					let object = patternService.fetchPatternObjectFromCanvas(canvas);
					if(object){
						object.fill = pattern;
						object.custompadding=pattern.padding;
						object.patternobject=pattern.object;
					}else{
						let canvasWidth = canvas.width - canvasService.clipX[canvas.designarea_id];
						let canvasHeight = canvas.height - canvasService.clipY[canvas.designarea_id];
						var rect = new fabric.Rect({
							left: canvasService.clipX[canvas.designarea_id]/2,
							top:  canvasService.clipY[canvas.designarea_id]/2,
							width: canvasWidth,
							height: canvasHeight,
							custompadding: pattern.padding,
							patternobject:pattern.object,
							fill: pattern,
							selectable:false,
							isPattern:true,
							objectCaching: false,
							scaleFactor: canvasService.scaleFactor,
						});
						pattern.object = null;
						canvas.add(rect);
						rect.moveTo(-1);
					}
				}
				if(obj){
					canvas.remove(obj);
				}
				canvas.renderAll();
				eventService.$pub('backgroundPatternsApplied',canvas);
			},
			unexec: function () {
				let object = patternService.fetchPatternObjectFromCanvas(canvas);
				if(object){
					object.fill = oldPattern;
					object.custompadding=oldPattern.padding;
					object.patternobject=oldPattern.object;
					if(!oldPattern){
						canvas.remove(object);
					}
				}else{
					let canvasWidth = canvas.width - canvasService.clipX[canvas.designarea_id];
					let canvasHeight = canvas.height - canvasService.clipY[canvas.designarea_id];
					var rect = new fabric.Rect({
						left: canvasService.clipX[canvas.designarea_id]/2,
						top:  canvasService.clipY[canvas.designarea_id]/2,
						width: canvasWidth,
						height: canvasHeight,
						patternobject:oldPattern.object,
						custompadding: oldPattern.padding,
						fill: oldPattern,
						selectable:false,
						isPattern:true,
						objectCaching: false,
						scaleFactor: canvasService.scaleFactor
					});
					pattern.object = null;
					canvas.add(rect);
					rect.moveTo(-1);
				}
				if(obj){
					canvas.add(obj);
				}
				canvas.renderAll();
				eventService.$pub('backgroundPatternsApplied',canvas);
			},
		};
	};

}
