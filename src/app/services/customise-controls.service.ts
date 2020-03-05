import { Injectable } from '@angular/core';
import { CanvasService } from '../services/canvas.service';
import { PubSubService } from 'angular7-pubsub';
import 'fabric-customise-controls';
declare var fabric: any;

@Injectable({
    providedIn: 'root'
})
export class CustomiseControlsService {

    constructor(private canvasService: CanvasService, private eventService: PubSubService) {
        this.eventService.$sub('objectAdded', (obj) => {
            this.customizeControls(obj);
        });
        this.eventService.$sub('objectSelectionCreated', (obj) => {
            this.customizeControls(obj);
        });
         this.eventService.$sub('objectSelectionUpdated', (obj) => {
            this.customizeControls(obj);
        });
    }

    customizeControls(obj) {
        let self = this;
        if (obj) {
            obj.setControlsVisibility({
                mt: true,
                tl: true,
                tr: true,
                bl: true,
                br: true,
                mtr: false,
                mb: true, // midle bottom
                ml: false, // middle left
                mr: false, // I think you get it
            });
            self.canvasService.currentCanvas.renderAll()
        }
        fabric.Canvas.prototype.customiseControls({
            tl: {
                settings: {
                    centeredScaling: true,
                },
                action: 'scale'
            },
            tr: {
                settings: {
                    centeredScaling: true,
                },
                action: 'scale',
            },
            bl: {
                settings: {
                    centeredScaling: true,
                },
                action: 'scale',
            },
            br: {
                settings: {
                    centeredScaling: true,
                },
                action: 'scale',
            },
            mt: {
                action: 'rotate',
                cursor: 'hand',
            },
            mb: {
                action: function(e, target) {
                    self.eventService.$pub('updateContextMenu',target);
                },
                cursor: 'hand',
            },
        });

        if (navigator.userAgent.indexOf('MSIE') == -1 && navigator.userAgent.indexOf('Trident/') == -1) {
            obj.customiseCornerIcons({
                settings: {
                    cornerSize: this.canvasService.cornerSize,
                    cornerShape: 'circle',
                    cornerBackgroundColor: 'white',
                    cornerPadding: 10
                },
                tl: {
                    icon: 'assets/img/svg/top-left-arrow.svg',
                },
                tr: {
                    icon: 'assets/img/svg/top-right-arrow.svg',
                },
                bl: {
                    icon: 'assets/img/svg/bottom-left-arrow.svg',
                },
                br: {
                    icon: 'assets/img/svg/bottom-right-arrow.svg',
                },
                mt: {
                    icon: 'assets/img/svg/rotate-to-left-button.svg',
                }, 
                mb: {
                    icon: 'assets/img/three-dots-menu.svg',
                },
            }, function () {
                self.canvasService.currentCanvas.renderAll();
            });
        } else {
            obj.customiseCornerIcons({
                settings: {
                    cornerSize: this.canvasService.cornerSize,
                    cornerShape: 'circle',
                    cornerBackgroundColor: 'white',
                    cornerPadding: 10
                },
                tl: {
                    icon: '',
                },
                tr: {
                    icon: '',
                },
                bl: {
                    icon: '',
                },
                br: {
                    icon: '',
                },
                mt: {
                    icon: '',
                },
                mb: {
                    icon: '',
                },
            }, function () {
                self.canvasService.currentCanvas.renderAll();
            });
        }
    }

}
