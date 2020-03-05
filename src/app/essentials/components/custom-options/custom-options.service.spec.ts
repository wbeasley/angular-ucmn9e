import { TestBed } from '@angular/core/testing';

import { CustomOptionsService } from './custom-options.service';

describe('CustomOptionsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CustomOptionsService = TestBed.get(CustomOptionsService);
    expect(service).toBeTruthy();
  });
});
