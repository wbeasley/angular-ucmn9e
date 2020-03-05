import { CanvasService } from './canvas.service';
import { Injectable } from '@angular/core';

declare var fabric: any;

@Injectable({
  providedIn: 'root'
})
export class AddImageService {

  constructor(
    private canvasService: CanvasService
  ) { }

  /**
   * This is generic function for adding any type of image to canvas
   * 
   * @param image url to image
   */
  async addImage(image, data: any) {

    // if no image url is passed, return from here only
    if (!image) return;

    let checkForLimit = (data.tab == 'clipart') ? this.canvasService.objectLimit.clipartLimitEnable : this.canvasService.objectLimit.uploadLimitEnable,
      allowedLimit = (data.tab == 'clipart') ? this.canvasService.objectLimit.clipartImageLimit : this.canvasService.objectLimit.uploadImageLimit,
      currentTotalUploadedImages = this.canvasService.getObjectTypeFromAllCanvas('tab', data.tab),
      eventToBePublished = (data.tab == 'clipart') ? 'displayClipartLimitError' : 'displayUploadImageLimitError';

    if (checkForLimit == 1 && currentTotalUploadedImages >= allowedLimit) {
      this.canvasService.eventService.$pub(eventToBePublished);
      return;
    }

    // get image extension from image name
    let clipartPrice: any = 0;
    if (data && data.hasOwnProperty('tab') && data.tab == "clipart") {
      clipartPrice = (data.price != null) ? data.price : 0;
    }
    let imgExtensionIndex = image.lastIndexOf('.'), extensionName = image.substr(imgExtensionIndex + 1),
      properties = {
        left: 50,
        top: 50,
        objType: 'image',
        tab: (data && data.tab) ? data.tab : 'upload',
        canvas: (data && data.canvas) ? data.canvas : this.canvasService.currentCanvas,
        price: clipartPrice,
        extension: extensionName,
        imageSrc: image
      };

    // set svg flag
    let isSvg: boolean = (extensionName == 'svg') ? true : false;

    // set svg flag to properties for further opearations
    properties = Object.assign(properties, { isSvg: isSvg });

    // call function accordingly
    this.canvasService.eventService.$pub('showMainLoader');
    (isSvg === true) ? await this.addSvgImage(image, properties, true) : await this.addJpgPngImage(image, properties, true);
    this.canvasService.eventService.$pub('hideMainLoader');
  }

  /**
   * for adding svg image on canvas
   * 
   * @param image url to svg image
   * @param properties properties
   */


  addSvgImage(image, properties, isCenter) {
    const self = this;
    return new Promise(async (resolve, reject) => {
      new fabric.loadSVGFromURL(image, (svgImgObject, options) => {
        let imgObj = new fabric.Group(svgImgObject);
        imgObj['src'] = image;
        imgObj.zcustomObjects = imgObj._objects.slice(0)
        let rmObj = this.canvasService.getActiveObject();
        if (this.removeForUltimateLock(rmObj)) {
          properties.left = rmObj.left;
          properties.top = rmObj.top;
          properties.angle = rmObj.angle;
          properties.ignoreBestFit = true;
          isCenter = false;
          imgObj = this.canvasService.applyUltimateLock(imgObj, false);
          imgObj.scaleToWidth(rmObj.width * rmObj.scaleX);
        }
        let params = {
          obj: imgObj,
          properties: properties,
          canvas: properties.hasOwnProperty('canvas') ? properties.canvas : this.canvasService.currentCanvas,
          crudServiceString: 'this.insertObjectService',
          isCenter: isCenter,
        };
        self.canvasService.objectCRUD(params);
        resolve();
      });
    });
  }

  /**
   * for adding jpg/png images
   * 
   * @param image url to image
   * @param properties properties
   */
  addJpgPngImage(image, properties, isCenter) {
    const self = this;
    return new Promise(async (resolve, reject) => {
      new fabric.Image.fromURL(image, (imgObj) => {
        imgObj['src'] = image;
        let rmObj = this.canvasService.getActiveObject();
        if (this.removeForUltimateLock(rmObj)) {
          properties.left = rmObj.left;
          properties.top = rmObj.top;
          properties.angle = rmObj.angle;
          properties.ignoreBestFit = true;
          isCenter = false;
          imgObj = this.canvasService.applyUltimateLock(imgObj, false);
          imgObj.scaleToWidth(rmObj.width * rmObj.scaleX);
        }

        let params = {
          obj: imgObj,
          properties: properties,
          crudServiceString: 'this.insertObjectService',
          isCenter: isCenter,
        };
        self.canvasService.objectCRUD(params);
        resolve();
      }, {
          crossOrigin: 'anonymous'
        });
    });
  }


  // Remove object When object contain ultimate lock = true
  removeForUltimateLock(obj) {
    if (obj && (obj.type != "text" && obj.type != "textbox") && obj.ultimatelock == true) {
      let params = {
        obj: obj,
        properties: null,
        crudServiceString: 'this.removeObjectService',
        removeUltimateObj: true
      };
      this.canvasService.objectCRUD(params);
      return true;
    } else {
      return false;
    }
  }


  updateImage(image) {
    let obj = this.canvasService.getActiveObject();

    if (obj && obj.type == "image") {

      let params = {
        obj: obj,
        newSrc: image,
        crudServiceString: 'this.cropperUpdateService',
      };
      this.canvasService.objectCRUD(params);
    }
  }
}
