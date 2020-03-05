import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root'
})
export class TabsService {

	public parentTabsData = [];
	public showChildTabsData:any = [];
	public showChild:any = null;

	constructor() { }

	registerTabs(subTab,mainTab){
		if(!this.parentTabsData[mainTab]){
			this.parentTabsData[mainTab] = [];
		}
		if(this.parentTabsData[mainTab].indexOf(subTab) == -1){
			this.parentTabsData[mainTab].push(subTab);
		}
	}
	showChildTabs(currentTab){
		this.showChild = true;
		this.showChildTabsData = [];
		for(let tab of this.parentTabsData[currentTab]){
			if(this.showChildTabsData.indexOf(tab) == -1){
				this.showChildTabsData.push(tab);
			}
		}
	}
	checkIfExistChild(tab){
		if(this.showChildTabsData.indexOf(tab) == -1){
			return null;
		}
		return true;
	}
	backTab(){
		this.showChild = null;
		this.showChildTabsData = [];
	}
}
