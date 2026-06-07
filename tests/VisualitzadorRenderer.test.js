import { JSDOM } from 'jsdom';
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { VisualitzadorRenderer } from '../src/visualitzador/VisualitzadorRenderer.js';

describe('VisualitzadorRenderer', () => {
    beforeEach(() => {
        const dom = new JSDOM('<!doctype html><html><body></body></html>');
        global.window = dom.window;
        global.document = dom.window.document;
    });

    afterEach(() => {
        delete global.window;
        delete global.document;
    });

    test('hauria de renderitzar taula, resum, colors i llista de recuperació', () => {
        const renderer = new VisualitzadorRenderer();
        const node = renderer.renderStudent({
            id: '1',
            nom: 'Cognom, Nom',
            subjects: [
                { code: 'M01', name: 'Mòdul aprovat ¬(M01)', final: 6, ras: [{ key: '01RA', raw: 6 }] },
                { code: 'M02', name: 'Mòdul suspès', final: 4, ras: [{ key: '01RA', raw: 'NA' }] },
            ],
        });

        expect(node.querySelector('.ptv-student-name').textContent).toBe('Cognom, Nom');
        expect(node.querySelector('.ptv-main-grid > .ptv-table-scroll .ptv-subjects-table')).not.toBeNull();
        expect(node.querySelectorAll('.ptv-subjects-table tbody tr')).toHaveLength(2);
        expect(node.querySelector('.ptv-subj-code').textContent).toBe('M01');
        expect(node.querySelector('.ptv-subj-label').textContent).toBe('Mòdul aprovat');
        expect(node.querySelector('.ptv-ra-pill.pass').textContent).toBe('6');
        expect(node.querySelector('.ptv-ra-pill.fail').textContent).toBe('NA');
        expect(node.querySelector('.ptv-recover-chip').textContent).toBe('Mòdul suspès');
        expect(node.textContent).toContain('A recuperar');
        expect(node.querySelector('.ptv-summary-card').getAttribute('aria-labelledby')).toBe('ptv-summary-ra-title');
        expect(node.querySelector('#ptv-summary-ra-title').tagName).toBe('H2');
        expect(node.querySelector('#ptv-summary-modules-title').classList.contains('ptv-section-title--spaced')).toBe(true);
        expect(node.querySelector('[data-action="download-pdf"]')).not.toBeNull();
    });

    test('hauria de renderitzar la columna EM abans de RA01 si hi ha algun RA 01EM', () => {
        const renderer = new VisualitzadorRenderer();
        const node = renderer.renderStudent({
            id: '2',
            nom: 'Nom EM',
            subjects: [
                { code: 'M01', name: 'Mòdul 1', final: 6, ras: [{ key: '01EM', raw: 'PDT' }, { key: '01RA', raw: 6 }] },
                { code: 'M02', name: 'Mòdul 2', final: 5, ras: [{ key: '01RA', raw: 5 }] }
            ],
        });

        const headers = Array.from(node.querySelectorAll('.ptv-subjects-table thead th')).map(th => th.textContent);
        expect(headers).toEqual(['Mòdul', 'EM', 'RA01', 'Total']);

        const rows = node.querySelectorAll('.ptv-subjects-table tbody tr');
        expect(rows).toHaveLength(2);

        // First row: M01
        const cells1 = Array.from(rows[0].querySelectorAll('td'));
        expect(cells1[1].querySelector('.ptv-ra-pill').textContent).toBe('PDT'); // EM column
        expect(cells1[2].querySelector('.ptv-ra-pill').textContent).toBe('6'); // RA01 column

        // Second row: M02
        const cells2 = Array.from(rows[1].querySelectorAll('td'));
        expect(cells2[1].querySelector('.ptv-ra-pill').textContent).toBe('·'); // EM column is empty
        expect(cells2[2].querySelector('.ptv-ra-pill').textContent).toBe('5'); // RA01 column
    });

    test('hauria de mostrar CV i XM sense convertir-los a NA ni recuperació', () => {
        const renderer = new VisualitzadorRenderer();
        const node = renderer.renderStudent({
            id: '3',
            nom: 'Alumna especial',
            subjects: [
                { code: 'M01', name: 'Mòdul convalidat', final: 'CV', ras: [{ key: '01RA', raw: 'CV' }] },
                { code: 'M02', name: 'Mòdul exempt', final: 'XM', ras: [{ key: '01RA', raw: 'XM' }] },
            ],
        });

        expect(Array.from(node.querySelectorAll('.ptv-total-pill')).map(pill => pill.textContent)).toEqual(['CV', 'XM']);
        expect(Array.from(node.querySelectorAll('.ptv-ra-pill.pass')).map(pill => pill.textContent)).toEqual(['CV', 'XM']);
        expect(node.querySelector('.ptv-recover-card')).toBeNull();
        expect(Array.from(node.querySelectorAll('.ptv-total-pill, .ptv-ra-pill')).map(pill => pill.textContent)).not.toContain('NA');
    });
});
