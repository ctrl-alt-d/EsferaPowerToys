import { JSDOM } from 'jsdom';
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { MateriaStyleManager } from '../src/materia/MateriaStyleManager.js';

describe('MateriaStyleManager', () => {
    let manager;

    beforeEach(() => {
        const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>');
        global.window = dom.window;
        global.document = dom.window.document;
        manager = new MateriaStyleManager({ log: jest.fn(), warn: jest.fn() });
    });

    afterEach(() => {
        delete global.window;
        delete global.document;
    });

    test('hauria d’injectar els estils de matèries dins la carpeta de la funcionalitat', () => {
        const styles = document.querySelector('#powertoy-materia-styles');

        expect(styles).not.toBeNull();
        expect(styles.textContent).toContain('.powertoy-pass');
        expect(styles.textContent).toContain('fieldset.col-md-12.bordure');
        expect(styles.textContent).toContain('.powertoy-materia-table-wrapper');
        expect(styles.textContent).toContain('.powertoy-materia-action-button');
    });

    test('hauria de pintar les files segons el valor del select', () => {
        document.body.innerHTML = `
            <table>
                <tr class="alturallistat"><td><select><option value="string:A5" selected></option></select></td></tr>
                <tr class="alturallistat"><td><select><option value="string:NA" selected></option></select></td></tr>
                <tr class="alturallistat"><td><select><option value="string:PDT" selected></option></select></td></tr>
                <tr class="alturallistat"><td><select><option value="string:EP" selected></option></select></td></tr>
            </table>
        `;

        manager.aplicaEstils();

        const rows = document.querySelectorAll('tr.alturallistat');
        expect(rows[0].classList.contains('powertoy-pass')).toBe(true);
        expect(rows[1].classList.contains('powertoy-fail')).toBe(true);
        expect(rows[2].classList.contains('powertoy-pendent')).toBe(true);
        expect(rows[3].classList.contains('powertoy-proces')).toBe(true);
    });
});
