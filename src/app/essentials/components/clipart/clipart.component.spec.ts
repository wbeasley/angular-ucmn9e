import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClipartComponent } from './clipart.component';

describe('ClipartComponent', () => {
  let component: ClipartComponent;
  let fixture: ComponentFixture<ClipartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClipartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClipartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
