import { Component, OnInit, ViewChild } from '@angular/core';
import { PubSubService } from 'angular7-pubsub';

@Component({
	selector: 'footer',
	templateUrl: './footer.component.html',
	styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
	constructor(private eventService: PubSubService) {}
	ngOnInit() {
  }
}
