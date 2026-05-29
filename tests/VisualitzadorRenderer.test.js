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
                { code: 'M01', name: 'Mòdul aprovat', final: 6, ras: [{ key: '01RA', raw: 6 }] },
                { code: 'M02', name: 'Mòdul suspès', final: 4, ras: [{ key: '01RA', raw: 'NA' }] },
            ],
        });

        expect(node.querySelector('.ptv-student-name').textContent).toBe('Cognom, Nom');
        expect(node.querySelectorAll('.ptv-subjects-table tbody tr')).toHaveLength(2);
        expect(node.querySelector('.ptv-ra-pill.pass').textContent).toBe('6');
        expect(node.querySelector('.ptv-ra-pill.fail').textContent).toBe('NA');
        expect(node.querySelector('.ptv-recover-chip').textContent).toBe('Mòdul suspès');
        expect(node.textContent).toContain('A recuperar');
        expect(node.querySelector('[data-action="download-pdf"]')).not.toBeNull();
    });
});
