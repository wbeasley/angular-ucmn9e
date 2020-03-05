import { LoaderComponent } from './../loader/loader.component';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CanvasService } from 'src/app/services/canvas.service';
import { MainService } from 'src/app/services/main.service';
import { PubSubService } from 'angular7-pubsub';
import { TranslateService } from '@ngx-translate/core';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
    selector: '[download]',
    templateUrl: './download.component.html',
    styleUrls: ['./download.component.scss']
})
export class DownloadComponent implements OnInit {
    downloadLinks: any = "javascript:void(0)";
    allImageIds: any;
    activeImageId: any;
    doenload: boolean = false;
    @ViewChild('downloadLink') downloadLink: ElementRef;
    fileUrl: any;
    productName: any;
    downloadDataUrl: any;
    downloadImageName: any;
    tempData: any;
    enableDownload: any = 0;

    @ViewChild('loaderComponent') loaderComponent: LoaderComponent;
    // CONSTRUCTOR
    constructor(
        private canvasService: CanvasService,
        public mainService: MainService,
        private eventService: PubSubService,
        private translate: TranslateService,
        private sanitizer: DomSanitizer
    ) {
        this.initEvents();
        this.downloadConfiguration();
    }


    downloadConfiguration() {
        let params = {},
            url = 'productdesigner/index/downloadConfiguration', cacheKey: string = 'downloadConfiguration' + this.mainService.baseUrl;
        this.mainService.getData(url, params, cacheKey).then(downloadData => {
            this.enableDownload = downloadData.enableDownload;
            if (this.enableDownload == 1) {
                this.mainService.displayDownload = true;
            }
        }).catch(err => console.log(err));
    }

    initEvents() {
        this.eventService.$sub('allcanvasCreated', (allImageIds) => {
            this.allImageIds = allImageIds;
            this.activeImageId = allImageIds[0];
        });

    }

    ngOnInit() {
        this.eventService.$sub('getCartData', (data) => {
            this.productName = data.productName;
        });
    }

    async onDownloadClick() {
        if (this.canvasService.hasCanvasObjectOrBackground(this.canvasService.currentCanvas)) {

            let url = await this.mainService.getCanvasDataUrl(true, "");
            let currentImgUrl = this.canvasService.allImagesWithIds[this.canvasService.activeImageId]['url'];
            let extension = "";
            if (currentImgUrl) {
                let getImgName = currentImgUrl.split('/');
                extension = getImgName[getImgName.length - 1].split('.').pop();
            }
            this.mainService.downloadFiles(url, extension);
        } else {
            Swal.fire({
                title: this.translate.instant('Alert'),
                text: this.translate.instant('Please design the product in order to download !'),
                type: "warning",
                confirmButtonText: this.translate.instant('OK'),
                allowOutsideClick: false
            });
        }
    }
}