import { FacebookService } from 'ngx-facebook';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocialMediaSharingComponent } from './component/social-media-sharing/social-media-sharing.component';
import { FormsModule, ReactiveFormsModule } from 'node_modules/@angular/forms';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { FacebookModule } from 'ngx-facebook';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
export function HttpLoaderFactory(httpClient: HttpClient) {
	return new TranslateHttpLoader(httpClient);
}

@NgModule({
	declarations: [SocialMediaSharingComponent],
	imports: [CommonModule, FormsModule, ReactiveFormsModule,
		TranslateModule.forRoot({
			loader: {
				provide: TranslateLoader,
				useFactory: HttpLoaderFactory,
				deps: [HttpClient]
			}
		}),
		TooltipModule.forRoot(),
		HttpClientModule,
		BsDropdownModule.forRoot(),
		FacebookModule.forRoot()],
	exports: [SocialMediaSharingComponent]
})
export class SocialMediaSharingModule {

}
