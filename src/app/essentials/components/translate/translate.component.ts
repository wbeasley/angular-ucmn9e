import { Component, OnInit } from '@angular/core';
import { MainService } from 'src/app/services/main.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'translate',
  templateUrl: './translate.component.html',
  styleUrls: ['./translate.component.scss']
})
export class TranslateComponent implements OnInit {

  constructor(private mainService: MainService, public translate: TranslateService) { }

  fetchLocale() {
		let params = {},
		url = 'productdesigner/index/fetchlocale', cacheKey: string = 'fetchLocale' + this.mainService.baseUrl;
		this.mainService.getData(url, params, cacheKey).then(localeData => {
			this.translate.addLangs(localeData.active_locale);
			this.translate.setDefaultLang(localeData.active_locale);
		}).catch(err => console.log(err));
	}

  ngOnInit() {
  	this.fetchLocale();
  }

}
