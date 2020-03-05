import { MainService } from 'src/app/services/main.service';
import { CanvasService } from 'src/app/services/canvas.service';
import { Injectable } from '@angular/core';
import { PubSubService } from 'angular7-pubsub';

@Injectable({
  providedIn: 'root'
})
export class NameNumberService {

  public newRow: any = [];
  public addName: any;
  public addNumber: any;
  public rowArray: any = [];
  public selectedNameTitle: any = {};
  public selectedNumberTitle: any = {};
  public nameNumberCanvas: any = { name: null, number: null };

  constructor(
    public mainService: MainService,
    public eventService: PubSubService
  ) {
  }

  loadNameNumber(nameNumberData) {
    this.newRow = [];
    this.rowArray = [];
    nameNumberData.filter(nameNumberItem => {
      this.newRow.push(Object.assign({}, nameNumberItem));
      this.rowArray.push(this.newRow);
    });
    let isNameExists = nameNumberData.indexOf(nameNumberData.find(nameNumberItem => (nameNumberItem.hasOwnProperty('name') && nameNumberItem.name))),
      isNumberExists = nameNumberData.indexOf(nameNumberData.find(nameNumberItem => (nameNumberItem.hasOwnProperty('number') && nameNumberItem.number)));
    if (!this.addName && isNameExists >= 0) this.addName = true;
    if (!this.addNumber && isNumberExists >= 0) this.addNumber = true;
    this.setSelectedNameNumberTitle();
    this.publishNameNumber();
  }

  setSelectedNameNumberTitle() {
    let allcanvas = this.mainService.canvasService.containerCanvases, type, currCanvas, find;

    this.selectedNameTitle = null;
    this.selectedNumberTitle = null;
    for (let key in allcanvas) {
      currCanvas = allcanvas[key];

      if (this.addName) {
        find = this.mainService.canvasService.getObjects(currCanvas).indexOf(this.mainService.canvasService.getObjects(currCanvas).find(currObj => (currObj.hasOwnProperty('addObj') && currObj.addObj == 'name')));
        if (find >= 0) {
          this.selectedNameTitle = { imageId: currCanvas.image_id };
          this.nameNumberCanvas.name = currCanvas;
        }
      }
      if (this.addNumber) {
        find = this.mainService.canvasService.getObjects(currCanvas).indexOf(this.mainService.canvasService.getObjects(currCanvas).find(currObj => (currObj.hasOwnProperty('addObj') && currObj.addObj == 'number')));
        if (find >= 0) {
          this.selectedNumberTitle = { imageId: currCanvas.image_id };
          this.nameNumberCanvas.number = currCanvas;
        }
      }
      // if (this.selectedNameTitle != null && this.selectedNumberTitle != null) break;
      if ((!this.addName || (this.addName && this.selectedNameTitle != null)) && (!this.addNumber) || (this.addNumber && this.selectedNumberTitle != null)) {
        break;
      }
    }
    if (this.selectedNameTitle || this.selectedNumberTitle) {
      this.getImageTitle();
    }
  }

  getImageTitle() {
    if (!this.mainService.loadedProductData) return;
    let dimentionData = this.mainService.loadedProductData['dimensions'];
    for (let key of dimentionData) {
      if (this.selectedNameTitle && key['image_id'] == this.selectedNameTitle.imageId) {
        this.selectedNameTitle = Object.assign(this.selectedNameTitle, { 'imageTitle': key['image_title'] });
      }
      if (this.selectedNumberTitle && key['image_id'] == this.selectedNumberTitle.imageId) {
        this.selectedNumberTitle = Object.assign(this.selectedNumberTitle, { 'imageTitle': key['image_title'] });
      }
    }
    if (!this.addName && !this.selectedNameTitle) {
      this.selectedNameTitle = Object.assign({}, this.selectedNumberTitle);
    }
    if (!this.addNumber && !this.selectedNumberTitle) {
      this.selectedNumberTitle = Object.assign({}, this.selectedNameTitle);
    }
  }

  /**
   * When name/number is enabled, we will publish an event that will allow
   * dependent components to proceed further
   */
  publishNameNumber() {
    let eventData = {
      newRow: this.newRow,
      addName: this.addName,
      addNumber: this.addNumber
    }
    this.eventService.$pub('nameNumberEnabled', eventData);
  }
}
