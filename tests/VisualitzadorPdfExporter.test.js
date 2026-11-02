import { JSDOM } from 'jsdom';
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { VisualitzadorPdfExporter } from '../src/visualitzador/VisualitzadorPdfExporter.js';

describe('VisualitzadorPdfExporter', () => {
    let save;
    let exporter;
    let addImage;
    let canvasFactory;

    beforeEach(() => {
        const dom = new JSDOM('<!doctype html><html><body><div id="target"></div></body></html>');
        global.window = dom.window;
        global.document = dom.window.document;
        Object.defineProperty(global.document, 'fonts', { value: { ready: Promise.resolve() }, configurable: true });

        save = jest.fn();
        canvasFactory = jest.fn().mockResolvedValue({
            width: 600,
            height: 900,
            toDataURL: jest.fn().mockReturnValue('data:image/jpeg;base64,test'),
        });
        addImage = jest.fn();
        const pdfFactory = jest.fn().mockImplementation(() => ({
            internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
            setFillColor: jest.fn(),
            rect: jest.fn(),
            addImage,
            addPage: jest.fn(),
            save,
        }));
        exporter = new VisualitzadorPdfExporter(canvasFactory, pdfFactory);
    });

    afterEach(() => {
        delete global.window;
        delete global.document;
    });

    test('hauria de generar el PDF amb nom sanititzat i retirar el mode PDF', async () => {
        const target = document.querySelector('#target');

        await exporter.exporta(target, 'Cognom, Nom / Prova');

        expect(save).toHaveBeenCalledWith('Cognom_Nom_Prova_notes.pdf');
        expect(target.classList.contains('ptv-pdf-mode')).toBe(false);
    });

    test('hauria de capturar des de dalt i deixar marge superior extra al primer full', async () => {
        const target = document.querySelector('#target');

        await exporter.exporta(target, 'Alumne');

        expect(canvasFactory).toHaveBeenCalledWith(target, expect.objectContaining({
            scrollX: 0,
            scrollY: 0,
            y: 0,
        }));
        expect(addImage).toHaveBeenNthCalledWith(
            1,
            'data:image/jpeg;base64,test',
            'JPEG',
            10,
            18,
            190,
            285,
        );
    });
});
