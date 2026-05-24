import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { JSDOM } from 'jsdom';
import { ExcelExportManager } from '../src/excel/ExcelExportManager.js';
import { PowerToysLogger } from '../src/PowerToysLogger.js';

describe('ExcelExportManager', () => {
    let dom;
    let manager;
    let originalBlob;
    let originalUrl;
    let clickedDownload;
    let dataProvider;
    let workbookBuilder;

    beforeEach(() => {
        dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
        global.document = dom.window.document;
        global.window = dom.window;

        originalBlob = global.Blob;
        originalUrl = global.URL;
        clickedDownload = null;

        global.Blob = jest.fn(function (parts, options) {
            this.parts = parts;
            this.options = options;
        });
        global.URL = {
            createObjectURL: jest.fn(() => 'blob:test'),
            revokeObjectURL: jest.fn(),
        };

        jest.spyOn(dom.window.HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
            clickedDownload = this.download;
        });

        dataProvider = {
            obtéDadesExportació: jest.fn(),
        };
        workbookBuilder = {
            construeixWorkbookNotes: jest.fn(() => ({
                xlsx: {
                    writeBuffer: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
                },
            })),
        };
        manager = new ExcelExportManager(new PowerToysLogger(false), dataProvider, workbookBuilder);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        global.Blob = originalBlob;
        global.URL = originalUrl;
        delete global.document;
        delete global.window;
    });

    test('hauria de descarregar un fitxer XLSX amb el tipus Blob correcte', async () => {
        const dadesAlumnes = [{ idAlumne: '1', nom: 'Alumna', notes: {} }];

        await manager.descarregaXLSX(dadesAlumnes, 1, 'Grup Test');

        expect(workbookBuilder.construeixWorkbookNotes).toHaveBeenCalledWith(dadesAlumnes, 1);
        expect(global.Blob).toHaveBeenCalledWith(
            [expect.any(Uint8Array)],
            { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
        );
        expect(clickedDownload).toMatch(/^Esfera_Notes_av_1_\d{4}-\d{2}-\d{2}_Grup Test\.xlsx$/);
        expect(global.URL.createObjectURL).toHaveBeenCalledWith(expect.any(global.Blob));
        expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
    });

    test('hauria de coordinar proveïdor, constructor i descàrrega per a l’avaluació seleccionada', async () => {
        const notesAlumnes = [{ idAlumne: '1', nom: 'Alumna', notes: {} }];
        dataProvider.obtéDadesExportació.mockResolvedValue({ notesAlumnes, nomGrup: 'Grup Test' });

        await manager.procésDescàrregaExcel(2);

        expect(dataProvider.obtéDadesExportació).toHaveBeenCalledTimes(1);
        expect(workbookBuilder.construeixWorkbookNotes).toHaveBeenCalledWith(notesAlumnes, 2);
        expect(clickedDownload).toMatch(/^Esfera_Notes_av_2_\d{4}-\d{2}-\d{2}_Grup Test\.xlsx$/);
    });
});
