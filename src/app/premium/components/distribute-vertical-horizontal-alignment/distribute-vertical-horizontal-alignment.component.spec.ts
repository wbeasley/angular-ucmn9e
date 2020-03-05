import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DistributeVerticalHorizontalAlignmentComponent } from './distribute-vertical-horizontal-alignment.component';

describe('DistributeVerticalHorizontalAlignmentComponent', () => {
  let component: DistributeVerticalHorizontalAlignmentComponent;
  let fixture: ComponentFixture<DistributeVerticalHorizontalAlignmentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DistributeVerticalHorizontalAlignmentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DistributeVerticalHorizontalAlignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
