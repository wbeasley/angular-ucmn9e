import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { MainService } from 'src/app/services/main.service';
import { CacheService, CacheStoragesEnum } from 'ng2-cache';
import { CanvasService } from 'src/app/services/canvas.service';
import { PubSubService } from 'angular7-pubsub';
import { LoaderComponent } from './../loader/loader.component';
@Component({
    selector: '[intro]',
    templateUrl: './tooltip.component.html',
    styleUrls: ['./tooltip.component.scss']
})
export class TooltipComponent implements OnInit {
    isEnableTooltip: any = '';
    TooltipData: any = '';
    tooltipData: any = [];
    toggleIntro: any = true;

    deactiveLoader: boolean = false;
    productTooltipEnable: any = false;
    displayProductTooltip: boolean = false;

    @Input() introActive;
    @ViewChild("loaderComponent") loaderComponent: LoaderComponent;

    public TooltipDataCacheKey: any;
    constructor(
        public mainService: MainService,
        private cacheService: CacheService,
        private canvasService: CanvasService,
        private pubsub: PubSubService
    ) {
        this.TooltipDataCacheKey = 'tooltipData - ' + this.mainService.baseUrl;
    }



    async ngOnInit() {

        let params = {
            isAdmin: this.mainService.isAdmin
        }, url = 'productdesigner/Index/getTooltip', cacheKey: string = this.TooltipDataCacheKey + this.mainService.isAdmin;
        await this.mainService.getData(url, params, cacheKey).then(data => {
            this.cacheService.set(this.TooltipDataCacheKey, data, { maxAge: 15 * 60 });
            this.isEnableTooltip = data.enable_tooltip;
        }).catch(err => console.log(err));


        let self = this;

        this.pubsub.$sub('tabsDataFetched', function () {
            let toolTipkeys = Object.keys(self.mainService.getAllTabs);
            for (var i = 1; i <= toolTipkeys.length; i++) {
                let tabId = self.mainService.getAllTabs[i].id;
                self.mainService.tabsFlow.filter((obj) => {
                    if (obj.indexOf(tabId) != -1) {
                        self.tooltipData.push(self.mainService.getAllTabs[i]);
                    }
                });
            }
            self.toggleIntro = true;
        });



        this.pubsub.$sub('DisplayAllProducts', (data) => {
            this.displayProductTooltip = data;
        });

        this.productTooltipEnable = (this.mainService.productTooltipData) ? this.mainService.productTooltipData[2] : 0;

        if (((this.isEnableTooltip && this.tooltipData.length > 0) || this.productTooltipEnable == 1) && !this.mainService.isAdmin) {
            this.enableIntro();
        }

    }

    getProduct() {
        let tootltipData = [];
        this.pubsub.$pub('openAllProduct');
        let productIntro = (this.mainService.productTooltipData[1] != "") ? this.mainService.productTooltipData[1] : "";
        if (productIntro != "") {
            tootltipData.push({ element: ".byi-products-wrap", intro: productIntro, position: 'right' });
            this.mainService.processToolTip(tootltipData);
        }
    }

    fetchTabData(tabId) {
        this.mainService.forceDisableTooltip = false;
        this.canvasService.currentCanvas.discardActiveObject();
        this.pubsub.$pub('introTabActive', tabId);
        let tootltipData = [];
        let getIndx = Object.keys(this.mainService.getAllTabs).indexOf(tabId);
        let tootltipObj = this.mainService.getAllTabs[getIndx + 1];
        let ids = tootltipObj.element_id.split(',');
        if (ids.length >= 1) {
            tootltipData.push({ element: ids[0], intro: tootltipObj.first_tooltip, position: 'right' });
            this.mainService.processToolTip(tootltipData);
        }
    }

    enableIntro() {
        this.pubsub.$pub('getActiveTabId', 'enableTooltip');
    }
}
