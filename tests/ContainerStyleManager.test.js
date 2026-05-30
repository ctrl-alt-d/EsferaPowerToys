import { JSDOM } from 'jsdom';
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ContainerStyleManager } from '../src/ContainerStyleManager.js';

describe('ContainerStyleManager', () => {
    beforeEach(() => {
        const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>');
        global.window = dom.window;
        global.document = dom.window.document;
    });

    afterEach(() => {
        delete global.window;
        delete global.document;
    });

    test('hauria d’injectar els estils compartits una sola vegada', () => {
        const logger = { log: jest.fn() };

        new ContainerStyleManager(logger);
        new ContainerStyleManager(logger);

        const styles = document.querySelectorAll('#powertoy-container-styles');
        expect(styles).toHaveLength(1);
        expect(styles[0].textContent).toContain('.powertoy-container');
        expect(styles[0].textContent).toContain('.powertoy-toggle-button');
        expect(styles[0].textContent).toContain('.powertoy-content-wrapper--collapsed');
        expect(styles[0].textContent).toContain('.powertoy-scroll-highlight');
    });
});
