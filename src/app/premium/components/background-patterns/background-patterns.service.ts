import { Injectable } from '@angular/core';
import { CanvasService } from 'src/app/services/canvas.service';
import { ApplyPatternsService } from './apply-patterns.service';
import { PubSubService } from 'angular7-pubsub';
declare var fabric: any;

@Injectable({
  providedIn: 'root'
})
export class BackgroundPatternsService {

  public padding: any = [];
  public pattern: any = {};
  public oldPattern: any = {};
  public imgObj: any = {};
  public uniqueCanvasId: any;
  public canvas: any;
  constructor(private canvasService: CanvasService, private eventService: PubSubService, private applyPatternsService: ApplyPatternsService) {
    this.canvasService.objProperties.push("patternobject");
    this.canvasService.objProperties.push("custompadding");
    this.canvasService.objProperties.push("isPattern");
    this.canvasService.objProperties.push("angle");
    this.canvasService.objProperties.push("offsetX");
    this.canvasService.objProperties.push("offsetY");
    this.canvasService.objProperties.push("padding");
    this.canvasService.objProperties.push("patternWidth");
    this.subscribeEvents();
  }
  subscribeEvents(){
    this.eventService.$sub('zoomCanvasUpdated', (canvas) => {
      this.resizePattern(canvas);
    });
    this.eventService.$sub('loadBackgroundPattern', (pattern) => {
      this.loadBackgroundPattern(pattern);
    });
    this.eventService.$sub('allcanvasCreated', () => {
      setTimeout(() => {
        if (this.pattern && Object.keys(this.pattern).length) {
          let allCanvas = this.canvasService.containerCanvases,
          currentCanvas: any = null,
          prevCanvasKeys = Object.keys(this.pattern),
          counter: number = 0,
          prevCanvasKey, uniqueCanvasId;
          for (let canvasKey in allCanvas) {
            if (!prevCanvasKeys[counter]) continue;
            prevCanvasKey = prevCanvasKeys[counter];
            currentCanvas = allCanvas[canvasKey];
            let object = this.fetchPatternObjectFromCanvas(currentCanvas);
            if (!object) {
              continue;
            }
            uniqueCanvasId = currentCanvas.image_id + '_' + currentCanvas.designarea_id;
            this.pattern[uniqueCanvasId] = this.pattern[prevCanvasKey];
            this.padding[uniqueCanvasId] = this.padding[prevCanvasKey];
            this.imgObj[uniqueCanvasId] = this.imgObj[prevCanvasKey];
            this.oldPattern[uniqueCanvasId] = this.oldPattern[prevCanvasKey];
            counter++;
            this.resizePattern(currentCanvas);
          }
        }
      }, 200);
    });

  }

  resizePattern(canvas) {
    let object = this.fetchPatternObjectFromCanvas(canvas);
    if (!object) {
      return;
    }
    let uniqueCanvasId = canvas.image_id + '_' + canvas.designarea_id;
    this.imgObj[uniqueCanvasId].isResize = true;
    this.makePattern(null);
  }
  loadBackgroundPattern(patternObject) {
    let self = this;
    let uniqueCanvasId = patternObject.canvas.image_id + '_' + patternObject.canvas.designarea_id;
    let pattern = patternObject.obj.fill;
    if (!this.oldPattern[uniqueCanvasId]) {
      this.oldPattern[uniqueCanvasId] = {};
    }
    this.oldPattern[uniqueCanvasId].repeat = pattern.repeat;
    this.oldPattern[uniqueCanvasId].offsetX = pattern.offsetX;
    this.oldPattern[uniqueCanvasId].offsetY = pattern.offsetY;
    this.padding[uniqueCanvasId] = patternObject.obj.custompadding;
    fabric.util.enlivenObjects([patternObject.obj.patternobject], function (object) {
      self.imgObj[uniqueCanvasId] = object[0];
      self.imgObj[uniqueCanvasId].scaleX = patternObject.obj.patternobject.scaleX;
      self.imgObj[uniqueCanvasId].scaleY = patternObject.obj.patternobject.scaleY;
      self.imgObj[uniqueCanvasId].scaleFactor = patternObject.obj.scaleFactor;
      self.uniqueCanvasId = uniqueCanvasId;
      self.imgObj[uniqueCanvasId].loadDesign = true;
      if (self.imgObj[uniqueCanvasId]._objects) {
        self.imgObj[uniqueCanvasId].isSvg = true;
      }
      //self.canvasService.resizeObjectAsPerScale(self.imgObj[uniqueCanvasId]);
      self.canvas = patternObject.canvas;
      self.makePattern(null);
      self.resizePattern(self.canvas);
    });
  }

  applyPattern(params) {
    let self = this;
    let obj = params['obj'];
    let uniqueCanvasId = this.canvasService.currentCanvas.image_id + '_' + this.canvasService.currentCanvas.designarea_id;
    let objWidth = 100;
    let backgroundImage = params['backgroundImage'];
    let imgExtensionIndex = backgroundImage.lastIndexOf('.'),
    extensionName = backgroundImage.substr(imgExtensionIndex + 1);
    if (extensionName == 'svg') {
      new fabric.loadSVGFromURL(backgroundImage, (svgImgObject, options) => {
        self.imgObj[uniqueCanvasId] = new fabric.Group(svgImgObject);
        self.imgObj[uniqueCanvasId].scaleToWidth(objWidth);
        self.imgObj[uniqueCanvasId].scaleFactor = self.canvasService.scaleFactor;
        self.imgObj[uniqueCanvasId].isSvg = true;
        self.makePattern(obj);
      });
    } else {
      fabric.Image.fromURL(backgroundImage, function (img) {
        self.imgObj[uniqueCanvasId] = img;
        self.imgObj[uniqueCanvasId].scaleFactor = self.canvasService.scaleFactor;
        self.imgObj[uniqueCanvasId].scaleToWidth(objWidth);
        self.makePattern(obj);
      });
    }
  }
  makePattern(obj) {
    let uniqueCanvasId;
    if (this.uniqueCanvasId) {
      uniqueCanvasId = this.uniqueCanvasId;
    } else {
      uniqueCanvasId = this.canvasService.currentCanvas.image_id + '_' + this.canvasService.currentCanvas.designarea_id;
    }
    /**
     * If pattern is already there
     */
     let object = this.fetchPatternObjectFromCanvas(this.canvasService.currentCanvas);
     if (object) {

       this.imgObj[uniqueCanvasId].scaleToWidth(this.pattern[uniqueCanvasId].patternWidth);
       this.imgObj[uniqueCanvasId].set('angle', this.pattern[uniqueCanvasId].angle);
       this.padding[uniqueCanvasId] = this.pattern[uniqueCanvasId].padding;
       if (this.imgObj[uniqueCanvasId].isResize) {
         this.removePattern(this.canvasService.currentCanvas);
         this.resizePatternAsPerScale(uniqueCanvasId, this.imgObj[uniqueCanvasId].scaleFactor);
         this.canvasService.resizeObjectAsPerScale(this.imgObj[uniqueCanvasId]);
       }
     }

     let imgObj = this.imgObj[uniqueCanvasId];
     imgObj.left = imgObj.top = 0;
     let usedColorArr = [];
     let usedColorCounter = 0;
     if (imgObj.isSvg == true) {
       imgObj._objects.forEach((svgColor) => {
         if (svgColor.fill) {
           if (usedColorArr.indexOf(svgColor.fill) == -1) {
             usedColorArr.push(svgColor.fill);
           }
         }
       });
       usedColorCounter = usedColorArr.length;
     }

     let patternSourceCanvas = new fabric.StaticCanvas();
     patternSourceCanvas.add(imgObj);
     patternSourceCanvas.renderAll();
     if (!this.padding[uniqueCanvasId]) {
       this.padding[uniqueCanvasId] = 0;
     }
     let self = this;
     this.pattern[uniqueCanvasId] = new fabric.Pattern({
       source: function () {
         patternSourceCanvas.setDimensions({
           width: imgObj.getScaledWidth() + self.padding[uniqueCanvasId],
           height: imgObj.getScaledHeight() + self.padding[uniqueCanvasId]
         });
         patternSourceCanvas.renderAll();
         return patternSourceCanvas.getElement();
       },
       repeat: 'repeat'
     });
     if (this.oldPattern[uniqueCanvasId]) {
       this.pattern[uniqueCanvasId] = Object.assign(this.pattern[uniqueCanvasId], this.oldPattern[uniqueCanvasId]);
     }
     this.pattern[uniqueCanvasId].padding = this.padding[uniqueCanvasId];
     this.pattern[uniqueCanvasId].angle = imgObj.angle;
     this.pattern[uniqueCanvasId].patternWidth = imgObj.getScaledWidth();
     this.pattern[uniqueCanvasId].object = imgObj;
     if (!this.oldPattern[uniqueCanvasId]) {
       this.oldPattern[uniqueCanvasId] = Object.assign({}, this.pattern[uniqueCanvasId]);
       this.oldPattern[uniqueCanvasId].repeat = this.pattern[uniqueCanvasId].repeat;
       this.oldPattern[uniqueCanvasId].offsetX = this.pattern[uniqueCanvasId].offsetX;
       this.oldPattern[uniqueCanvasId].offsetY = this.pattern[uniqueCanvasId].offsetY;
       delete this.oldPattern[uniqueCanvasId].source;
     }

     let objParams = {
       canvas: this.canvas ? this.canvas : this.canvasService.currentCanvas,
       crudService: this.applyPatternsService,
       patternService: this,
       isHistory: false,
       pattern: this.pattern[uniqueCanvasId],
       obj: obj,
     };
     this.canvasService.objectCRUD(objParams);
   }
   changePattern(pattern, type, canvas) {
     if (!canvas) {
       canvas = this.canvasService.currentCanvas;
     }
     let uniqueCanvasId = canvas.image_id + '_' + canvas.designarea_id;
     if (type != 'remove') {
       this.oldPattern[uniqueCanvasId] = Object.assign({}, pattern);
       this.pattern[uniqueCanvasId] = Object.assign(this.pattern[uniqueCanvasId], pattern);
       if (type == 'patternWidth') {
         this.imgObj[uniqueCanvasId].scaleToWidth(pattern.patternWidth);
       }
       this.imgObj[uniqueCanvasId].set('angle', pattern.angle);
       this.padding[uniqueCanvasId] = pattern.padding;
       let obj = this.fetchPatternObjectFromCanvas(canvas);
       if(obj){
         obj.custompadding = pattern.padding;
       }
       if(this.pattern[uniqueCanvasId].source().height == 0 || this.pattern[uniqueCanvasId].source().width == 0){
        return;
      }
      canvas.renderAll();
      this.eventService.$pub('backgroundPatternsUpdate', canvas);
    } else {
     delete this.pattern[uniqueCanvasId];
     delete this.oldPattern[uniqueCanvasId];
     this.padding[uniqueCanvasId] = 0;
     delete this.imgObj[uniqueCanvasId];
     this.removePattern(canvas);
     canvas.renderAll();
     this.eventService.$pub('backgroundPatternsApplied', canvas);
   }

 }
 convertObjectToPattern() {
   let obj = this.canvasService.currentCanvas.getActiveObject();
   let params = {
     backgroundImage: obj.src,
     obj: obj
   };
   this.applyPattern(params);
 }
 removePattern(canvas) {
   let object = this.fetchPatternObjectFromCanvas(canvas);
   canvas.remove(object);
 }
 fetchPatternObjectFromCanvas(canvas) {
   let objects = canvas.getObjects();
   let object = objects.filter(obj => obj.isPattern == true);
   if (object.length > 0) {
     return object[0];
   }
   return false;
 }
 resizePatternAsPerScale(uniqueCanvasId, scaleFactor) {
   this.oldPattern[uniqueCanvasId].offsetX = (scaleFactor * this.oldPattern[uniqueCanvasId].offsetX) / this.canvasService.scaleFactor;
   this.oldPattern[uniqueCanvasId].offsetY = (scaleFactor * this.oldPattern[uniqueCanvasId].offsetY) / this.canvasService.scaleFactor;
   this.padding[uniqueCanvasId] = (scaleFactor * this.padding[uniqueCanvasId]) / this.canvasService.scaleFactor;
   this.imgObj[uniqueCanvasId].angle = (scaleFactor * this.imgObj[uniqueCanvasId].angle) / this.canvasService.scaleFactor;
 }
}