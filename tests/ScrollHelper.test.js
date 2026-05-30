import { JSDOM } from 'jsdom';
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ScrollHelper } from '../src/materia/ScrollHelper.js';

describe('ScrollHelper', () => {
    beforeEach(() => {
        const dom = new JSDOM('<!doctype html><html><body><table><tr><td class="ng-binding ng-scope">UF1 ¬(MAT1)</td></tr></table></body></html>');
        global.window = dom.window;
        global.document = dom.window.document;
        global.HTMLElement = dom.window.HTMLElement;
        global.HTMLElement.prototype.scrollIntoView = jest.fn();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        delete global.HTMLElement;
        delete global.window;
        delete global.document;
    });

    test('hauria de destacar la fila amb classes temporals', () => {
        const helper = new ScrollHelper({ log: jest.fn(), warn: jest.fn() });
        const targetTd = document.querySelector('td.ng-binding.ng-scope');

        helper.enfocaAssignatura({ codi: 'MAT1', nom: 'Matèria', RAs: [] });

        expect(targetTd.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
        expect(targetTd.classList.contains('powertoy-scroll-highlight')).toBe(true);
        expect(targetTd.classList.contains('powertoy-scroll-highlight--active')).toBe(true);

        jest.advanceTimersByTime(1500);

        expect(targetTd.classList.contains('powertoy-scroll-highlight')).toBe(true);
        expect(targetTd.classList.contains('powertoy-scroll-highlight--active')).toBe(false);

        jest.advanceTimersByTime(500);

        expect(targetTd.classList.contains('powertoy-scroll-highlight')).toBe(false);
    });
});
