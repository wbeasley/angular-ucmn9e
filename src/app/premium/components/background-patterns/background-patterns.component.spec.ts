import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BackgroundPatternsComponent } from './background-patterns.component';

describe('BackgroundPatternsComponent', () => {
  let component: BackgroundPatternsComponent;
  let fixture: ComponentFixture<BackgroundPatternsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BackgroundPatternsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BackgroundPatternsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
