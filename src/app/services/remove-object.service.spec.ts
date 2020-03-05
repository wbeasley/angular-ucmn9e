import { TestBed } from '@angular/core/testing';

import { RemoveObjectService } from './remove-object.service';

describe('RemoveObjectService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RemoveObjectService = TestBed.get(RemoveObjectService);
    expect(service).toBeTruthy();
  });
});
