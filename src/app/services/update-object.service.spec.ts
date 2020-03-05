import { TestBed } from '@angular/core/testing';

import { UpdateObjectService } from './update-object.service';

describe('UpdateObjectService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: UpdateObjectService = TestBed.get(UpdateObjectService);
    expect(service).toBeTruthy();
  });
});
