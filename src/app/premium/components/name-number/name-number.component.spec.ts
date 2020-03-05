import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NameNumberComponent } from './name-number.component';

describe('NameNumberComponent', () => {
  let component: NameNumberComponent;
  let fixture: ComponentFixture<NameNumberComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NameNumberComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NameNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
