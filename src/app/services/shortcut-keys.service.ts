import { CanvasService } from './canvas.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ShortcutKeysService {

  // cut/copy/paste object variables
  public keyMap: any = { 17: false, 67: false, 86: false, 88: false, 65: false };
  public copiedObjects: any = [];
  public cutObjects: any = {};

  constructor(
    public canvasService: CanvasService
  ) {
    this.init();
  }

  init() {
    document.onkeydown = ((event: KeyboardEvent) => {
      this.checkForCopyPaste(event.keyCode);
      let _this = this;
      this.canvasService.currentDocumentEvent = event;
      if (event && event.shiftKey) {
        _this.canvasService.checkObjectSelection();
      }
      if (event.keyCode === 46) { /**  Delete key **/
        let totalModals = this.canvasService.modalService.getModalsCount();
        if (totalModals > 0) return;
        let elements: any = document.getElementsByClassName("noDeleteObject");
        let removeObject = 0;
        for (let ctl of elements) {
          if (ctl && ctl.selectionStart) {
            let startPos = ctl.selectionStart;
            let endPos = ctl.selectionEnd;
            if (ctl.value.length == startPos && ctl.value.length == endPos) {
              removeObject++;
            }
          } else {
            removeObject++;

          }
        }
        if (removeObject == elements.length) {
          this.canvasService.removeCurrentObject();
        }
      }
    });
    this.canvasService.eventService.$sub('canvasObjectRemoved', (object) => {
      let objects = object.target;
      let self = this;
      if (Array.isArray(objects)) {
        objects.filter(obj => {
          let index = (self.copiedObjects && self.copiedObjects.length && obj.type != 'textbox') ? self.copiedObjects.indexOf(obj) : -1;
          if (index >= 0) {
            self.copiedObjects.splice(index, 1);
          }
        });
      } else {
        let index = (self.copiedObjects && self.copiedObjects.length && objects.type != 'textbox') ? self.copiedObjects.indexOf(objects) : -1;
        if (index >= 0) {
          self.copiedObjects.splice(index, 1);
        }
      }
    });
  }

  /**
   * This function will manage cut/copy/paste feature for fabric canvas
   * 
   * @param pressedKey 
   */
  checkForCopyPaste(pressedKey) {

    // if pressed key is either of ctrl/c/x/v
    if (pressedKey in this.keyMap) {

      // set flag of that particular map as true      
      this.keyMap[pressedKey] = true;

      // when user presses ctrl key
      // we will set false for c,x and v to avoid conflicts
      if (pressedKey == 17) {
        this.keyMap[65] = false;
        this.keyMap[67] = false;
        this.keyMap[86] = false;
        this.keyMap[88] = false;
      }

      // ctrl+a
      else if (this.keyMap[17] && this.keyMap[65]) {
        event.preventDefault();
        this.canvasService.selectTheseObjects([], true);
      }

      // ctrl+c
      else if (this.keyMap[17] && this.keyMap[67]) {

        // prevent default behaviour
        event.preventDefault();

        // get list of objects
        let objList = this.canvasService.currentCanvas.getActiveObjects();

        // if obj list is available
        if (objList && objList.length) {

          // reset copied objects list
          this.copiedObjects = [];

          // reset cut objects list
          this.cutObjects = {};

          // traversal
          objList.filter(currObj => {
            this.copiedObjects.push(currObj);
          });
        }

        // after copied successfully
        // set copy flag as false
        this.keyMap[67] = false;
      }

      // ctrl+x
      else if (this.keyMap[17] && this.keyMap[88]) {
        // prevent default behaviour
        event.preventDefault();

        // get list of objects
        let objList = this.canvasService.currentCanvas.getActiveObjects();

        // if obj list is available
        if (objList && objList.length) {

          // reset copied objects list
          this.copiedObjects = [];

          // reset cup objects list
          this.cutObjects = { objects: [], canvas: this.canvasService.currentCanvas };

          // prepare param object to remove current selected objects
          let params = { obj: null, properites: {}, crudServiceString: 'this.removeObjectService' };

          // traversal
          objList.filter(currObj => {
            this.cutObjects.objects.push(currObj);
            params.obj = currObj;
            this.canvasService.objectCRUD(params);
          });
        }

        // after copied successfully
        // set copy flag as false
        this.keyMap[88] = false;
      }

      // ctrl+v
      else if (this.keyMap[17] && this.keyMap[86]) {

        // prevent default paste behaviour
        // event.preventDefault();

        // we will check whether to paste copied object or text 
        let inputFields: any = document.getElementsByClassName('byi-input'), allowPasteObj: boolean = true,
          domElement = document.activeElement;

        // if any input field exists
        if (inputFields && inputFields.length) {

          // traverse through each field
          for (let key in inputFields) {

            // check if active dom element exists in array list
            if (inputFields[key] == domElement) {

              // if yes, set flag to prevent pasting canvas object
              allowPasteObj = false;
              break;
            }
          }
        }

        // for ctrl+c
        if (this.copiedObjects && this.copiedObjects.length && allowPasteObj) {
          event.preventDefault();
          this.pasteCopiedObjects();
        }

        // for ctrl+x
        else if (this.cutObjects && this.cutObjects.hasOwnProperty('objects') && this.cutObjects.hasOwnProperty('canvas') && this.cutObjects.objects.length && allowPasteObj) {
          event.preventDefault();
          this.pasteCutObjects();
        }
      }

      // if any other key is been pressed,
      // reset all flags to false
    } else {
      this.resetKeyMap();
    }
  }

  /**
   * 
   */
  pasteCopiedObjects() {

    // prepare params obj for object crud
    let params = {
      obj: null, properties: {}, crudServiceString: 'this.insertObjectService',
      setActive: false
    };

    // flag number for position
    let preventObject: boolean;

    // copied object traversal
    this.copiedObjects.filter((copiedObj, index) => {

      // flag number incrementation
      preventObject = false;

      // if object is allowed to be added      
      // object clone
      copiedObj.clone(tmpObj => {

        // check for object limit
        if (this.canvasService.checkObjectLimitByTabName(copiedObj.tab) == true) {
          let errorEventName = (copiedObj.tab == 'text') ? 'displayTextLimitError' : ((copiedObj.tab == 'clipart') ? 'displayClipartLimitError' : 'displayUploadImageLimitError');
          this.canvasService.eventService.$pub(errorEventName);
          preventObject = true;
        }

        // 
        if (preventObject == false) {
          // check if 
          this.findAndRemoveQuoteobject(copiedObj);

          this.canvasService.deselectAllObjects();

          // set position of cloned object
          tmpObj.left = copiedObj.left + 5;
          tmpObj.top = copiedObj.top + 5;

          // set cloned object to params obj
          params.obj = tmpObj;

          // copy custom object properites
          this.canvasService.objProperties.filter(customProperty => {
            if (customProperty != 'id') {
              params.properties[customProperty] = copiedObj[customProperty];
            }
          });

          // append this property which will prevent auto best fit
          params.properties = Object.assign(params.properties, { ignoreBestFit: true });

          // set temp flag, we will fetch this object and forcefully select the same
          // after they are pasted(added on canvas)
          params.properties = Object.assign(params.properties, { pastedObj: true });

          // add object
          this.canvasService.objectCRUD(params);

          // 
          this.copiedObjects[index] = tmpObj;
          this.canvasService.objProperties.filter(customProperty => {
            if (customProperty != 'id') {
              this.copiedObjects[index][customProperty] = copiedObj[customProperty];
            }
          });
          setTimeout(() => {
            this.selectPastedObjects();
          }, 50);
        }
      });
    });
  }

  getThisObject(obj) {
    let allCanvas = this.canvasService.containerCanvases, key, allObjs, find;
    for (key in allCanvas) {
      allObjs = this.canvasService.getObjects(allCanvas[key]);
      find = allObjs.find(o => o.id == obj.id);
      if (find) break;
    }
    return find;
  }

  /**
   * 
   */
  pasteCutObjects() {
    // prepare params obj for object crud
    let params = {
      obj: null, properties: {}, crudServiceString: 'this.insertObjectService'
    };

    // init temp object to store iterating canvas object
    let copiedObj: any = null;

    // traverse through each copied object
    for (let key in this.cutObjects.objects) {

      // store current obj to temp var
      copiedObj = this.cutObjects.objects[key];

      // check if current obj is of type textbox(quote)
      this.findAndRemoveQuoteobject(copiedObj);

      // set cloned object to params obj
      params.obj = copiedObj;

      // copy custom object properites
      this.canvasService.objProperties.filter(customProperty => {
        params.properties[customProperty] = copiedObj[customProperty];
      });

      // append this property which will prevent auto best fit
      params.properties = Object.assign(params.properties, { ignoreBestFit: true });
      params.properties = Object.assign(params.properties, { pastedObj: true });

      // add object
      this.canvasService.objectCRUD(params);

      // 
      setTimeout(() => {
        this.selectPastedObjects();
      }, 50);
    }

    // we will allow to move object only once
    if (params.obj != null) {
      this.cutObjects = {};
    }
  }

  findAndRemoveQuoteobject(obj) {
    if (obj.type == 'textbox') {

      // check if current canvas already having quote object
      let isQuoteExist = this.canvasService.isObjectExists('type', 'textbox');

      if (isQuoteExist) {
        let quoteParam = {
          obj: isQuoteExist,
          properties: {},
          crudServiceString: 'this.removeObjectService'
        }
        this.canvasService.objectCRUD(quoteParam);
        this.canvasService.deselectAllObjects();
        // continue;
      }
    }
  }

  selectPastedObjects() {
    // select newly added objects
    let selectTheseObj: any = this.canvasService.getObjects().filter(obj => obj.hasOwnProperty('pastedObj'));

    // if found
    if (selectTheseObj && selectTheseObj.length) {

      // select this objects
      this.canvasService.selectTheseObjects(selectTheseObj);

      // remove flag
      selectTheseObj.filter(obj => {
        delete obj.pastedObj;
      });
    }
  }

  /**
   * Reset all flag values to false
   */
  resetKeyMap() {
    for (let key in this.keyMap) {
      this.keyMap[key] = false;
    }
  }
}
