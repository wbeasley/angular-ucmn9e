import { ShortcutKeysService } from './services/shortcut-keys.service';
/* Modules */
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { PubSubModule } from 'angular7-pubsub';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { FormsModule, ReactiveFormsModule } from 'node_modules/@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { NguCarouselModule } from '@ngu/carousel';

/* Components */
import { AppComponent } from './app.component';
import { HeaderComponent } from './essentials/components/header/header.component';
import { ProductsComponent } from './essentials/components/products/products.component';
import { PreviewComponent } from './essentials/components/preview/preview.component';
import { SaveDesignComponent } from './essentials/components/save-design/save-design.component';
import { DownloadComponent } from './essentials/components/download/download.component';
import { CustomerLoginComponent } from './common/components/customer-login/customer-login.component';
import { TabsComponent } from './essentials/components/tabs/tabs.component';
import { FooterComponent } from './essentials/components/footer/footer.component';
import { DesignAreaComponent } from './essentials/components/design-area/design-area.component';
import { ImageSidesComponent } from './essentials/components/image-sides/image-sides.component';
import { CropperComponent } from './essentials/components/cropper/cropper.component';

import { ClipartComponent } from './essentials/components/clipart/clipart.component';
import { PlainTextComponent } from './essentials/components/plain-text/plain-text.component';
import { ImageUploadComponent } from './essentials/components/image-upload/image-upload.component';
import { BackgroundColorComponent } from './essentials/components/background-color/background-color.component';
import { ProductOptionsComponent } from './essentials/components/product-options/product-options.component';
import { FontComponent } from './essentials/components/font/font.component';
import { RightPanelComponent } from './essentials/components/right-panel/right-panel.component';
import { CommonTabsComponent } from './essentials/components/common-tabs/common-tabs.component';
import { ImageEffectsComponent } from './common/components/image-effects/image-effects.component';
import { MyDesignsComponent } from './essentials/components/my-designs/my-designs.component';
import { OpacityComponent } from './premium/components/opacity/opacity.component';
import { DropShadowComponent } from './essentials/components/drop-shadow/drop-shadow.component';
import { DesignareaControlsComponent } from './essentials/components/designarea-controls/designarea-controls.component';
import { StrokeComponent } from './essentials/components/stroke/stroke.component';
import { TooltipComponent } from './essentials/components/tooltip/tooltip.component';
import { SkewComponent } from './essentials/components/skew/skew.component';
import { LayerManagementComponent } from './essentials/components/layer-management/layer-management.component';
import { CartComponent } from './essentials/components/cart/cart.component';
import { ContextMenuComponent } from './essentials/components/context-menu/context-menu.component';
import { LoaderComponent } from './essentials/components/loader/loader.component';
import { ConfProductAttrComponent } from './essentials/components/conf-product-attr/conf-product-attr.component';
import { TranslateComponent } from './essentials/components/translate/translate.component';
/* Services */
import { CacheService, CacheStorageAbstract, CacheLocalStorage } from 'ng2-cache';
import { ObjectPositionComponent } from './essentials/components/object-position/object-position.component';
import { CustomOptionsComponent } from './essentials/components/custom-options/custom-options.component';
import { PriceComponent } from './essentials/components/price/price.component';

import { FileSaverModule } from 'ngx-filesaver';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ObjectAlignmentPositionComponent } from './premium/components/object-alignment-position/object-alignment-position.component';
import { CustomColorPickerModule } from './common/modules/custom-color-picker/custom-color-picker.module';
import { SocialMediaSharingModule } from './premium/modules/social-media-sharing/social-media-sharing.module';
import { PlaceholderLoaderComponent } from './essentials/components/placeholder-loader/placeholder-loader.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { DesignTemplatesComponent } from './premium/components/design-templates/design-templates.component';
import { NameNumberComponent } from './premium/components/name-number/name-number.component';
import { DistributeVerticalHorizontalAlignmentComponent } from './premium/components/distribute-vertical-horizontal-alignment/distribute-vertical-horizontal-alignment.component';
import { ObjectGroupingComponent } from './premium/components/object-grouping/object-grouping.component';
import { DragDropComponent } from './premium/components/drag-drop/drag-drop.component';
import { BackgroundPatternsComponent } from './premium/components/background-patterns/background-patterns.component';
import { BackgroundPatternControlsComponent } from './premium/components/background-pattern-controls/background-pattern-controls.component';
import { ImageSliderComponent } from './premium/components/image-slider/image-slider.component';
import { PriceInfoComponent } from './premium/components/price-info/price-info.component';
import { QuotesComponent } from './quotes/quotes.component';
// import { ObjectLockComponent } from './addons/components/object-lock/object-lock.component';
// import { SocialMediaImportModule } from './addons/modules/social-media-import/social-media-import.module';
// import { PrintingMethodsComponent } from './addons/components/printing-methods/printing-methods.component';
// import { DemoStoreModule } from './demostore/demo-store/demo-store.module';
// import { ProductTemplateModule } from './addons/modules/product-template/product-template.module';
// import { PhotoCalendarModule } from './addons/modules/photo-calendar/photo-calendar.module';
// import { ThreeDPreviewComponent } from './addons/components/three-d-preview/three-d-preview.component';

export function HttpLoaderFactory(httpClient: HttpClient) {
    return new TranslateHttpLoader(httpClient);
}
@NgModule({
    declarations: [
        AppComponent,
        HeaderComponent,
        ProductsComponent,
        PreviewComponent,
        SaveDesignComponent,
        DownloadComponent,
        CustomerLoginComponent,
        TabsComponent,
        FooterComponent,
        DesignAreaComponent,
        ImageSidesComponent,
        ClipartComponent,
        PlainTextComponent,
        ImageUploadComponent,
        BackgroundColorComponent,
        ProductOptionsComponent,
        FontComponent,
        RightPanelComponent,
        CommonTabsComponent,
        ImageEffectsComponent,
        MyDesignsComponent,
        OpacityComponent,
        DropShadowComponent,
        DesignareaControlsComponent,
        StrokeComponent,
        CropperComponent,
        TooltipComponent,
        SkewComponent,
        LayerManagementComponent,
        CartComponent,
        ContextMenuComponent,
        LoaderComponent,
        ObjectPositionComponent,
        CustomOptionsComponent,
        ConfProductAttrComponent,
        PriceComponent,
        TranslateComponent,
        ObjectAlignmentPositionComponent,
        PlaceholderLoaderComponent,
        DesignTemplatesComponent,
        NameNumberComponent,
        DistributeVerticalHorizontalAlignmentComponent,
        ObjectGroupingComponent,
        DragDropComponent,
        BackgroundPatternsComponent,
        BackgroundPatternControlsComponent,
        ImageSliderComponent,
        PriceInfoComponent,
        QuotesComponent
        // ObjectLockComponent,
        // PrintingMethodsComponent,
        // ThreeDPreviewComponent,
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        NguCarouselModule,
        TabsModule.forRoot(),
        PubSubModule.forRoot(),
        FormsModule,
        ReactiveFormsModule,
        TooltipModule.forRoot(),
        BsDropdownModule.forRoot(),
        AccordionModule.forRoot(),
        ModalModule.forRoot(),
        HttpClientModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            }
        }),
        FileSaverModule,
        CustomColorPickerModule,
        SocialMediaSharingModule,
        InfiniteScrollModule
        // SocialMediaImportModule,
        // ProductTemplateModule,
        // PhotoCalendarModule,
        // DemoStoreModule
    ],
    providers: [
        CacheService,
        { provide: CacheStorageAbstract, useClass: CacheLocalStorage },
        ShortcutKeysService
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
