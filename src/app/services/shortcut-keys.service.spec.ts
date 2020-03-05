import { TestBed } from '@angular/core/testing';

import { ShortcutKeysService } from './shortcut-keys.service';

describe('ShortcutKeysService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ShortcutKeysService = TestBed.get(ShortcutKeysService);
    expect(service).toBeTruthy();
  });
});
