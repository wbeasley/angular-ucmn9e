import { PubSubService } from 'angular7-pubsub';
import { CustomerLoginComponent } from 'src/app/common/components/customer-login/customer-login.component';
import { Component, OnInit } from '@angular/core';
import { MainService } from 'src/app/services/main.service';

@Component({
  selector: 'header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  logoSrc: any;
  logoAlt: any;
  homePageLink: any;
  constructor(
    public mainService: MainService,
    private eventService: PubSubService
    ) {
    let logoUrl = this.mainService.baseUrl;
    if (this.mainService.isAdmin) {
      let elem: any = document.getElementsByName('redirectBackUrl');
      if (elem && elem[0] && elem[0].value) {
        logoUrl = elem[0].value;
      }
    }
    this.homePageLink = logoUrl;
  }

  getPageConfiguration() {
    let params = {},
    url = 'productdesigner/index/getPageConfiguration', cacheKey: string = 'getPageConfiguration' + this.mainService.baseUrl;
    this.mainService.getData(url, params, cacheKey).then(pageData => {
      this.logoSrc = pageData.logo_src;
      this.logoAlt = pageData.logo_alt;
    }).catch(err => console.log(err));
  }
  redirectHomePage(homePageLink){
    if(window.location != window.parent.location){
      window.top.location.href = homePageLink;
    }else{
      window.location.href = homePageLink;
    }
  }

  ngOnInit() {
    this.getPageConfiguration();
  }

  openLoginModal() {
    this.eventService.$pub('openLoginModal');
  }

}
