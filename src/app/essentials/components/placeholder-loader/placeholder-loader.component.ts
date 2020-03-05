import { Component, OnInit, Input } from '@angular/core';
import { PlacholderLoaderService } from './placholder-loader.service';

@Component({
  selector: '[placeholder-loader]',
  templateUrl: './placeholder-loader.component.html',
  styleUrls: ['./placeholder-loader.component.scss']
})
export class PlaceholderLoaderComponent implements OnInit {
  @Input('loaderHeight') loaderHeight;
  @Input('loaderWidth') loaderWidth;

  constructor(
    public placholderLoaderService: PlacholderLoaderService
  ) { }

  ngOnInit() {
  }

}
