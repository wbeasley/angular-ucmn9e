import { Component, OnInit } from '@angular/core';
import { PubSubService } from 'angular7-pubsub';
import { HistoryService } from 'src/app/services/history.service';
import { CanvasService } from 'src/app/services/canvas.service';
import { MainService } from 'src/app/services/main.service';
import Swal from 'sweetalert2';
@Component({
	selector: 'designarea-controls',
	templateUrl: './designarea-controls.component.html',
	styleUrls: ['./designarea-controls.component.scss']
})
export class DesignareaControlsComponent implements OnInit {

	public disableUndo: any = true;
	public disableRedo: any = true;
	isToggle: any = false;
	constructor(
		public mainService: MainService,
		private eventService: PubSubService,
		private historyService: HistoryService,
		public canvasService: CanvasService,
	) {
		this.eventService.$sub('closeHeaderIcon', () => {
			this.isToggle = false;
		});
		this.eventService.$sub('undoRedo', () => {
			this.toggleUndoRedo();
		});
		this.eventService.$sub('imageSideChanged', () => {
			this.toggleUndoRedo();
		});
	}
	toggleUndoRedo() {
		let designarea_id = this.canvasService.currentCanvas.designarea_id;
		if (this.historyService.undoStack[designarea_id] && this.historyService.undoStack[designarea_id].length > 0) {
			this.disableUndo = false;
		} else {
			this.disableUndo = true;
		}
		if (this.historyService.redoStack[designarea_id] && this.historyService.redoStack[designarea_id].length > 0) {
			this.disableRedo = false;
		} else {
			this.disableRedo = true;
		}
	}

	ngOnInit() { }

	changeZoom(reset) {
		if (reset) {
			this.canvasService.zoom = 0;
		}
		this.eventService.$pub('zoomCanvas', this.canvasService.zoom);
	}
	resetDesign() {
		Swal.fire({
			title: 'Are you sure to reset?',
			text: "It will remove the unsaved designs from the design area.",
			type: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes',
			allowOutsideClick: false
		}).then((resetDesign) => {
			if (resetDesign.value) {
				this.canvasService.clearCanvas(null);
				if (Object.keys(this.mainService.lastSavedData).length > 0) {
					this.canvasService.loadDesign(this.mainService.lastSavedData);
				}
				this.canvasService.clearHistory();
				this.toggleUndoRedo();
			}
		})
	}

	undo() {
		this.historyService.undo();
		this.toggleUndoRedo();
	}
	redo() {
		this.historyService.redo();
		this.toggleUndoRedo();
	}
	hideFab() {
		let byiFabIcon = document.querySelector('.byi-fab');
		if (!byiFabIcon) return;
		document.querySelector('.byi-fab').classList.toggle("hide");
	}
}
