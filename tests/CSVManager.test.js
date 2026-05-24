import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { JSDOM } from 'jsdom';
import { CSVManager } from '../src/CSVManager.js';
import { PowerToysLogger } from '../src/PowerToysLogger.js';

describe('CSVManager', () => {
    let dom;
    let manager;
    let originalBlob;
    let originalUrl;

    const descarregaIObteCSV = (dadesAlumnes, evaluation = 1) => {
        manager.descarregaCSV(dadesAlumnes, evaluation, 'Grup Test');
        return global.Blob.mock.calls[0][0][0].replace(/^\ufeff/, '');
    };

    beforeEach(() => {
        dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
        global.document = dom.window.document;
        global.window = dom.window;

        originalBlob = global.Blob;
        originalUrl = global.URL;

        global.Blob = jest.fn(function (parts, options) {
            this.parts = parts;
            this.options = options;
        });
        global.URL = {
            createObjectURL: jest.fn(() => 'blob:test'),
            revokeObjectURL: jest.fn(),
        };

        jest.spyOn(dom.window.HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

        manager = new CSVManager(new PowerToysLogger(false));
    });

    afterEach(() => {
        jest.restoreAllMocks();
        global.Blob = originalBlob;
        global.URL = originalUrl;
        delete global.document;
        delete global.window;
    });

    test('hauria d’escapar els valors CSV amb comes, cometes i salts de línia', () => {
        const csv = descarregaIObteCSV([
            {
                idAlumne: 'ID, "A"\n1',
                nom: 'Alumne, "Primer"',
                avaluacions: [{ codiExternAva: 'FINAL_1', id: 'ava1' }],
                notes: {
                    ava1: [
                        {
                            codiExternContingut: 'MAT,01',
                            nom: 'Mòdul "Especial"',
                            jerarquia: '2',
                            qualitativa: 'NA, "pendent"',
                        },
                    ],
                },
            },
        ]);

        expect(csv).toBe([
            ',,"Mòdul ""Especial"""',
            'idAlumne,nom,"MAT,01"',
            '"ID, ""A""\n1","Alumne, ""Primer""","NA, ""pendent"""',
        ].join('\n'));
    });

    test('hauria d’usar les notes de l’avaluació seleccionada per construir columnes i files', () => {
        const csv = descarregaIObteCSV([
            {
                idAlumne: '1',
                nom: 'Alumna',
                avaluacions: [
                    { codiExternAva: 'FINAL_1', id: 'ava1' },
                    { codiExternAva: 'FINAL_2', id: 'ava2' },
                ],
                notes: {
                    ava1: [
                        { codiExternContingut: 'M01', nom: 'Mòdul 1', jerarquia: '2', qualitativa: 'A7' },
                    ],
                    ava2: [
                        { codiExternContingut: 'M02', nom: 'Mòdul 2', jerarquia: '2', qualitativa: 'A9' },
                    ],
                },
            },
        ], 1);

        expect(csv).toBe([
            ',,Mòdul 1',
            'idAlumne,nom,M01',
            '1,Alumna,7',
        ].join('\n'));
    });

    test('hauria de generar les columnes en ordre determinista per codi de contingut', () => {
        const csv = descarregaIObteCSV([
            {
                idAlumne: '1',
                nom: 'Alumna',
                avaluacions: [{ codiExternAva: 'FINAL_1', id: 'ava1' }],
                notes: {
                    ava1: [
                        { codiExternContingut: 'M03', nom: 'Mòdul 3', jerarquia: '2', qualitativa: 'A8' },
                        { codiExternContingut: 'M01', nom: 'Mòdul 1', jerarquia: '2', qualitativa: 'A6' },
                        { codiExternContingut: 'M02', nom: 'Mòdul 2', jerarquia: '2', qualitativa: 'A7' },
                    ],
                },
            },
        ]);

        expect(csv.split('\n')[1]).toBe('idAlumne,nom,M01,M02,M03');
        expect(csv.split('\n')[2]).toBe('1,Alumna,6,7,8');
    });
});
