import { MainService } from 'src/app/services/main.service';
import { Injectable } from '@angular/core';
import { FormatCurrency } from 'src/app/_helper/formatCurrency';

@Injectable({
  providedIn: 'root'
})
export class PriceService {

  public defaultPrice: any;
  public finalPrice: any;
  public extraPriceToBeAdded: any;
  public priceFormat: any;
  public totalQty: any;
  public tax: any;
  public additionalPrice: any = 0;
  public fixedPrice: number = 0;
  public printingMethodMinimumQty: any;
  public priceData: any;
  public priceAllData: any;

  constructor(
    public mainService: MainService
  ) {
    this.finalPrice = 0;
    this.defaultPrice = 0;
    this.totalQty = 1;
    this.tax = null;
    this.fixedPrice = 0;

    this.extraPriceToBeAdded = {
      productPrice: 0,
      customOptionsPrice: 0
    };
  }

  getPrice() {
    if (this.finalPrice && this.priceFormat)
      return FormatCurrency(this.finalPrice, this.priceFormat, '');
  }

  getIntPrice() {
    if (this.finalPrice && this.priceFormat)
      return (this.finalPrice);
  }

  addThisPrice() {
    this.finalPrice = parseFloat(this.defaultPrice) + parseFloat(this.extraPriceToBeAdded.productPrice) + ((parseFloat(this.additionalPrice) + this.mainService.otherPrices) * parseFloat(this.totalQty));
    if (this.tax && this.tax > 0) {
      this.finalPrice += ((this.finalPrice * this.tax) / 100);
    }
    let customOptionsPrice = parseFloat(this.extraPriceToBeAdded.customOptionsPrice) * this.totalQty;
    this.finalPrice += customOptionsPrice;
  }

  getTotalClipartsPrice() {
    let allCanvas = this.mainService.canvasService.containerCanvases,
      currCanvas: any, allObjs, confClipartPrice = (this.priceAllData.addedImagePrice == null) ? 0 : parseFloat(this.priceAllData.addedImagePrice), totalPrice: number = 0;

    for (let key in allCanvas) {
      currCanvas = allCanvas[key];
      allObjs = this.mainService.canvasService.getObjects(currCanvas);
      allObjs.filter(currObj => {
        if (currObj.hasOwnProperty('tab') && currObj.tab == 'clipart') {
          if (currObj.hasOwnProperty('price') && currObj.price > 0) {
            totalPrice += parseFloat(currObj.price);
          } else {
            totalPrice += confClipartPrice;
          }
        }
      });
    }

    return totalPrice;
  }

  getTotalCustomUploadImagePrice() {
    let allCanvas = this.mainService.canvasService.containerCanvases,
      currCanvas: any, allObjs, confClipartPrice = (this.priceAllData.addedImagePrice == null) ? 0 : parseFloat(this.priceAllData.addedImagePrice), customImagePrice = (this.priceAllData.customAddedImagePrice == null) ? 0 : parseFloat(this.priceAllData.customAddedImagePrice), totalPrice: number = 0;

    for (let key in allCanvas) {
      currCanvas = allCanvas[key];
      allObjs = this.mainService.canvasService.getObjects(currCanvas);
      allObjs.filter(currObj => {
        if (currObj.hasOwnProperty('tab') && currObj.tab == 'upload') {
          totalPrice += customImagePrice + confClipartPrice;
        }
      });
    }

    return totalPrice;
  }

  getTotalAddedTextPrice() {
    let allCanvas = this.mainService.canvasService.containerCanvases,
      currCanvas: any, allObjs, textPrice: any = (this.priceAllData.addedTextPrice == null) ? 0 : parseFloat(this.priceAllData.addedTextPrice), totalPrice: number = 0;

    for (let key in allCanvas) {
      currCanvas = allCanvas[key];
      allObjs = this.mainService.canvasService.getObjects(currCanvas);
      allObjs.filter(currObj => {
        if (currObj.hasOwnProperty('tab') && currObj.tab == 'text') {
          totalPrice += textPrice;
        }
      });
    }

    return totalPrice;
  }
}
