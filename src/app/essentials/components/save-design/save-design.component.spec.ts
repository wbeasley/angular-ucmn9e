import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveDesignComponent } from './save-design.component';

describe('SaveDesignComponent', () => {
  let component: SaveDesignComponent;
  let fixture: ComponentFixture<SaveDesignComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SaveDesignComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SaveDesignComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
