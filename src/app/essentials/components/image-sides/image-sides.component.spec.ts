import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageSidesComponent } from './image-sides.component';

describe('ImageSidesComponent', () => {
  let component: ImageSidesComponent;
  let fixture: ComponentFixture<ImageSidesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImageSidesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageSidesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
