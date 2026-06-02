import { JSDOM } from 'jsdom';
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ExcelUIBuilder } from '../src/excel/ExcelUIBuilder.js';

describe('ExcelUIBuilder', () => {
    beforeEach(() => {
        const dom = new JSDOM('<!doctype html><html><body><table data-st-table="matriculaAlumneAva"></table></body></html>');
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
            insertDiv: jest.fn((container, table) => table.before(container)),
        };
        const builder = new ExcelUIBuilder({ log: jest.fn() }, onDownload, containerBuilder, onVisualize);

        await builder.injectHeaderButtonIfNeeded();
        document.querySelector('#powertoys-evaluation-select').value = '2';
        document.querySelector('#btn-visualitzar-dades').click();
        document.querySelector('#btn-descargar-xlsx').click();

        expect(document.querySelector('#btn-visualitzar-dades').textContent).toContain('preview');
        expect(onVisualize).toHaveBeenCalledWith(2);
        expect(onDownload).toHaveBeenCalledWith(2);
    });
});
