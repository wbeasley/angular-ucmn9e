import { Component, OnInit } from '@angular/core';

@Component({
  selector: '[loader]',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss']
})
export class LoaderComponent implements OnInit {

  // main loader show hide flag
  public showMainLoader: boolean = false;

  // sub  loader show hide flag
  public showSubLoader: boolean = false;

  constructor() { }

  ngOnInit() {
  }

}
