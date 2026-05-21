import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { JSDOM } from 'jsdom';
import { MateriaUIBuilder } from '../src/MateriaUIBuilder.js';
import { PowerToysLogger } from '../src/PowerToysLogger.js';

describe('MateriaUIBuilder', () => {
    let logger;
    let onApply;
    let onPosaPendents;
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
        builder = new MateriaUIBuilder(logger, onApply, onPosaPendents, '1.0.0');

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
        const rows = container.querySelectorAll('table tr');
        expect(rows).toHaveLength(materies.length);
    });

    test('hauria de mostrar el codi i nom de cada matèria', () => {
        const container = builder.createHTML(materies);
        const firstCell = container.querySelector('table tr td');
        expect(firstCell.textContent).toBe('2024_MAT01 — Matemàtiques');
    });

    test('hauria de mostrar la versió', () => {
        const container = builder.createHTML(materies);
        const versionDiv = container.querySelector('div');
        expect(versionDiv.textContent).toContain('1.0.0');
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
        const rows = container.querySelectorAll('table tr');
        expect(rows).toHaveLength(0);
    });

    test('hauria de tenir un botó de toggle amb id powertoy-toggle-btn', () => {
        const container = builder.createHTML(materies);
        const toggleBtn = container.querySelector('#powertoy-toggle-btn');
        expect(toggleBtn).not.toBeNull();
        expect(toggleBtn.textContent).toBe('−');
    });

    test('hauria de tenir un botó de toggle amb classe btn btn-secondary btn-sm', () => {
        const container = builder.createHTML(materies);
        const toggleBtn = container.querySelector('#powertoy-toggle-btn');
        expect(toggleBtn.className).toBe('btn btn-secondary btn-sm');
    });

    test('hauria de tenir una taula amb classe powertoy-table', () => {
        const container = builder.createHTML(materies);
        const table = container.querySelector('.powertoy-table');
        expect(table).not.toBeNull();
    });

    test('hauria de tenir un versionDiv amb classe powertoy-version', () => {
        const container = builder.createHTML(materies);
        const versionDiv = container.querySelector('.powertoy-version');
        expect(versionDiv).not.toBeNull();
    });

    test('hauria de tenir el contenedor amb classes powertoy-container i estils relatius', () => {
        const container = builder.createHTML(materies);
        expect(container.classList.contains('powertoy-container')).toBe(true);
        expect(container.style.position).toBe('relative');
    });

    test('toggleContainer hauria d\'ocultar la taula i canviar el botó a +', () => {
        const container = builder.createHTML(materies);
        const body = dom.window.document.body;
        body.appendChild(container); // Inserir al DOM perquè getElementById funcioni
        const toggleBtn = container.querySelector('#powertoy-toggle-btn');
        const table = container.querySelector('.powertoy-table');

        // Estat inicial: visible
        expect(table.style.display).toBe('');
        expect(toggleBtn.textContent).toBe('−');

        // Clic per comprimir
        builder.toggleContainer();
        expect(table.style.display).toBe('none');
        expect(toggleBtn.textContent).toBe('+');
    });

    test('toggleContainer hauria de mostrar la taula de nou si ja està oculta', () => {
        const container = builder.createHTML(materies);
        const body = dom.window.document.body;
        body.appendChild(container); // Inserir al DOM perquè getElementById funcioni
        const toggleBtn = container.querySelector('#powertoy-toggle-btn');
        const table = container.querySelector('.powertoy-table');

        // Primera vegada: comprimir
        builder.toggleContainer();
        expect(table.style.display).toBe('none');

        // Segona vegada: expandir
        builder.toggleContainer();
        expect(table.style.display).toBe('');
        expect(toggleBtn.textContent).toBe('−');
    });

    test('toggleContainer hauria d\'accedir al container mitjançant id', () => {
        const container = builder.createHTML(materies);
        const body = dom.window.document.body;
        body.appendChild(container); // Inserir al DOM

        const toggleBtn = container.querySelector('#powertoy-toggle-btn');
        const table = container.querySelector('.powertoy-table');

        // Comprimir
        builder.toggleContainer();
        expect(table.style.display).toBe('none');

        // Expandir
        builder.toggleContainer();
        expect(table.style.display).toBe('');
    });
});
