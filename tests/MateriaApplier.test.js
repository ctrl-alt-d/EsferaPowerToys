import { jest, describe, test, expect, afterEach } from '@jest/globals';
import { JSDOM } from 'jsdom';
import { MateriaApplier } from '../src/materia/MateriaApplier.js';

describe('MateriaApplier', () => {
    let dom;
    afterEach(() => {
        delete global.document;
        delete global.Event;
        dom?.window.close();
    });

    test('hauria de traduir P i p com a Pendent', () => {
        const applier = new MateriaApplier({ log: jest.fn(), warn: jest.fn() });

        expect(applier.tradueixNotes('P p')).toEqual(['PDT', 'PDT']);
    });

    test('aplica la nota ordinària o provisional al camp correcte', () => {
        dom = new JSDOM(`<table>
            <tr class="alturallistat"><td>MAT</td><td><input name="quantitativa"></td>
                <td><input ng-model="contingut.qualificacioProv"></td></tr>
        </table>`);
        global.document = dom.window.document;
        global.Event = dom.window.Event;
        const applier = new MateriaApplier({ log: jest.fn(), warn: jest.fn() });

        expect(applier.aplicaNotaModul('MAT', '7')).toBe(true);
        expect(document.querySelector('[name="quantitativa"]').value).toBe('7');
        expect(applier.aplicaNotaModul('MAT', '8', true)).toBe(true);
        expect(document.querySelector('[ng-model="contingut.qualificacioProv"]').value).toBe('8');
    });

    test('marca NP al select del mòdul i detecta una estada pendent', () => {
        dom = new JSDOM(`<table>
            <tr class="alturallistat"><td>MAT</td><td><select><option value=""></option><option value="string:NP"></option></select></td></tr>
            <tr class="alturallistat"><td>MAT_01EM</td><td><select><option value="string:PDT" selected></option></select></td></tr>
        </table>`);
        global.document = dom.window.document;
        global.Event = dom.window.Event;
        const applier = new MateriaApplier({ log: jest.fn(), warn: jest.fn() });

        expect(applier.estadaPendent('MAT_01EM')).toBe(true);
        expect(applier.aplicaNoPresentatModul('MAT')).toBe(true);
        expect(document.querySelector('tr td select').value).toBe('string:NP');
    });
});
