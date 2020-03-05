import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LayerManagementComponent } from './layer-management.component';

describe('LayerManagementComponent', () => {
  let component: LayerManagementComponent;
  let fixture: ComponentFixture<LayerManagementComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LayerManagementComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LayerManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
