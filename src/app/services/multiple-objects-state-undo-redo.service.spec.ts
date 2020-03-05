import { TestBed } from '@angular/core/testing';

import { MultipleObjectsStateUndoRedoService } from './multiple-objects-state-undo-redo.service';

describe('MultipleObjectsStateUndoRedoService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MultipleObjectsStateUndoRedoService = TestBed.get(MultipleObjectsStateUndoRedoService);
    expect(service).toBeTruthy();
  });
});
