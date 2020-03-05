import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfProductAttrComponent } from './conf-product-attr.component';

describe('ConfProductAttrComponent', () => {
  let component: ConfProductAttrComponent;
  let fixture: ComponentFixture<ConfProductAttrComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfProductAttrComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfProductAttrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
