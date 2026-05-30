import { JSDOM } from 'jsdom';
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ExcelFeatureManager } from '../src/excel/ExcelFeatureManager.js';

describe('ExcelFeatureManager', () => {
    beforeEach(() => {
        const dom = new JSDOM('<!doctype html><html><body></body></html>');
        global.window = dom.window;
        global.document = dom.window.document;
    });

    afterEach(() => {
        delete global.window;
        delete global.document;
    });

    test('només es pot activar quan existeix la taula de matrícula', () => {
        const manager = new ExcelFeatureManager({ log: jest.fn() }, {}, {});

        expect(manager.canActivate()).toBe(false);

        document.body.innerHTML = '<table data-st-table="matriculaAlumneAva"></table>';

        expect(manager.canActivate()).toBe(true);
    });

    test('insereix el panell davant de la taula sense delegar detecció al builder', () => {
        document.body.innerHTML = '<table data-st-table="matriculaAlumneAva"></table>';
        const panel = document.createElement('div');
        panel.id = 'powertoys-info-box';
        const uiBuilder = { createPanel: jest.fn(() => panel) };
        const containerBuilder = { insertDiv: jest.fn((div, table) => table.before(div)) };
        const manager = new ExcelFeatureManager({ log: jest.fn() }, uiBuilder, containerBuilder);

        manager.tryActivate();

        expect(uiBuilder.createPanel).toHaveBeenCalledWith('powertoys-info-box');
        expect(containerBuilder.insertDiv).toHaveBeenCalledWith(panel, document.querySelector('table'));
        expect(document.body.firstElementChild.id).toBe('powertoys-info-box');
    });

    test('no reinserta el panell si ja és davant de la taula', () => {
        document.body.innerHTML = '<div id="powertoys-info-box"></div><table data-st-table="matriculaAlumneAva"></table>';
        const uiBuilder = { createPanel: jest.fn() };
        const containerBuilder = { insertDiv: jest.fn() };
        const manager = new ExcelFeatureManager({ log: jest.fn() }, uiBuilder, containerBuilder);

        manager.tryActivate();

        expect(uiBuilder.createPanel).not.toHaveBeenCalled();
        expect(containerBuilder.insertDiv).not.toHaveBeenCalled();
    });
});
