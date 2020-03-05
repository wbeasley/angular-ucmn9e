import { TestBed } from '@angular/core/testing';

import { ImageEffectsService } from './image-effects.service';

describe('ImageEffectsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ImageEffectsService = TestBed.get(ImageEffectsService);
    expect(service).toBeTruthy();
  });
});
