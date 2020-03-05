import { Component, OnInit, ViewChild } from '@angular/core';
import { MainService } from 'src/app/services/main.service';
import { DesignService } from 'src/app/services/design.service';
import { PubSubService } from 'angular7-pubsub';
import { BsModalRef } from 'ngx-bootstrap/modal';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
@Component({
	selector: '[save-design]',
	templateUrl: './save-design.component.html',
	styleUrls: ['./save-design.component.scss']
})
export class SaveDesignComponent implements OnInit {

	@ViewChild('saveDesignModal') saveDesignModal;
	public modalRef: BsModalRef;
	public designTitle: any;
	public submitted: boolean;

	constructor(
	            public mainService: MainService,
	            private eventService: PubSubService,
	            private designService: DesignService,
	            public translate: TranslateService
            ) {
		/**
		 * Subscribe once customer is logged in then call the save design function
		 */
		 this.eventService.$sub('customerLoggedIn', (isSave) => {
		 	if (isSave) {
				//this.saveDesign();
				this.openSaveDesign();
			}
		});		
		}

		ngOnInit() {
			this.init();
			this.eventService.$sub('designSaved', (design) => {
				this.modalRef.hide();
			});
		}

		init() {
			this.submitted = false;
			this.designTitle = '';
		}
	/**
	 * Checks if customer is logged in or not if customer is logged in then open save design modal else open login modal
	 */
	 openSaveDesign() {
	 	if (!this.mainService.canvasService.hasCanvasObjectOrBackgroundAll()) {
	 		this.mainService.swal(this.translate.instant('Alert'), this.translate.instant('Please design the product !'), "warning");
	 		return;
	 	}
	 	if (this.mainService.userLoggedIn == true) {
	 		this.init();
	 		this.modalRef = this.mainService.openThisModal(this.saveDesignModal);
	 	} else {
	 		this.eventService.$pub('openLoginModal', true);
	 	}
	 }

	/**
	 * Saves the design and publish an event
	 */
	 saveDesign() {
		// change flag that will show error messages(if any)
		this.submitted = true;

		// if errors found, return
		if (this.titleHasError()) return;

		// check for name existance
		this.proceedToSaveDesign().then((resp: any) => {
			if (resp && resp.hasOwnProperty('titleExists') && resp.titleExists == true) {
				this.mainService.swal('Already Exists', 'Design with this name already exists. Please enter different name', 'warning');
			}
		})
	}

	proceedToSaveDesign(designId: any = null) {
		// finally, save design
		let data = {
			title: this.designTitle,
			designId: designId,
			closeThisModal: this.modalRef
		};
		this.eventService.$pub('saveDesignBefore');
		return this.designService.saveDesignData(data);
	}

	titleHasError(str: any = this.designTitle) {
		return (this.submitted === true && (!str || str.length == 0 || str.trim().length == 0));
	}

	closeModal() {
		this.modalRef.hide();
	}
}
