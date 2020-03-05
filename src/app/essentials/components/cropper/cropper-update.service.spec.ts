import { TestBed } from '@angular/core/testing';

import { CropperUpdateService } from './cropper-update.service';

describe('CropperUpdateService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CropperUpdateService = TestBed.get(CropperUpdateService);
    expect(service).toBeTruthy();
  });
});
