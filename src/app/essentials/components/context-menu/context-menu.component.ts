import { Component, OnInit } from '@angular/core';
import { PubSubService } from 'angular7-pubsub';
import { CanvasService } from "src/app/services/canvas.service";
import { RightPanelService } from '../right-panel/right-panel.service';

@Component({
	selector: 'context-menu',
	templateUrl: './context-menu.component.html',
	styleUrls: ['./context-menu.component.scss']
})
export class ContextMenuComponent implements OnInit {

	public hideContextMenu: any = true;
	constructor(
		private eventService: PubSubService,
		public canvasService: CanvasService,
		public rightPanelService: RightPanelService
		) {
		this.eventService.$sub('updateContextMenu', (obj) => {
			this.hideContextMenu = (this.hideContextMenu == true) ? null : true;
			if(this.hideContextMenu){
				if(document.getElementsByClassName("total-sides").length > 0){
					document.getElementsByClassName("total-sides")[0].classList.remove("context-menu-open");
				}
			}else{
				if(document.getElementsByClassName("total-sides").length > 0){
					document.getElementsByClassName("total-sides")[0].classList.add("context-menu-open");
				}
			}
			this.updateContextMenu(obj);
		});
		this.eventService.$sub('objectUpdated', (obj) => {
			if (obj.length > 0) {
				this.updateContextMenu(obj[0]);
			} else {
				this.updateContextMenu(obj);
			}
		});

		this.eventService.$sub('canvasObjectMoving', (obj) => {
			this.removeContextMenu();
		});

		this.eventService.$sub('objectRemoved', () => {
			this.removeContextMenu();
		});
		this.eventService.$sub('objectSelectionCleared', () => {
			this.removeContextMenu();
		});
		this.eventService.$sub('objectSelectionUpdated', () => {
			this.removeContextMenu();
		});
		this.eventService.$sub('imageSideChanged', () => {
			if (this.canvasService && this.canvasService.currentCanvas) {
				let obj = this.canvasService.currentCanvas.getActiveObject();
				if (!obj) {
					this.removeContextMenu();
				}
			}
		});

	}

	ngOnInit() {
	}

	removeContextMenu() {
		this.hideContextMenu = true;
		if(document.getElementsByClassName("total-sides").length > 0){
			document.getElementsByClassName("total-sides")[0].classList.remove("context-menu-open");
		}
	}
	updateContextMenu(obj) {
		this.rightPanelService.enableForMultipleObject();
		this.rightPanelService.manageFlagForEnableDisable();
		if (!obj) return;
		let contextMenu: any = document.querySelector(".context-menu");
		let element: any = document.querySelector(".product-designer-main-content.active");
		let dim = this.canvasService.currentCanvas.dim;
		let left = element.offsetLeft + ((parseFloat(dim.x1) - this.canvasService.clipX[dim.designareaId] / 2) / this.canvasService.scaleFactor);
		let top = element.offsetTop + ((parseFloat(dim.y1) - this.canvasService.clipY[dim.designareaId] / 2) / this.canvasService.scaleFactor);
		let matrix = obj.calcTransformMatrix();
		let absCoords: any = {
			left: matrix[4],
			top: obj.top + (obj.height * obj.scaleY)
		};
		if (obj && obj.angle && obj.oCoords && obj.oCoords.mb && obj.oCoords.mb.x && obj.oCoords.mb.y) {
			absCoords.left = obj.oCoords.mb.x,
			absCoords.top = obj.oCoords.mb.y
		}
		contextMenu.style.left = (left + absCoords.left - 10) + 'px';
		contextMenu.style.top = (top + absCoords.top) + 'px';
	}
}
