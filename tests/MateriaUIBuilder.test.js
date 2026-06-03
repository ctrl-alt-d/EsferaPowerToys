import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { JSDOM } from 'jsdom';
import { MateriaUIBuilder } from '../src/materia/MateriaUIBuilder.js';
import { ContainerUIBuilder } from '../src/ContainerUIBuilder.js';
import { PowerToysLogger } from '../src/PowerToysLogger.js';

describe('MateriaUIBuilder', () => {
    let logger;
    let onApply;
    let onPosaPendents;
    let containerBuilder;
    let builder;
    let dom;

    const materies = [
        { codi: '2024_MAT01', nom: 'Matemàtiques', RAs: ['2024_MAT01_01RA', '2024_MAT01_02RA'] },
        { codi: '2024_INF01', nom: 'Informàtica', RAs: ['2024_INF01_01RA'] },
    ];

    beforeEach(() => {
        logger = new PowerToysLogger(false);
        onApply = jest.fn();
        onPosaPendents = jest.fn();
        containerBuilder = new ContainerUIBuilder(logger, '1.0.0');
        builder = new MateriaUIBuilder(logger, onApply, onPosaPendents, containerBuilder);

        dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
        global.document = dom.window.document;
        global.window = dom.window;
    });

    afterEach(() => {
        delete global.document;
        delete global.window;
    });

    test('hauria de crear un contenidor amb id powertoy-div', () => {
        const container = builder.createHTML(materies);
        expect(container.id).toBe('powertoy-div');
    });

    test('hauria de crear una fila per cada matèria', () => {
        const container = builder.createHTML(materies);
        const tableWrapper = container.querySelector('.powertoy-table-wrapper');
        const table = tableWrapper ? tableWrapper.querySelector('.powertoy-table') : container.querySelector('.powertoy-table');
        const rows = table ? table.querySelectorAll('tr') : [];
        expect(rows).toHaveLength(materies.length);
    });

    test('hauria de mostrar el codi i nom de cada matèria', () => {
        const container = builder.createHTML(materies);
        const tableWrapper = container.querySelector('.powertoy-table-wrapper');
        const table = tableWrapper ? tableWrapper.querySelector('.powertoy-table') : container.querySelector('.powertoy-table');
        const firstCell = table ? table.querySelector('tr td') : null;
        expect(firstCell.textContent).toBe('2024_MAT01 — Matemàtiques');
    });

    test('hauria de tenir un wrapper semàntic per la taula', () => {
        const container = builder.createHTML(materies);
        const tableWrapper = container.querySelector('.powertoy-table-wrapper');
        expect(tableWrapper).not.toBeNull();
        expect(tableWrapper.classList.contains('powertoy-materia-table-wrapper')).toBe(true);
    });

    test('hauria de mostrar la versió', () => {
        const container = builder.createHTML(materies);
        const versionDiv = container.querySelector('.powertoy-version');
        expect(versionDiv.textContent).toContain('1.0.0');
    });

    test('hauria de mostrar les instruccions quan es proporcionen', () => {
        const container = builder.createHTML(materies, 'Valors acceptats');
        const instructionsDiv = container.querySelector('.powertoy-instructions');

        expect(instructionsDiv.textContent).toBe('Valors acceptats');
    });

    test('el botó Aplica hauria de cridar onApply amb la matèria i el valor', () => {
        const container = builder.createHTML(materies);
        const input = container.querySelector('input');
        const btnAplica = container.querySelector('button.btn-primary');

        input.value = '9 8';
        btnAplica.click();

        expect(onApply).toHaveBeenCalledWith(materies[0], '9 8');
    });

    test('el botó Posar pendent hauria de cridar onPosaPendents amb la matèria', () => {
        const container = builder.createHTML(materies);
        const btnPendent = container.querySelector('button.btn-warning');

        btnPendent.click();

        expect(onPosaPendents).toHaveBeenCalledWith(materies[0]);
    });

    test('no hauria de crear files si el fieldset està desactivat', () => {
        // Simula l'estructura DOM amb fieldset disabled
        const body = dom.window.document.body;
        body.innerHTML = '<div class="main"><div class="ng-scope"><fieldset class="ng-scope" disabled></fieldset></div></div>';

        const container = builder.createHTML(materies);
        const rows = container.querySelectorAll('.powertoy-table tr');
        expect(rows).toHaveLength(0);
    });

    test('hauria de tenir un botó de toggle amb id powertoy-toggle-btn', () => {
        const container = builder.createHTML(materies);
        const toggleBtn = container.querySelector('#powertoy-div-toggle-btn');
        expect(toggleBtn).not.toBeNull();
        expect(toggleBtn.textContent).toBe('−');
    });

    test('hauria de tenir un botó de toggle amb classes Bootstrap i semàntica pròpia', () => {
        const container = builder.createHTML(materies);
        const toggleBtn = container.querySelector('#powertoy-div-toggle-btn');
        expect(toggleBtn.classList.contains('btn')).toBe(true);
        expect(toggleBtn.classList.contains('btn-secondary')).toBe(true);
        expect(toggleBtn.classList.contains('btn-sm')).toBe(true);
        expect(toggleBtn.classList.contains('powertoy-toggle-button')).toBe(true);
    });

    test('hauria de tenir una taula amb classe powertoy-table', () => {
        const container = builder.createHTML(materies);
        const table = container.querySelector('.powertoy-table');
        expect(table).not.toBeNull();
        expect(table.classList.contains('powertoy-materia-table')).toBe(true);
    });

    test('hauria d’assignar classes semàntiques als controls de cada matèria', () => {
        const container = builder.createHTML(materies);

        expect(container.querySelector('.powertoy-materia-name-cell')).not.toBeNull();
        expect(container.querySelector('.powertoy-materia-input-cell')).not.toBeNull();
        expect(container.querySelector('.powertoy-materia-input')).not.toBeNull();
        expect(container.querySelector('.powertoy-materia-actions-cell')).not.toBeNull();
        expect(container.querySelector('.powertoy-materia-pendent-button')).not.toBeNull();
    });

    test('hauria de tenir un versionDiv amb classe powertoy-version', () => {
        const container = builder.createHTML(materies);
        const versionDiv = container.querySelector('.powertoy-version');
        expect(versionDiv).not.toBeNull();
    });

    test('hauria de tenir el contenidor amb classe powertoy-container', () => {
        const container = builder.createHTML(materies);
        expect(container.classList.contains('powertoy-container')).toBe(true);
    });

    test('toggle button hauria d\'ocultar la taula i canviar el text a +', () => {
        const container = builder.createHTML(materies);
        const body = dom.window.document.body;
        body.appendChild(container); // Inserir al DOM perquè getElementById funcioni
        const toggleBtn = container.querySelector('#powertoy-div-toggle-btn');
        const contentWrapper = container.querySelector('.powertoy-content-wrapper');

        // Estat inicial: visible
        expect(contentWrapper.classList.contains('powertoy-content-wrapper--collapsed')).toBe(false);
        expect(toggleBtn.textContent).toBe('−');

        // Clic per comprimir
        toggleBtn.click();
        expect(contentWrapper.classList.contains('powertoy-content-wrapper--collapsed')).toBe(true);
        expect(toggleBtn.textContent).toBe('+');
    });

    test('toggle button hauria de mostrar la taula de nou si ja està oculta', () => {
        const container = builder.createHTML(materies);
        const body = dom.window.document.body;
        body.appendChild(container); // Inserir al DOM perquè getElementById funcioni
        const toggleBtn = container.querySelector('#powertoy-div-toggle-btn');
        const contentWrapper = container.querySelector('.powertoy-content-wrapper');

        // Primera vegada: comprimir
        toggleBtn.click();
        expect(contentWrapper.classList.contains('powertoy-content-wrapper--collapsed')).toBe(true);

        // Segona vegada: expandir
        toggleBtn.click();
        expect(contentWrapper.classList.contains('powertoy-content-wrapper--collapsed')).toBe(false);
        expect(toggleBtn.textContent).toBe('−');
    });

    test('toggle button hauria d\'accedir al container mitjançant interacció', () => {
        const container = builder.createHTML(materies);
        const body = dom.window.document.body;
        body.appendChild(container); // Inserir al DOM

        const toggleBtn = container.querySelector('#powertoy-div-toggle-btn');
        const contentWrapper = container.querySelector('.powertoy-content-wrapper');

        // Comprimir
        toggleBtn.click();
        expect(contentWrapper.classList.contains('powertoy-content-wrapper--collapsed')).toBe(true);

        // Expandir
        toggleBtn.click();
        expect(contentWrapper.classList.contains('powertoy-content-wrapper--collapsed')).toBe(false);
    });
});
