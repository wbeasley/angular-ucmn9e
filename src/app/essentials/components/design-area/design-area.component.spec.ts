import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DesignAreaComponent } from './design-area.component';

describe('DesignAreaComponent', () => {
  let component: DesignAreaComponent;
  let fixture: ComponentFixture<DesignAreaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DesignAreaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DesignAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
