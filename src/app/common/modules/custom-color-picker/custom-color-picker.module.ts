import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorChromeModule } from 'ngx-color/chrome';
import { CustomColorPickerComponent } from './component/custom-color-picker/custom-color-picker.component';

@NgModule({
  declarations: [CustomColorPickerComponent],
  imports: [
    CommonModule,
    ColorChromeModule
  ],
  exports: [CustomColorPickerComponent]
})
export class CustomColorPickerModule { }
