import { TestBed } from '@angular/core/testing';

import { SvgColorUpdateService } from './svg-color-update.service';

describe('SvgColorUpdateService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SvgColorUpdateService = TestBed.get(SvgColorUpdateService);
    expect(service).toBeTruthy();
  });
});
