import { PubSubService } from 'angular7-pubsub';
import { MainService } from 'src/app/services/main.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FontService {

  public fontarr: any = [];
  public defaultFontFamily: any = [];
  public activeFontFamily: any;
  public defaultFontSize: any;
  public isFontLoaded: boolean = false;
  public textLimitEnable: any;
  public textLimitCounter;
  public limitAlert;
  public isEnableloadmore: any = false;
  // if call is already made, 
  // don't repeat again,
  public fontLoadRequested: boolean = false;

  // force load these fonts
  public loadTheseFonts: any = [];

  constructor(
    private mainService: MainService,
    private eventService: PubSubService
  ) {

  }

  async getFonts(page: any = 1, resetArr: boolean = false) {
    this.fontLoadRequested = true;
    if (resetArr === true) this.fontarr = [];
    let params = { page: page },
      url = 'productdesigner/text/getFonts', cacheKey: string = 'getFonts' + this.mainService.baseUrl + page;
    if (this.loadTheseFonts.length) {
      this.mainService.cacheService.remove(cacheKey);
      params = Object.assign(params, { fontList: this.loadTheseFonts });
    }
    await this.mainService.getData(url, params, cacheKey).then(fontData => {
      this.fontLoadRequested = false;
      this.isEnableloadmore = fontData.loadMoreFlag;
      this.fontarr = this.fontarr.concat(fontData.fonts);
      this.defaultFontFamily = Object.assign({}, fontData.defaultFontFamily);
      this.activeFontFamily = Object.assign({}, fontData.defaultFontFamily);
      this.defaultFontSize = fontData.defaultFontSize;
      this.isFontLoaded = true;
      this.textLimitEnable = fontData.textLimitEnable;
      this.textLimitCounter = parseInt(fontData.textLimitCounter);
      this.limitAlert = fontData.limitAlert;
      this.loadTheseFonts = [];
      this.eventService.$pub('fontDataLoaded', fontData);
    }).catch(err => console.log(err));
  }
}
