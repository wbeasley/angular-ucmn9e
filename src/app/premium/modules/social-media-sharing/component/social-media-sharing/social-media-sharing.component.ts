import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { DesignService } from 'src/app/services/design.service';
import { CanvasService } from 'src/app/services/canvas.service';
import { MainService } from 'src/app/services/main.service';
import { PubSubService } from 'angular7-pubsub';
import { TranslateService } from '@ngx-translate/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DOCUMENT } from '@angular/common';
import { FacebookService, InitParams } from 'ngx-facebook';

@Component({
	selector: '[social-media-sharing]',
	templateUrl: './social-media-sharing.component.html',
	styleUrls: ['./social-media-sharing.component.scss']
})
export class SocialMediaSharingComponent implements OnInit {
	productName: any;
	design_url: any;
	option: any;
	@ViewChild('mailModal') mailModalTemplate;
	modalRef: BsModalRef;
	public recipientEmail;
	public sendMailForm: FormGroup;
	public submitted = false;

	constructor(
		public mainService: MainService,
		private designService: DesignService,
		private eventService: PubSubService,
		public canvasService: CanvasService,
		private formBuilder: FormBuilder,
		private translate: TranslateService,
		private fb: FacebookService,
	) { }


	ngAfterViewInit() {
		let self = this;
		setTimeout(function () {
			let configPaths = ['productdesigner/social_media_upload/facebook_appid'];
			// prepare url and payload
			let url = 'productdesigner/Index/getConfiguration', param = { configPaths, key: 'social-media-sharing' };
			let cacheKey: string = 'configuration-social-media-sharing' + self.mainService.baseUrl;

			// hit post request
			self.mainService.getData(url, param, cacheKey).then(resp => {
				let initParams: InitParams = {
					appId: resp[0],
					xfbml: true,
					version: 'v2.8'
				};
				if (self.fb) {
					self.fb.init(initParams);
				}
			}).catch(err => console.log(err));
		}, 500);
	}

	ngOnInit() {
		// Create and add script element for load facebook sdk
		let getFacebookSdk = document.getElementById('facebookSdk');
		if (!getFacebookSdk) {
			let script = document.createElement('script');
			script.type = 'text/javascript';
			script.src = 'https://connect.facebook.net/en_US/all.js';
			script.id = 'facebookScript';
			document.getElementsByTagName('head')[0].appendChild(script);
		};

		this.initFormGroup();

		this.eventService.$sub('getCartData', (data) => {
			this.productName = data.productName;
		});

		this.eventService.$sub('designSaved', (data) => {
			if (!this.option || this.option == '') return;
			this.design_url = (data[0].images.base.url);
			let product_url = this.mainService.baseUrl + '/productdesigner/index/index/id/' + this.mainService.productId + '/design/' + btoa(data[0].designId);

			if (this.option == "g_plush") {
				let go = "https://plus.google.com/share?";
				let title = "title=" + encodeURIComponent(this.productName);
				let url = "url=" + encodeURIComponent(product_url);
				let images = "image=" + this.design_url;
				window.open(go + url + "&" + title + "&" + images);
			} else if (this.option == "twitter") {
				//Here Twitter Sharing
				let twUrl = "http://twitter.com/share?text=My Custom Design&url=" + encodeURIComponent(product_url);
				window.open(twUrl);
			} else if (this.option == "pinterest") {
				//Here Pinterest Sharing
				let pinterestUrl = "http://pinterest.com/pin/create/button/?url=" + (product_url) + "&media=" + this.design_url + "&description=" + ("My Custom Design");
				window.open(pinterestUrl);
			} else if (this.option == "facebook_share") {
				this.getCanvasDataUrl().then(resp => {
					
					let params: any = {
						method: 'feed',
						name: this.productName,
						picture: resp.base.url
					};

					//Here Facebook Sharing
					this.fb.ui(params)
						.then((res: any) => console.log(res))
						.catch((e: any) => console.error(e));

				}).catch(err => {
					console.log("Error : ", err);
				});
			} else if (this.option == "send_mail") {

				// prepare url and payload
				let url = 'socialmediasharing/Index/sendmail', param = {
					receipentMail: this.recipientEmail,
					design_id: data[0].designId,
					product_id: this.mainService.productId
				};

				// hit post request
				this.mainService.post(url, param, true).then((resp: any) => {

					// if mail was send successfull
					if (resp && resp.status == "success") {
						this.mainService.swal(this.translate.instant("Success"), this.translate.instant("Mail has been sent"), 'success').finally(() => this.closeModal())
					}
					// if something went wrong with send mail process
					else {
						let msg = resp.log;
						if (msg.lastIndexOf("-") >= 0) msg = msg.substr(msg.lastIndexOf("-") + 2);
						this.mainService.swal(this.translate.instant("Error"), this.translate.instant(msg), 'error');
					}
				}).catch(err => {
					console.log(this.translate.instant("Error in send mail: "), err);
				});
			}
			this.option = "";
		});
	}

	initFormGroup() {
		// Send Email form builder
		this.sendMailForm = this.formBuilder.group({
			recipientEmail: ['', [Validators.required, Validators.email]]
		});
	}

	Sharing(option) {
		this.option = option;
		let data = {
			title: this.productName,
			disablePopup: true
		};
		if (this.option == "send_mail") {

			// set flag
			this.submitted = true;

			// stop here if form is invalid
			if (this.sendMailForm.invalid) {
				return;
			}

			// When user hits on send mail button
			this.designService.saveDesignData(data);
		} else {
			this.designService.saveDesignData(data);
		}
	}

	openModal() {
		this.modalRef = this.mainService.openThisModal(this.mailModalTemplate);
	}

	closeModal() {
		this.modalRef.hide();
	}

	// get control object for login form
	get mf() { return this.sendMailForm.controls; }

	async getCanvasDataUrl(): Promise<any> {

		return new Promise(async (resolve, reject) => {

			let currentImageId = this.canvasService.activeImageId;
			let response: any;

			response = await this.mainService.getCanvasDataUrl(false, currentImageId, false);
			(response && response.base && response.base.url) ? resolve(response) : reject(response);
		});
	}

}
