import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DesignTemplatesComponent } from './design-templates.component';

describe('DesignTemplatesComponent', () => {
  let component: DesignTemplatesComponent;
  let fixture: ComponentFixture<DesignTemplatesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DesignTemplatesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DesignTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
