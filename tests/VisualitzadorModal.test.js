import { JSDOM } from 'jsdom';
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { VisualitzadorModal } from '../src/visualitzador/VisualitzadorModal.js';
import { VisualitzadorRenderer } from '../src/visualitzador/VisualitzadorRenderer.js';

describe('VisualitzadorModal', () => {
    let modal;
    let pdfExporter;

    beforeEach(() => {
        const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>');
        global.window = dom.window;
        global.document = dom.window.document;
        global.alert = jest.fn();
        pdfExporter = { exporta: jest.fn().mockResolvedValue(undefined) };
        modal = new VisualitzadorModal({ error: jest.fn(), log: jest.fn() }, new VisualitzadorRenderer(), pdfExporter);
    });

    afterEach(() => {
        delete global.window;
        delete global.document;
        delete global.alert;
    });

    const students = [
        { id: '1', nom: 'Alumne 1', subjects: [{ code: 'M01', name: 'Mòdul 1', final: 6, ras: [] }] },
        { id: '2', nom: 'Alumne 2', subjects: [{ code: 'M02', name: 'Mòdul 2', final: 4, ras: [] }] },
    ];

    test('hauria de seleccionar el primer alumne i sincronitzar selector i botons', () => {
        modal.open(students);

        const select = document.querySelector('#ptv-student-select');
        const previous = document.querySelector('[data-action="previous"]');
        const next = document.querySelector('[data-action="next"]');

        expect(select.value).toBe('0');
        expect(previous.disabled).toBe(true);
        expect(next.disabled).toBe(false);
        expect(previous.textContent).toBe('← Anterior (←)');
        expect(next.textContent).toBe('Següent (→)');
        expect(document.body.textContent).toContain('Alumne 1');

        next.click();

        expect(select.value).toBe('1');
        expect(previous.disabled).toBe(false);
        expect(next.disabled).toBe(true);
        expect(document.body.textContent).toContain('Alumne 2');
    });

    test('hauria de navegar amb fletxes respectant els extrems desactivats', () => {
        modal.open(students);

        document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
        expect(document.querySelector('#ptv-student-select').value).toBe('0');

        document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        expect(document.querySelector('#ptv-student-select').value).toBe('1');
        expect(document.querySelector('[data-action="next"]').disabled).toBe(true);

        document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        expect(document.querySelector('#ptv-student-select').value).toBe('1');

        document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
        expect(document.querySelector('#ptv-student-select').value).toBe('0');
    });

    test('hauria d’injectar estils del visualitzador amb text gran i sense alçada màxima al selector', () => {
        modal.open(students);

        const styles = document.querySelector('#ptv-styles').textContent;

        expect(styles).toContain('.ptv-subj-name-text { font-size:1.4rem;');
        expect(styles).toContain('.ptv-student-select {');
        expect(styles).not.toContain('max-height');
        expect(styles).not.toContain('background:var(--ptv-red-dim); border:1px solid var(--ptv-red); color:var(--ptv-red); padding:4px 10px; border-radius:5px; font-size:1.36rem;');
    });

    test('hauria de delegar la descàrrega PDF de l’alumne actual', async () => {
        modal.open(students);

        document.querySelector('[data-action="download-pdf"]').click();
        await Promise.resolve();

        expect(pdfExporter.exporta).toHaveBeenCalledWith(
            document.querySelector('#powertoys-visualitzador-pdf-target'),
            'Alumne 1',
        );
    });
});
