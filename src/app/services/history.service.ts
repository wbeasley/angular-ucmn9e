import { Injectable } from '@angular/core';
import { InsertObjectService } from './insert-object.service';
import { UpdateObjectService } from './update-object.service';
import { RemoveObjectService } from './remove-object.service';
import { ImageEffectsService } from 'src/app/common/components/image-effects/image-effects.service';
import { PubSubService } from 'angular7-pubsub';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {

  public undoStack: any = {};
  public redoStack: any = {};
  public canvasService: any;

  constructor(
    private eventService: PubSubService
  ) {
    // This check for if object is modified due to inbuilt fabric property
    let self = this;
    this.eventService.$sub('canvasObjectModified', (obj) => {

      if (obj && obj.hasOwnProperty('tab')) {

        let currentState = obj._stateProperties;
        let properties = {
          fontSize: currentState.fontSize,
          left: currentState.left,
          top: currentState.top,
          angle: currentState.angle,
          scaleX: currentState.scaleX,
          scaleY: currentState.scaleY
        };
        let params = {
          obj: obj,
          properties: properties,
          crudServiceString: 'this.updateObjectService',
          isObjectModify: true
        };
        this.canvasService.objectCRUD(params);
      } else {
        let selectedObjects = self.canvasService.currentCanvas.getActiveObjects(),
          currentState = null, params = {
            obj: selectedObjects, properties: null, crudServiceString: 'this.multipleObjectStateUndoRedoService'
          };
        currentState = obj._stateProperties;
        params.properties = Object.assign({}, {
          left: currentState.left,
          top: currentState.top,
          scaleX: currentState.scaleX,
          scaleY: currentState.scaleY,
          angle: currentState.angle
        });
        params.obj = obj;
        // self.canvasService.deselectAllObjects();

        // let tmpObj = null;
        // selectedObjects.filter(currObj => {
        //   tmpObj = self.canvasService.findThisObjectFromAllCanvas(currObj);
        //   stateProperties = Object.assign({}, tmpObj._stateProperties);
        //   properties.push(Object.assign({}, {
        //     left: stateProperties.left,
        //     top: stateProperties.top
        //   }));
        // });
        // params.properties = [].concat(properties);
        self.canvasService.objectCRUD(params);
      }
    });
  }

  initCanvasService(canvasService) {
    this.canvasService = canvasService;
  }
  /**
   * This Method push performed operation into stack
   * @param {any} crudService [Operation service insert/update/remove]
   */
  push(crudService: any) {
    let designarea_id = this.canvasService.currentCanvas.designarea_id;
    if (this.undoStack[designarea_id] == undefined) {
      this.undoStack[designarea_id] = [];
    }
    this.undoStack[designarea_id].push(crudService);
    this.eventService.$pub('undoRedo');
  }

  /**
   * This method will pop last executed operation and trigger its unexec method
   */
  undo() {
    let designarea_id = this.canvasService.currentCanvas.designarea_id;
    let crudService = this.undoStack[designarea_id].pop();
    if (crudService) {
      crudService.unexec();
    }

    // Push undostack value into redostack
    if (this.redoStack[designarea_id] == undefined) {
      this.redoStack[designarea_id] = [];
    }
    this.redoStack[designarea_id].push(crudService);
  }
  /**
   * This method will pop value from redostack and trigger its exec method
   */
  redo() {
    let designarea_id = this.canvasService.currentCanvas.designarea_id;
    let crudService = this.redoStack[designarea_id].pop();
    if (crudService) {
      crudService.exec();
    }
    this.undoStack[designarea_id].push(crudService);

  }
  /**
   * Clear undo stack and redo stack
   */
  clear() {
    this.undoStack = {};
    this.redoStack = {};
  }
}
