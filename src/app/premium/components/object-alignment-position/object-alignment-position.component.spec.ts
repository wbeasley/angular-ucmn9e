import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectAlignmentPositionComponent } from './object-alignment-position.component';

describe('ObjectAlignmentPositionComponent', () => {
  let component: ObjectAlignmentPositionComponent;
  let fixture: ComponentFixture<ObjectAlignmentPositionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ObjectAlignmentPositionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectAlignmentPositionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
