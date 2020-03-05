import { TestBed } from '@angular/core/testing';

import { InsertObjectService } from './insert-object.service';

describe('InsertObjectService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: InsertObjectService = TestBed.get(InsertObjectService);
    expect(service).toBeTruthy();
  });
});
