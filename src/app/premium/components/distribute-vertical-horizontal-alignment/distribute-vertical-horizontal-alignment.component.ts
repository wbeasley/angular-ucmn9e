import { PubSubService } from 'angular7-pubsub';
import { CanvasService } from 'src/app/services/canvas.service';
import { Component, OnInit } from '@angular/core';
import { RightPanelService } from 'src/app/essentials/components/right-panel/right-panel.service';
import { UpdateObjectService } from 'src/app/services/update-object.service';

@Component({
  selector: '[distribute-vertical-horizontal-alignment]',
  templateUrl: './distribute-vertical-horizontal-alignment.component.html',
  styleUrls: ['./distribute-vertical-horizontal-alignment.component.scss']
})
export class DistributeVerticalHorizontalAlignmentComponent implements OnInit {

  // tooltip messages
  public horizontalTooltip = 'Distribute Horizontally' + '<br/>' + '(must select 3 or more objects)';
  public verticalTooltip = 'Distribute Vertically' + '<br/>' + '(must select 3 or more objects)';

  // boolean value that will be used to enable/disable tool option
  public enableForThreeObjects: boolean;

  constructor(
    public canvasService: CanvasService,
    protected eventService: PubSubService,
    protected rightPanelService: RightPanelService,
    private updateObjectService: UpdateObjectService
  ) { }

  ngOnInit() {
    this.init();
    this.subscribeEvents();
  }

  init() {
    this.enableForThreeObjects = this.enableForThreeObjectsFun();
  }

  subscribeEvents() {
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
  }

  enableForThreeObjectsFun(): boolean {
    let totalAddedObjects: any = (this.canvasService.currentCanvas && this.canvasService.currentCanvas.getActiveObjects()) ? this.canvasService.currentCanvas.getActiveObjects().length : 0;
    if (totalAddedObjects > 2) return false;
    return true;
  }

  topObjectSpacing() {

    // return if disabled
    if (this.enableForThreeObjects) return;

    // variable declaration
    let canvas = this.canvasService.currentCanvas,
      activeGroup = canvas.getActiveObject(),
      allObjs = canvas.getActiveObjects();

    let topMostObj: any = this.rightPanelService.findObjMargin(allObjs, false, 'top'),
      bottomMostObj: any = this.rightPanelService.findObjMargin(allObjs, true, 'top'),
      totalHeight: any = this.calcTotalHeightOfAllObj(allObjs),
      properties: any = {}, params: any = {
        obj: [], properties: [], crudServiceString: 'this.multipleObjectsUpdateService',
        selectedObjs: allObjs
      };
    this.rightPanelService.canvasService.deselectAllObjects();

    topMostObj = canvas.getObjects().find(o => o.id == topMostObj.id);
    bottomMostObj = canvas.getObjects().find(o => o.id == bottomMostObj.id);
    // calculate difference
    let diff = (activeGroup.height - totalHeight) / (allObjs.length - 1), prevObj: any = topMostObj,
      finalTopVal = null;

    // traverse array of all selected objects
    // set top value of each object except top and bottom most objects
    allObjs.filter(obj => {
      if (obj.id != topMostObj.id && obj.id != bottomMostObj.id) {
        finalTopVal = diff + (prevObj.height * prevObj.scaleY) + prevObj.top;
        params.properties.push({ top: finalTopVal });
        params.obj.push(obj);

        // set current object as prev object
        // we will assign current object's top value based on
        // prev object's top and height values
        prevObj = Object.assign({}, obj);
        prevObj.top = finalTopVal;
      }
    });
    if (params.obj.length && params.properties.length) {
      this.rightPanelService.canvasService.objectCRUD(params);
    }
  }

  calcTotalHeightOfAllObj(allObjs) {

    // init totalHeight variable 
    let totalHeight: number = 0;

    // traverse through selected objects
    // and calculate total height
    allObjs.filter(obj => {
      totalHeight += (obj.height * obj.scaleY);
    });

    // finally return
    return totalHeight;
  }

  leftObjectSpacing() {

    // return if disabled
    if (this.enableForThreeObjects) return;

    // variable declaration
    let canvas = this.canvasService.currentCanvas,
      activeGroup = canvas.getActiveObject(),
      allObjs = canvas.getActiveObjects();
    this.rightPanelService.canvasService.deselectAllObjects();
    let leftMostObj: any = this.rightPanelService.findObjMargin(allObjs, false, 'left'),
      rightMostObj: any = this.rightPanelService.findObjMargin(allObjs, true, 'left'),
      totalWidth: any = this.calcTotalWidthOfAllObj(allObjs),
      properties: any = {}, params: any = {
        obj: [], properties: [], crudServiceString: 'this.multipleObjectsUpdateService',
        selectedObjs: allObjs
      };

    if (leftMostObj.id == rightMostObj.id) {
      leftMostObj = this.rightPanelService.findObjMargin(allObjs, true, 'left', leftMostObj);
    }
    // calculate difference
    let diff = (activeGroup.width - totalWidth) / (allObjs.length - 1), prevObj: any = leftMostObj,
      finalLeftValue = null;

    // traverse array of all selected objects
    // set top value of each object except top and bottom most objects
    allObjs.filter(obj => {

      if (obj.id != leftMostObj.id && obj.id != rightMostObj.id) {

        // prepare property value
        finalLeftValue = diff + (prevObj.width * prevObj.scaleX) + prevObj.left;
        params.properties.push({ left: finalLeftValue });
        params.obj.push(obj);

        // set current object as prev object
        // we will assign current object's top value based on
        // prev object's top and height values
        prevObj = Object.assign({}, obj);
        prevObj.left = finalLeftValue;
      }
    });
    if (params.obj.length && params.properties.length) {
      this.rightPanelService.canvasService.objectCRUD(params);
    }
  }

  calcTotalWidthOfAllObj(allObjs) {

    // init totalHeight variable
    let totalWidth: number = 0;

    // traverse through selected objects
    // and calculate total height
    allObjs.filter(obj => {
      totalWidth += (obj.width * obj.scaleX);
    });

    // finally return
    return totalWidth;
  }
}
