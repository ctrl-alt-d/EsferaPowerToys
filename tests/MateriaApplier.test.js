import { JSDOM } from 'jsdom';
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { MateriaApplier } from '../src/materia/MateriaApplier.js';

describe('MateriaApplier', () => {
    let applier;
    let dom;

    beforeEach(() => {
        dom = new JSDOM('<!doctype html><html><body></body></html>');
        global.window = dom.window;
        global.document = dom.window.document;
        global.Event = dom.window.Event;
        applier = new MateriaApplier({ log: jest.fn(), warn: jest.fn() });
    });

    afterEach(() => {
        delete global.window;
        delete global.document;
        delete global.Event;
    });

    test('hauria de traduir P i p com a Pendent', () => {
        expect(applier.tradueixNotes('P p')).toEqual(['PDT', 'PDT']);
    });

    test('hauria de crear un pla amb canvis i notes sense modificar', () => {
        document.body.innerHTML = `
            <table>
                <tr class="alturallistat"><td>MAT_RA1</td><td><select><option value=""></option><option value="string:A10"></option></select></td></tr>
                <tr class="alturallistat"><td>MAT_RA2</td><td><select><option value=""></option><option value="string:A9" selected></option></select></td></tr>
            </table>
        `;

        const plan = applier.creaPlaAplicacio(['MAT_RA1', 'MAT_RA2'], ['A10', 'A9']);

        expect(plan.valid).toBe(true);
        expect(plan.summary.changes).toBe(1);
        expect(plan.summary.unchanged).toBe(1);
        expect(plan.items[0].status).toBe('change');
        expect(plan.items[1].status).toBe('unchanged');
    });

    test('hauria d’aplicar només els canvis i guardar valors previs', () => {
        document.body.innerHTML = `
            <table>
                <tr class="alturallistat"><td>MAT_RA1</td><td><select><option value=""></option><option value="string:A10"></option></select></td></tr>
                <tr class="alturallistat"><td>MAT_RA2</td><td><select><option value=""></option><option value="string:A9" selected></option></select></td></tr>
            </table>
        `;

        const result = applier.aplicaNotesARAs(['MAT_RA1', 'MAT_RA2'], ['A10', 'A9']);
        const selects = document.querySelectorAll('select');

        expect(result.applied).toBe(1);
        expect(result.unchanged).toBe(1);
        expect(result.previousValues).toEqual([{ raCodi: 'MAT_RA1', value: '' }]);
        expect(selects[0].value).toBe('string:A10');
        expect(selects[1].value).toBe('string:A9');
    });

    test('hauria de desfer els canvis guardats', () => {
        document.body.innerHTML = `
            <table>
                <tr class="alturallistat"><td>MAT_RA1</td><td><select><option value=""></option><option value="string:A10" selected></option></select></td></tr>
            </table>
        `;

        const restored = applier.desfesCanvis([{ raCodi: 'MAT_RA1', value: '' }]);

        expect(restored).toBe(1);
        expect(document.querySelector('select').value).toBe('');
    });
});
