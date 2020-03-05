import { MainService } from 'src/app/services/main.service';
import { Component, OnInit } from '@angular/core';
import { PubSubService } from 'angular7-pubsub';
declare var fabric: any;
@Component({
  selector: '[object-grouping]',
  templateUrl: './object-grouping.component.html',
  styleUrls: ['./object-grouping.component.scss']
})
export class ObjectGroupingComponent implements OnInit {

  public disableForSelectAll: boolean;
  public selectionArea: any = 0;

  constructor(
    public mainService: MainService,
    protected eventService: PubSubService
  ) {
    mainService.enableMultipleSelection = true;
  }

  ngOnInit() {
    this.init();
    this.subscribeEvents();
  }

  init() {
    this.disableForSelectAll = this.disableForSelectAllFun();
  }

 
  subscribeEvents() {
    this.eventService.$sub('imageSideChanged', () => {
			this.init();
		});
    this.eventService.$sub('objectSelectionCreated', () => {
      this.init();
    });
    this.eventService.$sub('objectSelectionUpdated', () => {
      this.init();
    });
    this.eventService.$sub('objectSelectionCleared', () => {
      this.init();
    });
    this.eventService.$sub('objectUpdated', () => {
      this.init();
    });
    this.eventService.$sub('objectRemoved', () => {
      this.init();
    });    
  }

  disableForSelectAllFun(): boolean {
    let ultimateLockEnable: boolean;
    let totalAddedObjects: any = 0;
    if (this.mainService.canvasService.currentCanvas) {
      this.mainService.canvasService.getObjects().forEach(function (obj) {
        if (obj.ultimatelock != true && obj.selectable == true) totalAddedObjects++;
      });
    }
    if (totalAddedObjects > 1) return false;
    return true;
  }

  selectDeselectAll(option: string = '', objectList: any = null) {
    if (this.disableForSelectAll === true) return;
    let canvas = this.mainService.canvasService.currentCanvas;
    objectList = (objectList == null) ? this.mainService.canvasService.getObjects() : objectList;
    let temp: any = [];
    objectList.forEach(function (obj) {
      if (obj.ultimatelock != true && obj.selectable == true) {
        temp.push(obj);
      }
    });

    canvas.discardActiveObject();
    if (option == "select") {
      let sel = new fabric.ActiveSelection(temp, {
        canvas: canvas,
      });
      canvas.setActiveObject(sel);
      this.selectionArea = true;
    } else {
      this.selectionArea = false;
    }
    canvas.requestRenderAll();
  }

}
