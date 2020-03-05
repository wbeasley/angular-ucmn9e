import { TestBed } from '@angular/core/testing';

import { MultipleObjectsUpdateService } from './multiple-objects-update.service';

describe('MultipleObjectsUpdateService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MultipleObjectsUpdateService = TestBed.get(MultipleObjectsUpdateService);
    expect(service).toBeTruthy();
  });
});
