import { TestBed } from '@angular/core/testing';

import { BestFitObjectService } from './best-fit-object.service';

describe('BestFitObjectService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BestFitObjectService = TestBed.get(BestFitObjectService);
    expect(service).toBeTruthy();
  });
});
