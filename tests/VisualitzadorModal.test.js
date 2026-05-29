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
        expect(document.activeElement).toBe(select);
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

    test('hauria d’injectar estils del visualitzador amb text gran i selector prou alt', () => {
        modal.open(students);

        const styles = document.querySelector('#ptv-styles').textContent;

        expect(styles).toContain('.ptv-subj-name-text { font-size:1.4rem;');
        expect(styles).toContain('#ptv-student-select.ptv-student-select {');
        expect(styles).toContain('height:45px !important;');
        expect(styles).toContain('min-height:45px;');
        expect(styles).not.toContain('height:25px');
        expect(styles).not.toContain('max-height');
        expect(styles).not.toContain('background:var(--ptv-red-dim); border:1px solid var(--ptv-red); color:var(--ptv-red); padding:4px 10px; border-radius:5px; font-size:1.36rem;');
    });

    test('hauria d’injectar estils responsius sense solapament i amb scroll intern', () => {
        modal.open(students);

        const styles = document.querySelector('#ptv-styles').textContent;

        expect(styles).toContain('display:flex; flex-direction:column; width:100vw; height:100vh; height:100dvh; overflow:hidden;');
        expect(styles).toContain('.ptv-student-view { flex:1 1 auto; min-height:0; overflow:auto;');
        expect(styles).toContain('.ptv-main-grid { display:grid; grid-template-columns:minmax(0, 1fr) minmax(280px, 360px);');
        expect(styles).toContain('.ptv-table-scroll { min-width:0; overflow-x:auto; }');
        expect(styles).toContain('.ptv-right-col { display:flex; flex-direction:column; gap:12px; min-width:0; position:sticky; top:16px; }');
        expect(styles).toContain('@media (max-width:1280px) { .ptv-main-grid { grid-template-columns:1fr; } .ptv-right-col { position:static; display:grid; grid-template-columns:repeat(2, minmax(0, 1fr));');
        expect(styles).toContain('@media (max-width:700px)');
        expect(styles).toContain('#ptv-student-select.ptv-student-select { min-width:0; max-width:none; width:100%; }');
    });

    test('hauria de declarar el modal com a diàleg accessible amb controls etiquetats', () => {
        modal.open(students);

        const overlay = document.querySelector('.ptv-overlay');

        expect(overlay.getAttribute('role')).toBe('dialog');
        expect(overlay.getAttribute('aria-modal')).toBe('true');
        expect(overlay.getAttribute('aria-label')).toBe('Visualitzador de notes dels alumnes');
        expect(document.querySelector('label[for="ptv-student-select"]').textContent).toBe('Alumne');
        expect(document.querySelector('[data-action="previous"]').getAttribute('aria-label')).toBe('Alumne anterior');
        expect(document.querySelector('[data-action="next"]').getAttribute('aria-label')).toBe('Alumne següent');
        expect(document.querySelector('[data-action="close"]').getAttribute('aria-label')).toBe('Tanca el visualitzador');
    });

    test('hauria de contenir el focus dins del modal i restaurar-lo en tancar', () => {
        const opener = document.createElement('button');
        opener.textContent = 'Obre visualitzador';
        document.body.appendChild(opener);
        opener.focus();

        modal.open(students);

        const select = document.querySelector('#ptv-student-select');
        const close = document.querySelector('[data-action="close"]');
        close.focus();
        document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
        expect(document.activeElement).toBe(select);

        document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(document.activeElement).toBe(opener);
    });

    test('hauria de mostrar l’avís de preview amb les limitacions conegudes', () => {
        modal.open(students);

        const disclaimer = document.querySelector('.ptv-preview-disclaimer');

        expect(disclaimer).not.toBeNull();
        expect(disclaimer.getAttribute('role')).toBe('status');
        expect(disclaimer.textContent).toContain('previsualització');
        expect(disclaimer.textContent).toContain('estada en empresa');
        expect(disclaimer.textContent).toContain('RA opcionals');
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
