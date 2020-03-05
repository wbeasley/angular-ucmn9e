import { TestBed } from '@angular/core/testing';

import { NameNumberService } from './name-number.service';

describe('NameNumberService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NameNumberService = TestBed.get(NameNumberService);
    expect(service).toBeTruthy();
  });
});
