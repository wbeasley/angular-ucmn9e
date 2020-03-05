import { TestBed } from '@angular/core/testing';

import { RightPanelUpdateService } from './right-panel-update.service';

describe('RightPanelUpdateService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RightPanelUpdateService = TestBed.get(RightPanelUpdateService);
    expect(service).toBeTruthy();
  });
});
