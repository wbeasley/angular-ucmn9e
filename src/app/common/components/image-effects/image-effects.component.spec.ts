import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageEffectsComponent } from './image-effects.component';

describe('ImageEffectsComponent', () => {
  let component: ImageEffectsComponent;
  let fixture: ComponentFixture<ImageEffectsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImageEffectsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageEffectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
