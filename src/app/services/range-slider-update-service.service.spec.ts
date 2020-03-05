import { TestBed } from '@angular/core/testing';

import { RangeSliderUpdateServiceService } from './range-slider-update-service.service';

describe('RangeSliderUpdateServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RangeSliderUpdateServiceService = TestBed.get(RangeSliderUpdateServiceService);
    expect(service).toBeTruthy();
  });
});
