import { TestBed } from '@angular/core/testing';

import { BackgroundPatternsService } from './background-patterns.service';

describe('BackgroundPatternsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BackgroundPatternsService = TestBed.get(BackgroundPatternsService);
    expect(service).toBeTruthy();
  });
});
