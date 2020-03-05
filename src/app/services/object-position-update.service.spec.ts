import { TestBed } from '@angular/core/testing';

import { ObjectPositionUpdateService } from './object-position-update.service';

describe('ObjectPositionUpdateService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ObjectPositionUpdateService = TestBed.get(ObjectPositionUpdateService);
    expect(service).toBeTruthy();
  });
});
