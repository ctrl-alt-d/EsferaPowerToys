import { jest, describe, test, expect } from '@jest/globals';
import { MateriaApplier } from '../src/materia/MateriaApplier.js';

describe('MateriaApplier', () => {
    test('hauria de traduir P i p com a Pendent', () => {
        const applier = new MateriaApplier({ log: jest.fn(), warn: jest.fn() });

        expect(applier.tradueixNotes('P p')).toEqual(['PDT', 'PDT']);
    });
});
