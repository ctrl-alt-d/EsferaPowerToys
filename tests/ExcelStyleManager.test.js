import { JSDOM } from 'jsdom';
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ExcelStyleManager } from '../src/excel/ExcelStyleManager.js';

describe('ExcelStyleManager', () => {
    beforeEach(() => {
        const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>');
        global.window = dom.window;
        global.document = dom.window.document;
    });

    afterEach(() => {
        delete global.window;
        delete global.document;
    });

    test('hauria d’injectar els estils locals del panell Excel una sola vegada', () => {
        const logger = { log: jest.fn() };

        new ExcelStyleManager(logger);
        new ExcelStyleManager(logger);

        const styles = document.querySelectorAll('#powertoy-excel-styles');
        expect(styles).toHaveLength(1);
        expect(styles[0].textContent).toContain('.powertoy-excel-evaluation-select');
        expect(styles[0].textContent).toContain('.powertoy-excel-download-button');
        expect(styles[0].textContent).toContain('.powertoy-excel-visualize-button');
    });
});
