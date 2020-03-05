import { LoaderComponent } from './../loader/loader.component';
import { Component, OnInit, Input, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CacheService, CacheStoragesEnum } from 'ng2-cache';
import { MainService } from 'src/app/services/main.service';
import { TabsService } from 'src/app/services/tabs.service';
import { PubSubService } from 'angular7-pubsub';

@Component({
  selector: 'common-tabs',
  templateUrl: './common-tabs.component.html',
  styleUrls: ['./common-tabs.component.scss']
})
export class CommonTabsComponent implements OnInit {

  @Input() subTabsData: string;
  @Input() activeAccordion: any;
  backArrow: boolean = false;
  isActiveTabId = false;
  openIntroAccordian: any;

  // loader reference variable
  @ViewChild("loaderComponent") loaderComponent: LoaderComponent;

  /**
   * dependancy injector
   */
   constructor(
    private cacheService: CacheService,
    public mainService: MainService,
    private pubsub: PubSubService,
    public tabsService: TabsService,
    public cdr: ChangeDetectorRef
    ) {

   }


   setAccordion(id) {
    this.activeAccordion = id;
  }

  /**
   * angular lifecycle init function
   */
   ngOnInit() {
    this.init();
    let self = this;

    this.pubsub.$sub('getActiveTabId', (Id) => {
      if (Id != "" && Id != 0) {
        self.activeAccordion = Id;
        self.cdr.detectChanges();
        this.isActiveTabId = true;
        if(this.mainService.isResponsive && Id != 'enableTooltip'){
          this.pubsub.$pub('toggleResponsiveClass');
        }
      }

    });
    this.pubsub.$sub('getSubTabs', (Id) => {
      if (Id != "" && Id != 0 && this.isActiveTabId == false) {
        self.activeAccordion = Id;
        self.cdr.detectChanges();
      } else {
        this.isActiveTabId = false;
      }
      let index = self.mainService.tabsFlow[Id].filter(data => data == self.activeAccordion);
      if (index.length == 0) {
        this.activeAccordion = Id;
      }

    });

    this.pubsub.$sub('introTabActive', (Id) => {
      if (Id != "" && Id != 0) {
        self.activeAccordion = Id;
        self.openIntroAccordian = Id;
      }
    });

    this.pubsub.$sub('activeTabOnLoadDesign', (Id) => {
      let obj = this.mainService.canvasService.currentCanvas.getActiveObject();
      Id = this.getSelectedObjTabId(obj);
      if (Id != "" && Id != 0) {
        Id = (obj && obj.hasOwnProperty('tab')) ? this.getSelectedObjTabId(obj) : Id;
        this.activeAccordion = Id;
      }
    });

    this.pubsub.$sub('showFonts', (resp) => {
      this.backArrow = resp.showAllFonts;
    });
  }



  getSelectedObjTabId(obj) {
    if(!obj){
      return 0;
    }
    let tab = obj.tab, tabId: number = 0;
    switch (tab) {
      case 'text':
      tabId = 1;
      break;
      case 'clipart':
      tabId = 2;
      break;
      case 'upload':
      tabId = 3;
      break;
      case 'namenumber':
      tabId = 6;
      break;
    }
    return tabId;
  }

  /**
   * show loader on init
   */
   init() { }

  /**
   * as we have used @Input.. we can only access this variable after ng view content initialization is complete
   * we can insure that response is done on ng after content init function
   * 
   * NOTE: Need to handle if no subtabs are recieved   
   */
   selectTab(id) {
    this.activeAccordion = id;
  }

  closeFullView(backArrow) {
    this.pubsub.$pub('closeFullView', backArrow);
  }


}
