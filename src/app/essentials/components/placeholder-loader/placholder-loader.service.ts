import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PlacholderLoaderService {
  public placholderWidth: number = 100;
  public placholderHeight: number = 20;
  constructor() { }
}
