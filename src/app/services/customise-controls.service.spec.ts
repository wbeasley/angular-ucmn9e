import { TestBed } from '@angular/core/testing';

import { CustomiseControlsService } from './customise-controls.service';

describe('CustomiseControlsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CustomiseControlsService = TestBed.get(CustomiseControlsService);
    expect(service).toBeTruthy();
  });
});
