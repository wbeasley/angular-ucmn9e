import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DesignareaControlsComponent } from './designarea-controls.component';

describe('DesignareaControlsComponent', () => {
  let component: DesignareaControlsComponent;
  let fixture: ComponentFixture<DesignareaControlsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DesignareaControlsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DesignareaControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
