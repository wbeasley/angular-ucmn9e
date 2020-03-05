import { LoaderComponent } from 'src/app/essentials/components/loader/loader.component';
import { MainService } from 'src/app/services/main.service';
import { PubSubService } from 'angular7-pubsub';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Component, OnInit, ViewChild, TemplateRef, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MustMatch } from 'src/app/_helper/must-match.validator';
import { TranslateService } from '@ngx-translate/core';
import { CanvasService } from "src/app/services/canvas.service";

@Component({
  selector: '[customer-login]',
  templateUrl: './customer-login.component.html',
  styleUrls: ['./customer-login.component.scss']
})
export class CustomerLoginComponent implements OnInit {

  // Form Modal
  @ViewChild('loginModal') loginModalTemplate;
  @ViewChild('registerModal') registerModalTemplate;
  modalRef: BsModalRef;

  // For Form
  public registerForm: FormGroup;
  public loginForm: FormGroup;
  public submitted = false;
  public passwordMinLength: number;

  // For Login
  public loginEmail;
  public loginPassword;

  // For Register
  public firstName;
  public lastName;
  public email;
  public isSubscribe: boolean = false;
  public password;
  public confirmPassword;
  public isSave: boolean = false;
  abc: any;

  // Loader
  @ViewChild("loaderComponent") loaderComponent: LoaderComponent;

  constructor(
    private eventService: PubSubService,
    private formBuilder: FormBuilder,
    public mainService: MainService,
    private translate: TranslateService,
    public cdr: ChangeDetectorRef,
    public canvasService: CanvasService
  ) { }

  /**
   * Init Actions
   */
  ngOnInit() {
    this.init();
    this.subscribeEvents();
    this.checkForCustomerLogin();
  }

  /**
   * This method check for customer whether it is login or not
   * @return {[type]} [description]
   */
  checkForCustomerLogin() {
    // prepare url and payload
    let url = 'productdesigner/Customer/checkForLogin', param = {};

    // hit post request
    this.mainService.post(url, param, true).then((resp: any) => {
      // if customer is logged in
      if (resp && resp.status == "success") {

        if (resp.customer_login) {
          this.mainService.userLoggedIn = true;
          this.eventService.$pub('customerLoggedIn', false);
          this.mainService.loggedInUserId = resp.customer_id;
        }

      }

    }).catch(err => {
      console.log(this.translate.instant("Error in logging in: "), err);
    })
  }

  /**
   * 
   */
  init() {
    this.passwordMinLength = 8;
    this.initFormGroup();
    this.initData();
  }

  /**
   * Prepare register and login form group objects
   */
  initFormGroup() {

    // register form builder
    this.registerForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subscribe: [''],
      password: ['', [Validators.required, Validators.minLength(this.passwordMinLength)]],
      confirmPassword: ['', [Validators.required]]
    }, {
        validator: MustMatch('password', 'confirmPassword')
      });

    // Login form builder
    this.loginForm = this.formBuilder.group({
      loginEmail: ['', [Validators.required, Validators.email]],
      loginPassword: ['', Validators.required]
    });
  }

  /**
   * Subscribe events
   */
  subscribeEvents() {
    if (!this.eventService.events.openLoginModal) {
      this.eventService.$sub('openLoginModal', (isSave) => {
        this.openModal(false, isSave);
      });
    }
  }

  /**
   * Open Modal
   * @param isReg 
   */
  openModal(isReg: boolean = false, isSave: boolean = false) {

    // save design flag
    this.isSave = isSave;

    // if user already logged in
    if (this.mainService.userLoggedIn === true) {
      this.mainService.logout();
      this.mainService.lastSavedData = [];
      return;
    }

    // set submitted flag to false to hide error message from current modal
    this.submitted = false;

    // determine template object based in isReg parametere
    let template: TemplateRef<any> = (isReg === false) ? this.loginModalTemplate : this.registerModalTemplate,

      // determine modal class based on isReg parameter
      modalClass = (isReg === false) ? "byi-login-modal" : "byi-register:modal";

    // if modalRef is already there, ie. if modal is already open, close it first
    // this happens when clicking on Register button in login popup
    if (this.modalRef != undefined) this.closeModal();

    // open modal
    this.modalRef = this.mainService.openThisModal(template, modalClass);
  }

  /**
   * Reset 
   */
  initData() {
    // as subscribe for newsletters is not form control object
    // we manually need to set it false
    this.loginEmail = '';
    this.loginPassword = '';
    this.firstName = '';
    this.lastName = '';
    this.email = '';
    this.password = '';
    this.confirmPassword = '';
    this.isSubscribe = false;
  }

  /**
   * When user hits on login button
   */
  loginCustomer() {

    // set flag
    this.submitted = true;

    // stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    // prepare url and payload
    let url = 'productdesigner/Customer/login', param = {
      customer_email: this.loginEmail,
      customer_password: this.loginPassword
    };

    // hit post request
    this.mainService.post(url, param, true).then((resp: any) => {

      // if login was successfull
      if (resp && resp.status == "success") {
        this.setCustomerLoginData(resp);
        this.eventService.$pub('customerLoggedIn', this.isSave);

        if (!this.isSave) {
          this.mainService.swal(this.translate.instant("Success"), this.translate.instant("Logged in successfully"), 'success').finally(() => this.closeModal());
        } else {
          this.closeModal();
        }
        this.init();
      }

      // if something went wrong with login process
      else {
        let msg = resp.log;
        if (msg.lastIndexOf("-") >= 0) msg = msg.substr(msg.lastIndexOf("-") + 2);
        this.mainService.swal(this.translate.instant("Error"), this.translate.instant(msg), 'error');
      }
    }).catch(err => {
      console.log(this.translate.instant("Error in logging in: "), err);
    })
  }

  /**
   * When user hits on register button
   */
  registerCustomer() {

    // set flag to true for displaying error message(if any)
    this.submitted = true;

    // if form is invalid, return from here
    if (this.registerForm.invalid) {
      return;
    }

    // prepare url and payload
    let url = "productdesigner/Customer/Register", param = {
      firstname: this.firstName,
      lastname: this.lastName,
      email: this.email,
      password: this.password,
      password_confirmation: this.confirmPassword,
      isSubscribed: this.isSubscribe,
      customer_action: 'registration'
    };

    // hit post request
    this.mainService.post(url, param, true).then((resp: any) => {

      // if registration was successfull
      if (resp && resp.status == "success") {
        this.setCustomerLoginData(resp);
        if (!this.isSave) {
          this.mainService.swal(this.translate.instant("Registered"), this.translate.instant("Registered Successfully!"), "success").finally(() => this.closeModal());
        } else {
          this.closeModal();
        }
        this.init();
        this.eventService.$pub('customerLoggedIn', this.isSave);
      }

      // if registration failed
      else {
        let errorMsg: string = resp.message;
        //if (errorMsg.lastIndexOf("-") >= 0) errorMsg.substr(errorMsg.lastIndexOf("-") + 2);
        this.mainService.swal("Error", errorMsg, "error");
      }
    }).catch(err => {
      console.log(this.translate.instant("Error in registering user: "), err);
    });
  }

  /**
   * After successfully loggedin/registered, we will set logged in user's data
   * 
   * @param resp response object
   */
  setCustomerLoginData(resp) {
    this.submitted = false;
    this.mainService.userLoggedIn = true;
    this.mainService.loggedInUserId = resp.customer_id;
  }

  /**
   * Close Modal
   */
  closeModal() {
    this.modalRef.hide();
  }

  // get control object for login form
  get lf() { return this.loginForm.controls; }

  // get control object for register form
  get rf() { return this.registerForm.controls; }
}
