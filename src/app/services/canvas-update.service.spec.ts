import { TestBed } from '@angular/core/testing';

import { CanvasUpdateService } from './canvas-update.service';

describe('CanvasUpdateService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CanvasUpdateService = TestBed.get(CanvasUpdateService);
    expect(service).toBeTruthy();
  });
});
