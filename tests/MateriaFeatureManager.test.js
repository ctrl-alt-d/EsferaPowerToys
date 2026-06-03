import { JSDOM } from 'jsdom';
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { MateriaFeatureManager } from '../src/materia/MateriaFeatureManager.js';

describe('MateriaFeatureManager', () => {
    let dom;
    let parser;
    let applier;
    let uiBuilder;
    let scrollHelper;
    let materiaStyleManager;
    let containerBuilder;
    let manager;

    beforeEach(() => {
        dom = new JSDOM('<!doctype html><html><body></body></html>');
        global.window = dom.window;
        global.document = dom.window.document;
        global.Event = dom.window.Event;
        global.HTMLElement = dom.window.HTMLElement;
        global.alert = jest.fn();

        parser = { parse: jest.fn(() => [{ codi: 'MAT', nom: 'Matemàtiques', RAs: ['MAT_RA1'] }]) };
        applier = {
            tradueixNotes: jest.fn(() => ['A10']),
            aplicaNotesARAs: jest.fn(),
        };
        uiBuilder = { createHTML: jest.fn(() => Object.assign(document.createElement('div'), { id: 'powertoy-div' })) };
        scrollHelper = { enfocaAssignatura: jest.fn() };
        materiaStyleManager = { aplicaEstils: jest.fn() };
        containerBuilder = { insertDiv: jest.fn((div, form) => form.before(div)) };
        manager = new MateriaFeatureManager(
            { log: jest.fn(), warn: jest.fn() },
            parser,
            applier,
            uiBuilder,
            scrollHelper,
            materiaStyleManager,
            containerBuilder,
        );
    });

    afterEach(() => {
        delete global.window;
        delete global.document;
        delete global.Event;
        delete global.HTMLElement;
        delete global.alert;
    });

    test('només es pot activar amb form de grup i files de notes', () => {
        expect(manager.canActivate()).toBe(false);

        document.body.innerHTML = '<form name="grupAlumne"></form><table><tr class="alturallistat"><td>MAT</td></tr></table>';

        expect(manager.canActivate()).toBe(true);
    });

    test('parseja les files i insereix la UI quan canvia l’alumne', () => {
        document.body.innerHTML = `
            <ol class="breadcrumb"><li><a>Alumna 1</a></li></ol>
            <form name="grupAlumne"></form>
            <table><tr class="alturallistat"><td>MAT</td></tr></table>
        `;

        manager.activateIfReady();

        expect(parser.parse).toHaveBeenCalledWith(Array.from(document.querySelectorAll('tr.alturallistat')));
        expect(uiBuilder.createHTML).toHaveBeenCalledWith(
            [{ codi: 'MAT', nom: 'Matemàtiques', RAs: ['MAT_RA1'] }],
            expect.stringContaining('Valors acceptats'),
        );
        expect(containerBuilder.insertDiv).toHaveBeenCalledWith(expect.any(HTMLElement), document.querySelector('form'));
    });

    test('no reprocessa el mateix alumne', () => {
        document.body.innerHTML = `
            <ol class="breadcrumb"><li><a>Alumna 1</a></li></ol>
            <form name="grupAlumne"></form>
            <table><tr class="alturallistat"><td>MAT</td></tr></table>
        `;

        manager.activateIfReady();
        manager.activateIfReady();

        expect(parser.parse).toHaveBeenCalledTimes(1);
    });

    test('onApply aplica les notes i enfoca la matèria', () => {
        const materia = { codi: 'MAT', nom: 'Matemàtiques', RAs: ['MAT_RA1'] };

        manager.onApply(materia, '10');

        expect(applier.tradueixNotes).toHaveBeenCalledWith('10');
        expect(applier.aplicaNotesARAs).toHaveBeenCalledWith(['MAT_RA1'], ['A10']);
        expect(scrollHelper.enfocaAssignatura).toHaveBeenCalledWith(materia);
    });

    test('posa pendents només a les RA buides i actives de la matèria', () => {
        document.body.innerHTML = `
            <table>
                <tr class="alturallistat"><td>MAT_RA1</td><td><select><option value=""></option><option value="string:PDT"></option></select></td></tr>
                <tr class="alturallistat"><td>MAT_RA2</td><td><select><option value=""></option><option value="string:PQ"></option></select></td></tr>
                <tr class="alturallistat"><td>ALT_RA1</td><td><select><option value=""></option><option value="string:PDT"></option></select></td></tr>
            </table>
        `;

        manager.posaPendentsRA({ codi: 'MAT', nom: 'Matemàtiques', RAs: [] });

        const selects = document.querySelectorAll('select');
        expect(selects[0].value).toBe('string:PDT');
        expect(selects[1].value).toBe('string:PQ');
        expect(selects[2].value).toBe('');
        expect(materiaStyleManager.aplicaEstils).toHaveBeenCalled();
    });
});
