import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BackgroundPatternControlsComponent } from './background-pattern-controls.component';

describe('BackgroundPatternControlsComponent', () => {
  let component: BackgroundPatternControlsComponent;
  let fixture: ComponentFixture<BackgroundPatternControlsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BackgroundPatternControlsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BackgroundPatternControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
