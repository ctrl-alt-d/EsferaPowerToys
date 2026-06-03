import { JSDOM } from 'jsdom';
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ExcelUIBuilder } from '../src/excel/ExcelUIBuilder.js';

describe('ExcelUIBuilder', () => {
    beforeEach(() => {
        const dom = new JSDOM('<!doctype html><html><body></body></html>');
        global.window = dom.window;
        global.document = dom.window.document;
    });

    afterEach(() => {
        delete global.window;
        delete global.document;
    });

    test('hauria d’afegir el botó de visualització amb la mateixa avaluació seleccionada', async () => {
        const onDownload = jest.fn();
        const onVisualize = jest.fn();
        const containerBuilder = {
            createContainer: jest.fn((content) => content),
        };
        const builder = new ExcelUIBuilder({ log: jest.fn() }, onDownload, containerBuilder, onVisualize);

        const panel = await builder.createPanel(document.createElement('table'));
        panel.querySelector('#powertoys-evaluation-select').value = '2';
        panel.querySelector('#btn-visualitzar-dades').click();
        panel.querySelector('#btn-descargar-xlsx').click();

        expect(panel.querySelector('#btn-visualitzar-dades').textContent).toContain('preview');
        expect(panel.querySelector('#powertoys-evaluation-select').classList.contains('powertoy-excel-evaluation-select')).toBe(true);
        expect(panel.querySelector('#btn-descargar-xlsx').classList.contains('powertoy-excel-download-button')).toBe(true);
        expect(panel.querySelector('#btn-visualitzar-dades').classList.contains('powertoy-excel-visualize-button')).toBe(true);
        expect(onVisualize).toHaveBeenCalledWith(2);
        expect(onDownload).toHaveBeenCalledWith(2);
    });
});
