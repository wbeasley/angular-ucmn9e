import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaceholderLoaderComponent } from './placeholder-loader.component';

describe('PlaceholderLoaderComponent', () => {
  let component: PlaceholderLoaderComponent;
  let fixture: ComponentFixture<PlaceholderLoaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlaceholderLoaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaceholderLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
