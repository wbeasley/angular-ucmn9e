import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Component, OnInit, ViewChild, Input, ChangeDetectorRef, ElementRef } from '@angular/core';
import { MainService } from 'src/app/services/main.service';
import { TemplateService } from './template.service';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { PubSubService } from 'angular7-pubsub';
import { LoaderComponent } from 'src/app/essentials/components/loader/loader.component';
import { CacheService, CacheStoragesEnum } from 'ng2-cache';
@Component({
	selector: '[design-templates]',
	templateUrl: './design-templates.component.html',
	styleUrls: ['./design-templates.component.scss']
})
export class DesignTemplatesComponent implements OnInit {

	@ViewChild('saveTemplateModal') saveTemplateModal;
	@Input() loadContent;
	public modalRef: BsModalRef;
	public templateCategories;

	@ViewChild("loaderComponent") loaderComponent: LoaderComponent;
	@ViewChild('scrollToBottom') private ScrollContainer: ElementRef;
	@ViewChild('mainSection') private mainSection: ElementRef;
	public getCurrentTabName;
	public accordianId;
	public subTabsData;
	public currentTab: any = 7;
	public selectedTemplateCat: any = [];
	public searchText: any = "";
	public loadmore: any = 1;
	public templates: any = [];
	public templateImgUrl: any = '';
	public isEnableloadmore: boolean = false;
	public checkScroll: boolean = false;
	public limit: any = 12;
	// infinite scroll
	public customPlaceholderArr: any = [];
	public showPlaceholder: boolean;
	public allowPlaceholderLoader: boolean = false;
	public designSearchText: any = '';
	public selectedStaus = 1;
	public selectedStausName = this.translate.instant('Enable');

	public statusData = [
	{ id: 1, name: this.translate.instant('Enable') },
	{ id: 0, name: this.translate.instant('Disable') }
	];

	// Form Group object
	public designTemplateForm: FormGroup;

	constructor(
		public mainService: MainService,
		public templateService: TemplateService,
		private eventService: PubSubService,
		private cacheService: CacheService,
		public cdr: ChangeDetectorRef,
		public translate: TranslateService,
		private formBuilder: FormBuilder
		) {
		this.eventService.$sub('getSubTabs', (mainTabId) => {
			if (mainTabId == this.currentTab && !this.subTabsData) {
				this.getSubTabs(mainTabId);
			}
			this.getCurrentTabName = this.mainService.getAllTabs[this.currentTab]['label'];
		});
	}

	ngOnInit() {
		this.init();
		if ((this.mainService.isAdmin == true && this.loadContent == 'header') || (this.mainService.isAdmin == false && this.loadContent == true)) {
			this.fetchDesignTemplateCategories();
		}
	}
	fetchDesignTemplateCategories() {
		let params = {
			isTemplate: this.loadContent,
			productId: this.mainService.productId
		}, url = 'designtemplates/designtemplates/fetchTemplateCategories', cacheKey: string = 'fetchTemplateCategories' + this.mainService.productId;
		this.mainService.getData(url, params, cacheKey, null, true).then(templateCategoriesData => {
			if (templateCategoriesData.status == 'success') {
				this.templateCategories = templateCategoriesData.templateCategories;
				this.selectedTemplateCat = templateCategoriesData.defaultTemplateCategory;
				if (this.mainService.isAdmin == false) {
					this.processTemplates(templateCategoriesData, true);
				}
			}
		}).catch(err => console.log(err));
	}
	getNumberArray(value: number) {
		var items: number[] = [];
		for (var i = 1; i <= value; i++) {
			items.push(i);
		}
		return items;
	}

	init() {
		this.templateService.templateTitle = '';
		this.subscribeEvents();
		this.prepareFormGroup();
	}

	prepareFormGroup() {
		// Login form builder
		this.designTemplateForm = this.formBuilder.group({
			templateTitle: ['', [Validators.required]],
			templateCategory: [[], [Validators.required]]
		});
	}

	subscribeEvents() {
		this.eventService.$sub('setTemplateData', (templateData) => {
			this.designTemplateForm.controls.templateTitle.setValue(templateData.template_title);
			this.designTemplateForm.controls.templateCategory.setValue(templateData.selectedTemplateCategories);
			this.selectedStaus = (templateData.statusTemplate != undefined) ? templateData.statusTemplate : 1;
			//this.selectedStaus = templateData.isPreLoaded == "false" ? 0 : 1;
			this.selectedStausName = this.selectedStaus == 1 ? this.translate.instant('Enable') : this.translate.instant('Disable');
		});
	}

	openSaveTemplate() {
		if (this.mainService.canvasService.hasCanvasObjectOrBackgroundAll()) {
			this.modalRef = this.mainService.openThisModal(this.saveTemplateModal);
		} else {
			this.mainService.swal(this.translate.instant('Alert'), this.translate.instant('Please design the product !'), "warning");
		}
	}
	saveTemplate() {
		if (this.designTemplateForm.invalid) return;
		let data = {
			title: this.designTemplateForm.controls.templateTitle.value,
			selectedTemplateCategories: this.designTemplateForm.controls.templateCategory.value,
			status: this.selectedStaus
		};
		this.templateService.saveTemplate(data).then((resp: any) => {
			if (resp.status == 'success') {
				//this.init();
				this.modalRef.hide();
			}
		});
	}

	/**
	 * Fetching subtabs
	 */
	 async getSubTabs(mainTabId) {
	 	let data = this.mainService.tabsFlow[mainTabId];
	 	this.subTabsData = this.mainService.setSubTabsData(data, mainTabId);
	 	if (this.subTabsData && this.subTabsData.length > 0) {
	 		this.accordianId = this.subTabsData[0].id;
	 	}
	 	if (this.loaderComponent && this.loaderComponent.showSubLoader) this.loaderComponent.showSubLoader = false;
	 }

	 changeTemplateCat(templateCat) {
	 	this.designSearchText = "";
	 	this.selectedTemplateCat = templateCat;
	 	this.templates = [];
	 	this.loadmore = 1;
	 	let templatesCacheKey = 'templates' + '-' + this.selectedTemplateCat.id + '-' + this.loadmore;
	 	this.getTemplates(templatesCacheKey);
	 }
	 loadMoreTemplates() {
	 	this.loadmore++;
	 	let templatesCacheKey = 'templates' + '-' + this.selectedTemplateCat.id + '-' + this.loadmore;
	 	this.cacheService.set(templatesCacheKey, '');
	 	this.checkScroll = true;
	 	this.getTemplates(templatesCacheKey, this.searchText, false);
	 }
	 getTemplates(cacheKey = null, searchText = "", resetTemplates: boolean = true) {

	 	let templateCatId = this.selectedTemplateCat.id;
		// show placeholder loader
		this.showPlaceholder = true;
		this.loaderComponent.showSubLoader = true;
		this.cdr.detectChanges();
		// prepare params and url
		let params = {
			'templateCatId': templateCatId,
			'limit': this.limit,
			'searchText': searchText,
			'productId': this.mainService.productId,
			'page': this.loadmore
		}, url = 'designtemplates/designtemplates/fetchTemplates';

		cacheKey = 'fetchTemplates' + searchText + templateCatId;

		// if cahcekey is not null that means user has changed template category
		this.mainService.getData(url, params, cacheKey).then(data => {
			this.cacheService.set(cacheKey, data, { maxAge: 15 * 60 });
			if (resetTemplates === true) this.templates = [];
			this.processTemplates(data, resetTemplates);
		}).catch(err => console.log(err));
	}

	searchTemplate($event) {
		if (!$event || !$event.target || !$event.target.value) {
			this.loadmore = 1;
		};
		/*if (this.searchText == $event.target.value.toString()) {
			return;
		}
		*/
		this.searchText = $event.target.value.toString();
		this.getTemplates(null, this.searchText);
	}

	processTemplates(data, resetTemplates) {
		this.templateImgUrl = data.templateImgUrl
		this.isEnableloadmore = (data.loadMoreFlag == 0) ? false : true;
		this.setImagesData(data.templates);
		if (this.loadContent && this.loaderComponent && this.loaderComponent.showMainLoader)
			this.loaderComponent.showSubLoader = false;
		this.showPlaceholder = false;
		if (this.checkScroll && resetTemplates === false) {
			this.cdr.detectChanges();
			this.scrollToBottom();
		}
	}

	setImagesData(data) {
		for (let i = 0; i < data.length; i++) {
			this.templates.push(data[i]);
		}
		if (this.loadContent && this.loaderComponent && this.loaderComponent.showSubLoader) {
			this.loaderComponent.showSubLoader = false;
			this.cdr.detectChanges();
		}
	}

	scrollToBottom(): void {
		try {
			if (!this.mainService.isResponsive)
				this.ScrollContainer.nativeElement.scrollTop = this.ScrollContainer.nativeElement.scrollHeight;
			else if (this.mainService.isResponsive && !this.allowPlaceholderLoader)
				this.mainSection.nativeElement.scrollTop = this.mainSection.nativeElement.scrollHeight;
			else
				this.ScrollContainer.nativeElement.scrollLeft = (this.ScrollContainer.nativeElement.scrollWidth - 300);
		} catch (err) { }
	}

	loadTemplate(template) {
		if(template.image_id){
			if(window.location != window.parent.location){
				window.top.location.href = template.href;
			}else{
				window.location.href = template.href;
			}
		}else{
			this.templateService.loadTemplate(btoa(template.designtemplates_id));
		}
	}

	showAllFonts: boolean = false;
	showFonts(showAllFonts) {
		this.showAllFonts = !showAllFonts;
		this.eventService.$pub('showFonts', { showAllFonts: this.showAllFonts, title: 'Show all images' });
	}

	get dfref() { return this.designTemplateForm.controls; }


	changeStatus(status) {
		this.selectedStaus = status.id;
		this.selectedStausName = status.name;
	}
}
