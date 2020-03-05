import { TestBed } from '@angular/core/testing';

import { ConfProductAttrService } from './conf-product-attr.service';

describe('ConfProductAttrService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ConfProductAttrService = TestBed.get(ConfProductAttrService);
    expect(service).toBeTruthy();
  });
});
