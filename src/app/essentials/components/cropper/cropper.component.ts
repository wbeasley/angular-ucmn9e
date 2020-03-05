import { CanvasService } from 'src/app/services/canvas.service';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AddImageService } from 'src/app/services/add-image.service';
import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MainService } from 'src/app/services/main.service';
import Cropper from 'cropperjs';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'cropper',
  templateUrl: './cropper.component.html',
  styleUrls: ['./cropper.component.scss']
})
export class CropperComponent implements OnInit {

  // Basic Variables
  @ViewChild('cropperModal') cropperModal;
  public currentImage: string;
  modalRef: BsModalRef;

  // Cropper handler
  @ViewChild('currentCanvasImage') image;
  cropper: any;
  cropperSettings: any;
  croppedImage: any;

  constructor(
    private addImageService: AddImageService,
    private mainService: MainService,
    private cdr: ChangeDetectorRef,
    private canvasSevice: CanvasService,
    private translate: TranslateService
    ) { }

  ngOnInit() {
    this.initData();
  }

  initData() {
    this.cropperSettings = {
      checkCrossOrigin: false,
      viewMode: 2,
      background: false,
      zoomOnWheel: false,
      minContainerWidth: 100,
      minContainerHeight: 150,
      ready: () => {
        this.applyCustomClassesToCropper();
      }
    };
  }

  cropImage(imageUrl: string) {
    // this.cropperModal.show();
    let obj = this.canvasSevice.getActiveObject();
    this.currentImage = obj.getSrc();
    this.modalRef = this.mainService.openThisModal(this.cropperModal, 'byi-img-crop-popup');
    this.setCropper();
  }

  setCropper() {
    let self = this;
    setTimeout(() => {
      let img: any = document.getElementById('currentCanvasImage');
      let image: any = new Image();
      image.src = img.src;
      image.crossOrigin = 'Anonymous';
      image.onload = () => {
       self.cropper = new Cropper(img, this.cropperSettings);
       self.cdr.detectChanges();
     };

   }, 100);
  }

  saveCroppedImage() {
    this.canvasSevice.eventService.$pub('showMainLoader');
    this.croppedImage = this.cropper.getCroppedCanvas().toDataURL();

    let params = {
      imageData: this.croppedImage
    }, url = "productdesigner/index/saveCroppedImage", self = this;
    this.mainService.post(url, params).then((resp: any) => {
      self.addCroppedImageToCanvas(resp.outputImage);
    }).catch(err => {
      console.log(this.translate.instant("Error in save cropped image: "), err);
    }).finally(() => {
      this.canvasSevice.eventService.$pub('hideMainLoader');
    });
  }

  addCroppedImageToCanvas(croppedImage) {
    let img = croppedImage;
    // let img = "assets/img/15559082051519329576.png";
    this.addImageService.updateImage(img);
    this.modalRef.hide();
  }

  applyCustomClassesToCropper() {
    let cropperModal = document.getElementsByClassName('cropper-modal'), cropperImg = document.getElementsByClassName('cropper-hide');
    if (cropperModal && cropperModal[0] && cropperModal[0].classList) {
      cropperModal[0].setAttribute('style', 'background: #ccc');
    }
    if (cropperImg && cropperImg[0] && cropperImg[0].classList) {
      cropperImg[0].setAttribute('style', 'border: dotted 1px #f00')
    }
  }
}
