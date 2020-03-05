import { FontService } from './../essentials/components/font/font.service';
import { MainService } from './../services/main.service';
import { Component, OnInit, Input, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { LoaderComponent } from '../essentials/components/loader/loader.component';
declare var fabric: any;
@Component({
  selector: '[quotes]',
  templateUrl: './quotes.component.html',
  styleUrls: ['./quotes.component.scss']
})
export class QuotesComponent implements OnInit {
  @Input() loadContent;

  // main variables
  public page: number;
  public limit: number;
  public quoteCategoryData: any;
  public quoteData: any;

  // flag variables
  public selectedQuoteCat: any;
  public isEnableloadmore: any = false;
  public showAllFonts: boolean = false;
  public enableNoMessage: boolean;
  public properties: any = {};

  // other
  public subTabsData: any;
  public accordianId: any = 0;
  public currentTab: any = 9;
  public getCurrentTabName: any;
  public scrollTopPosition: number = 0;

  // view child
  @ViewChild('loaderComponent') quoteDataLoader: LoaderComponent;
  @ViewChild('subtabLoader') quoteCategoryLoader: LoaderComponent;
  @ViewChild('quoteContainer') private quoteDataContainer: ElementRef;
  // @ViewChild('quoteContainer', { read: ElementRef }) public quoteDataContainer: ElementRef<any>;
  @ViewChild('mainSection') private mainSection: ElementRef;

  constructor(
    public mainService: MainService,
    public fontService: FontService,
    public cdr: ChangeDetectorRef
  ) {
    this.mainService.canvasService.eventService.$sub('getSubTabs', (mainTabId) => {
      if (mainTabId == this.currentTab) {
        if (!this.subTabsData) {
          this.getSubTabs(mainTabId);
        }
        if (this.showAllFonts == false && this.mainService.isResponsive) {
          this.showFonts(false);
        }
      }
      this.getCurrentTabName = this.mainService.getAllTabs[this.currentTab]['label'];
    });
    this.mainService.canvasService.eventService.$sub('closeFullView', (showAllFonts) => {
      this.showAllFonts = showAllFonts;
      this.showFonts(this.showAllFonts);
    });
  }

  ngOnInit() {
    this.init();
  }

  ngAfterViewInit() {
    if (this.loadContent) {
      this.subscribeEvents();
      this.prepareData();
      if (this.showAllFonts == false && this.mainService.isResponsive) {
        this.showFonts(false);
      }
    }
  }

  subscribeEvents() {
    this.mainService.canvasService.eventService.$sub('objectAdded', () => {
      // this.init();
    });
    this.mainService.canvasService.eventService.$sub('objectUpdated', () => {
      // this.init();
    });
    this.mainService.canvasService.eventService.$sub('objectRemoved', (obj) => {

    });
  }

  init() {
    this.page = 1;
    this.limit = 5;
    this.quoteCategoryData = [];
    this.quoteData = [];
    this.enableNoMessage = true;
    this.prepareDefaultProperties();
  }

  prepareDefaultProperties() {
    this.properties = {
      left: 10,
      top: 20,
      opacity: 1,
      objType: 'quoteText',
      strokeWidth: 0,
      tab: "text",
      fontSize: (this.fontService.defaultFontSize) ? parseInt(this.fontService.defaultFontSize) : 16
    }
    if (this.fontService.defaultFontFamily &&
      this.fontService.defaultFontFamily.hasOwnProperty('font_label') &&
      this.fontService.defaultFontFamily.hasOwnProperty('font_file')) {
      this.properties.fontFamily = this.fontService.defaultFontFamily.font_label;
      this.properties.font_file = this.fontService.defaultFontFamily.font_file;
    } else {
      this.subscribeFontEvent();
    }
    if (this.mainService.colorData &&
      this.mainService.colorData.hasOwnProperty('defaultColor') &&
      this.mainService.colorData.defaultColor.color_code
    ) {
      let fontColor = this.mainService.colorData.defaultColor.color_code;
      if (fontColor && fontColor != null) this.properties.fill = fontColor;
    } else {
      this.subscribeColorEvent();
    }
  }

  subscribeColorEvent() {
    this.mainService.canvasService.eventService.$sub('getColors', (colorData) => {
      debugger
      let fontColor = colorData.defaultColor;
      if (fontColor && fontColor != null) this.properties.fill = fontColor;
    });
  }

  subscribeFontEvent() {
    this.mainService.canvasService.eventService.$sub('fontDataLoaded', (fontData) => {
      this.properties.fontFamily = fontData.defaultFontFamily.font_label;
      this.properties.font_file = fontData.defaultFontFamily.font_file;
    });
  }

  prepareData() {
    this.getQuoteCategories();
  }

  getQuoteCategories() {
    let url = 'quotes/index/getQuoteCategory',
      params = { 'product_id': this.mainService.productId },
      cacheKey = 'getQuoteCategory-' + this.mainService.baseUrl + this.mainService.productId;
    this.quoteCategoryLoader.showSubLoader = true;
    this.mainService.getData(url, params, cacheKey).then((resp: any) => {
      if (!resp || (resp && resp.status == 'failure')) {
        let msg = (resp.hasOwnProperty('log') && resp.log) ? resp.log : 'Something went wrong';
        this.mainService.swal('Error', msg, 'error');
      } else {
        this.quoteCategoryData = this.quoteCategoryData.concat(resp.quotecategory);
        let defaultCategory = this.quoteCategoryData.find(quoteCatItem => quoteCatItem.id == resp.default_category_id);
        this.selectedQuoteCat = (!defaultCategory) ? this.quoteCategoryData[0] : defaultCategory;
        this.enableNoMessage = resp.allowNoMore;
        this.getQuoteDataByCategory(null, true);
      }
    })
      .catch((err: any) => console.log("Error in fetching quote categories: ", err))
      .finally(() => this.quoteCategoryLoader.showSubLoader = false);
  }

  changeQuoteCategory(quoteCategoryItem) {
    if (!quoteCategoryItem || !quoteCategoryItem.hasOwnProperty('id') || !quoteCategoryItem.id) return;
    this.selectedQuoteCat = quoteCategoryItem;
    this.getQuoteDataByCategory(quoteCategoryItem.id, true);
  }

  getQuoteDataByCategory(categoryId: any = null, reset: boolean = false) {
    if (categoryId == null) categoryId = this.selectedQuoteCat.id;
    if (reset === true) this.quoteData = [];

    let url = 'quotes/index/getQuotes',
      params = { 'page': this.page, 'quotesCategoryId': categoryId, 'limit': this.limit },
      cacheKey = 'getQuotes-' + this.mainService.baseUrl + this.mainService.designId + this.mainService.itemId + this.page + this.limit + categoryId;

    this.quoteDataLoader.showSubLoader = true;
    this.cdr.detectChanges();
    this.mainService.getData(url, params, cacheKey).then((resp: any) => {
      if (!resp || (resp && resp.status == 'failure')) {
        let msg = (resp.hasOwnProperty('log') && resp.log) ? resp.log : 'Something went wrong';
        this.mainService.swal('Error', msg, 'error');
      } else {
        this.quoteData = this.quoteData.concat(resp.quotes);
        this.isEnableloadmore = (resp.loadMoreFlag == 0) ? false : true;
        setTimeout(() => {
          this.cdr.detectChanges();
          this.scrollToBottom();
        }, 50);
      }
    })
      .catch((err: any) => console.log("Error in fetching quote categories: ", err))
      .finally(() => {
        this.quoteDataLoader.showSubLoader = false;
      });
  }

  addQuoteToCanvas(quoteItem) {
    if (!quoteItem || !quoteItem.hasOwnProperty('text')) return;
    let params: any = {
      obj: null,
      properties: this.properties,
      crudServiceString: 'this.insertObjectService'
    };

    let quoteObj = this.getQuoteObjectFromCanvas();

    if (quoteObj) {
      this.mainService.canvasService.deselectAllObjects();
      params.obj = quoteObj;
      params.properties = { text: quoteItem.text };
      params.crudServiceString = 'this.updateObjectService';
    } else {
      let textObj = new fabric.Textbox(quoteItem.text);
      params.obj = textObj;
      if (!this.properties.hasOwnProperty('preventCenter')) {
        params.isCenter = true;
      }
    }

    if (params.obj) {
      // this.removeAllQuotes();
      // this.mainService.processToolTip('forceClose');
      // this.mainService.forceDisableTooltip = true;
      this.mainService.canvasService.objectCRUD(params);
    }
  }

  loadMoreQuotes() {
    this.page++;
    this.getQuoteDataByCategory(this.selectedQuoteCat.id, false);
  }

  removeAllQuotes() {

    let param = {
      obj: null, properties: {}, crudServiceString: 'this.removeObjectService'
    };

    param.obj = this.getQuoteObjectFromCanvas();

    if (param.obj) {
      // this.copyProperties(param.obj);
      this.mainService.canvasService.objectCRUD(param);
    }
    if (this.mainService.isResponsive) {
      this.mainService.canvasService.eventService.$pub('closeTab');
    }
  }

  getQuoteObjectFromCanvas() {
    let allObjects = this.mainService.canvasService.getObjects();

    if (!allObjects || !allObjects.length) return null;

    return allObjects.find(currObj => currObj.type == 'textbox');
  }

  copyProperties(obj) {
    let self = this, objProperties = Object.keys(obj),
      preventTheseProperties = ['text', 'id'];
    objProperties.filter(property => {
      if (preventTheseProperties.indexOf(property) < 0) {
        self.properties[property] = obj[property];
      }
    });
    this.properties.preventCenter = true;
  }

  /*********************
   * Other functions
   *********************/
  getNumberArray(value: number) {
    var items: number[] = [];
    for (var i = 1; i <= value; i++) {
      items.push(i);
    }
    return items;
  }

  async getSubTabs(mainTabId) {
    let data = this.mainService.tabsFlow[mainTabId];
    this.subTabsData = this.mainService.setSubTabsData(data, mainTabId);
    if (this.subTabsData && this.subTabsData.length > 0) {
      this.accordianId = this.subTabsData[0].id;
    }
    // if (this.subtabLoader && this.subtabLoader.showSubLoader) this.subtabLoader.showSubLoader = false;
  }

  showFonts(showAllFonts) {
    this.showAllFonts = !showAllFonts;
    this.mainService.canvasService.eventService.$pub('showFonts', { showAllFonts: this.showAllFonts, title: 'Quotes', preventCloseIcon: true });
  }

  scrollToBottom(): void {
    try {
      if (!this.mainService.isResponsive) {
        this.quoteDataContainer.nativeElement.scrollTop = this.quoteDataContainer.nativeElement.scrollHeight;
        // this.quoteDataContainer.nativeElement.scrollTo(this.quoteDataContainer.nativeElement.scrollHeight)
      }
      else if (this.mainService.isResponsive) {
        this.mainSection.nativeElement.scrollTop = this.mainSection.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.log("Error in scroll : ", err);
    }
  }
}
