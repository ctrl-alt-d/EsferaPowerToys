import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import ExcelJS from 'exceljs';
import { ExcelNotesWorkbookBuilder } from '../src/excel/ExcelNotesWorkbookBuilder.js';

describe('ExcelNotesWorkbookBuilder', () => {
    let builder;

    const creaDadesAlumnes = () => ([
        {
            idAlumne: '1',
            nom: 'Alumna',
            avaluacions: [
                { codi: 'FINAL_1', id: 'ava1' },
                { codi: 'FINAL_2', id: 'ava2' },
            ],
            continguts: {
                ava1: [
                    { codi: 'M03', nom: 'Mòdul 3', jerarquia: '2', qualitativa: 'A8', convocatoria: '1' },
                    { codi: 'M01', nom: 'Mòdul 1', jerarquia: '2', qualitativa: 'A6' },
                    { codi: 'M02', nom: 'RA 2', jerarquia: '3', qualitativa: 'A4' },
                    { codi: 'M04', nom: 'Mòdul 4', jerarquia: '2', qualitativa: 'NA', convocatoria: '2' },
                ],
                ava2: [
                    { codi: 'M05', nom: 'Mòdul 5', jerarquia: '2', qualitativa: 'A9', convocatoria: '1' },
                    { codi: 'M06', nom: 'Mòdul 6', jerarquia: '2', qualitativa: 'PDT' },
                    { codi: 'M07', nom: 'Mòdul 7', jerarquia: '2', qualitativa: 'PDT', provisional: 8 },
                ],
            },
        },
    ]);

    const creaWorksheet = (dadesAlumnes = creaDadesAlumnes(), evaluation = 1) => {
        const workbook = builder.construeixWorkbookNotes(dadesAlumnes, evaluation);
        return workbook.getWorksheet('Notes');
    };

    const creaWorkbook = (dadesAlumnes = creaDadesAlumnes(), evaluation = 1) => (
        builder.construeixWorkbookNotes(dadesAlumnes, evaluation)
    );

    const obtéFiles = worksheet => {
        const files = [];
        worksheet.eachRow(row => files.push(row.values.slice(1)));
        return files;
    };

    beforeEach(() => {
        builder = new ExcelNotesWorkbookBuilder(ExcelJS);
    });

    test('hauria de congelar les dues primeres files i columnes', () => {
        const worksheet = creaWorksheet();

        expect(worksheet.views).toEqual([{ state: 'frozen', xSplit: 2, ySplit: 2 }]);
    });

    test('hauria de crear les pestanyes Notes i Notes Flat', () => {
        const workbook = creaWorkbook();

        expect(workbook.worksheets.map(worksheet => worksheet.name)).toEqual(['Notes', 'Notes Flat']);
    });

    test('hauria de generar la capçalera exacta de Notes Flat', () => {
        const worksheet = creaWorkbook().getWorksheet('Notes Flat');

        expect(worksheet.getRow(1).values.slice(1)).toEqual([
            'idAlumne',
            'nom Alumne',
            'Codi Mòdul',
            'Nom Mòdul',
            'Codi',
            'Nom',
            'Tipus',
            'Subtipus',
            'Nota',
        ]);
    });

    test('hauria de generar files planes per MP, RA i EM amb el mòdul pare', () => {
        const worksheet = creaWorkbook([
            {
                idAlumne: '1',
                nom: 'Alumna',
                avaluacions: [{ codi: 'FINAL_1', id: 'ava1' }],
                continguts: {
                    ava1: [
                        { codi: '0484_ICC0', nom: 'Bases de dades', jerarquia: '2', qualitativa: 'A8' },
                        { codi: '0484_ICC0_01RA', nom: 'RA 1', jerarquia: '3', qualitativa: 'A6' },
                        { codi: '0484_ICC0_01EM', nom: 'EM 1', jerarquia: '4', qualitativa: 'A5' },
                    ],
                },
            },
        ]).getWorksheet('Notes Flat');

        expect(obtéFiles(worksheet).slice(1)).toEqual([
            ['1', 'Alumna', '0484_ICC0', 'Bases de dades', '0484_ICC0', 'Bases de dades', 'MP', 'MP', 8],
            ['1', 'Alumna', '0484_ICC0', 'Bases de dades', '0484_ICC0_01RA', 'RA 1', 'RA', '01', 6],
            ['1', 'Alumna', '0484_ICC0', 'Bases de dades', '0484_ICC0_01EM', 'EM 1', 'EM', '01', 5],
        ]);
    });

    test('hauria de posar Subtipus MP per les files de mòdul professional', () => {
        const worksheet = creaWorkbook().getWorksheet('Notes Flat');

        const filaModul = worksheet.getRow(2).values.slice(1);

        expect(filaModul[6]).toBe('MP');
        expect(filaModul[7]).toBe('MP');
    });

    test('hauria d’activar autofilter a totes les columnes de Notes Flat', () => {
        const worksheet = creaWorkbook().getWorksheet('Notes Flat');

        expect(worksheet.autoFilter).toEqual({
            from: { row: 1, column: 1 },
            to: { row: 1, column: 9 },
        });
    });

    test('hauria de congelar les dues primeres columnes i la capçalera de Notes Flat', () => {
        const worksheet = creaWorkbook().getWorksheet('Notes Flat');

        expect(worksheet.views).toEqual([{ state: 'frozen', xSplit: 2, ySplit: 1 }]);
    });

    test('hauria de deixar buit el nom del mòdul pare si el contingut RA no té el mòdul disponible', () => {
        const worksheet = creaWorkbook([
            {
                idAlumne: '1',
                nom: 'Alumna',
                avaluacions: [{ codi: 'FINAL_1', id: 'ava1' }],
                continguts: {
                    ava1: [
                        { codi: '0484_ICC0_01RA', nom: 'RA 1', jerarquia: '3', qualitativa: 'A7' },
                    ],
                },
            },
        ]).getWorksheet('Notes Flat');

        expect(worksheet.getRow(2).values.slice(1)).toEqual([
            '1', 'Alumna', '0484_ICC0', '', '0484_ICC0_01RA', 'RA 1', 'RA', '01', 7,
        ]);
    });

    test('hauria de normalitzar les notes de Notes Flat igual que Notes', () => {
        const workbook = creaWorkbook([
            {
                idAlumne: '1',
                nom: 'Alumna',
                avaluacions: [{ codi: 'FINAL_1', id: 'ava1' }],
                continguts: {
                    ava1: [
                        { codi: '0484_ICC0', nom: 'Bases de dades', jerarquia: '2', quantitativa: '7,5', qualitativa: 'A8' },
                        { codi: '0484_ICC0_01RA', nom: 'RA 1', jerarquia: '3', qualitativa: 'A8' },
                    ],
                },
            },
        ]);

        expect(workbook.getWorksheet('Notes').getCell('D3').value).toBe(7.5);
        expect(workbook.getWorksheet('Notes Flat').getRow(2).getCell(9).value).toBe(7.5);
        expect(workbook.getWorksheet('Notes Flat').getRow(3).getCell(9).value).toBe(8);
    });

    test('hauria d’usar el helper compartit per obtenir i classificar notes', () => {
        const helper = {
            obtéValorContingut: jest.fn(() => 6),
            ésNotaNumericaAprovada: jest.fn(() => true),
        };
        builder = new ExcelNotesWorkbookBuilder(ExcelJS, helper);

        const worksheet = creaWorksheet([
            {
                idAlumne: '1',
                nom: 'Alumna',
                avaluacions: [{ codi: 'FINAL_1', id: 'ava1' }],
                continguts: { ava1: [{ codi: 'M01', nom: 'Mòdul 1', jerarquia: '2', qualitativa: 'A6' }] },
            },
        ]);

        expect(worksheet.getCell('D3').value).toBe(6);
        expect(helper.obtéValorContingut).toHaveBeenCalled();
        expect(helper.ésNotaNumericaAprovada).toHaveBeenCalledWith(6);
    });

    test('hauria d’usar les notes de l’avaluació seleccionada', () => {
        const worksheet = creaWorksheet(creaDadesAlumnes(), 2);

        expect(worksheet.getRow(2).values.slice(1)).toEqual(['idAlumne', 'nom', 'n. convocatoria', 'M05', 'provisional', 'n. convocatoria', 'M06', 'provisional', 'n. convocatoria', 'M07', 'provisional']);
        expect(worksheet.getRow(3).values.slice(1)).toEqual(['1', 'Alumna', '1', 9, undefined, undefined, 'PDT', undefined, undefined, 'PDT', 8]);
    });

    test('hauria de generar les columnes en ordre determinista per codi de contingut', () => {
        const worksheet = creaWorksheet();

        expect(worksheet.getRow(2).values.slice(1)).toEqual(['idAlumne', 'nom', 'n. convocatoria', 'M01', 'provisional', 'M02', 'n. convocatoria', 'M03', 'provisional', 'n. convocatoria', 'M04', 'provisional']);
        expect(worksheet.getRow(3).values.slice(1)).toEqual(['1', 'Alumna', undefined, 6, undefined, 4, '1', 8, undefined, '2', 'NA', undefined]);
    });

    test('hauria de pintar de verd només les notes numèriques iguals o superiors a cinc', () => {
        const worksheet = creaWorksheet();

        expect(worksheet.getCell('D3').fill.fgColor.argb).toBe('FFC6EFCE'); // M01=6
        expect(worksheet.getCell('F3').fill).toBeUndefined(); // M02=4
        expect(worksheet.getCell('H3').fill.fgColor.argb).toBe('FFC6EFCE'); // M03=8
        expect(worksheet.getCell('K3').fill.fgColor.argb).toBe('FFF1F5F9'); // M04=NA (default background)
    });

    test('hauria d’aplicar a Notes Flat els mateixos colors de nota aprovada que a Notes', () => {
        const workbook = creaWorkbook();
        const notes = workbook.getWorksheet('Notes');
        const notesFlat = workbook.getWorksheet('Notes Flat');

        expect(notesFlat.getRow(2).getCell(9).fill.fgColor.argb).toBe(notes.getCell('H3').fill.fgColor.argb); // A8 aprovada
        expect(notesFlat.getRow(2).getCell(9).font.color.argb).toBe(notes.getCell('H3').font.color.argb);
        expect(notesFlat.getRow(3).getCell(9).fill.fgColor.argb).toBe(notes.getCell('D3').fill.fgColor.argb); // A6 aprovada
        expect(notesFlat.getRow(4).getCell(9).fill).toBeUndefined(); // A4 suspesa
        expect(notesFlat.getRow(5).getCell(9).fill).toBeUndefined(); // NA no numèrica
    });

    test('hauria d’aplicar el color de nota aprovada a tota la fila de Notes Flat', () => {
        const worksheet = creaWorkbook().getWorksheet('Notes Flat');
        const filaAprovada = worksheet.getRow(2);

        for (let colNumber = 1; colNumber <= 9; colNumber++) {
            expect(filaAprovada.getCell(colNumber).fill.fgColor.argb).toBe('FFC6EFCE');
            expect(filaAprovada.getCell(colNumber).font.color.argb).toBe('FF006100');
        }
    });

    test('hauria de mantenir sense estil les files suspeses o textuals de Notes Flat', () => {
        const worksheet = creaWorkbook().getWorksheet('Notes Flat');

        for (const rowNumber of [4, 5]) {
            for (let colNumber = 1; colNumber <= 9; colNumber++) {
                expect(worksheet.getRow(rowNumber).getCell(colNumber).fill).toBeUndefined();
                expect(worksheet.getRow(rowNumber).getCell(colNumber).font).toBeUndefined();
            }
        }
    });

    test('hauria de considerar les cadenes numèriques com a notes per aplicar estils', () => {
        const worksheet = creaWorksheet([
            {
                idAlumne: '1',
                nom: 'Alumna',
                avaluacions: [{ codi: 'FINAL_1', id: 'ava1' }],
                continguts: {
                    ava1: [
                        { codi: 'M01', nom: 'Mòdul 1', jerarquia: '2', qualitativa: '5' },
                    ],
                },
            },
        ]);

        expect(worksheet.getCell('D3').value).toBe('5');
        expect(worksheet.getCell('D3').fill.fgColor.argb).toBe('FFC6EFCE');
    });

    test('hauria de fusionar capçaleres de mòdul només en trams contigus', () => {
        const worksheet = creaWorksheet();

        expect(worksheet.getCell('C1').value).toBe('Mòdul 1');
        expect(worksheet.getCell('D1').value).toBe('Mòdul 1');
        expect(worksheet.getCell('E1').value).toBe('Mòdul 1');
        expect(worksheet.getCell('F1').value).toBe('Mòdul 1');
        
        expect(worksheet.getCell('G1').value).toBe('Mòdul 3');
        expect(worksheet.getCell('H1').value).toBe('Mòdul 3');
        expect(worksheet.getCell('I1').value).toBe('Mòdul 3');
        
        expect(worksheet.getCell('J1').value).toBe('Mòdul 4');
        expect(worksheet.getCell('K1').value).toBe('Mòdul 4');
        expect(worksheet.getCell('L1').value).toBe('Mòdul 4');
    });

    test('hauria de posar en negreta la primera columna de cada mòdul', () => {
        const worksheet = creaWorksheet();

        expect(worksheet.getCell('C2').font.bold).toBe(true);
        expect(worksheet.getCell('C3').font.bold).toBe(true);
        expect(worksheet.getCell('D2').font.bold).toBe(true);
        expect(worksheet.getCell('D3').font?.bold).toBeUndefined();
    });

    test('hauria de posar border a les notes i marcar els límits dels mòduls', () => {
        const worksheet = creaWorksheet();

        // M01 span: C a F
        expect(worksheet.getCell('C3').border.left.style).toBe('medium');
        expect(worksheet.getCell('C3').border.right.style).toBe('thin');
        expect(worksheet.getCell('D3').border.right.style).toBe('thin');
        expect(worksheet.getCell('F3').border.right.style).toBe('medium');

        // M03 span: G a I
        expect(worksheet.getCell('G3').border.left.style).toBe('medium');
        expect(worksheet.getCell('G3').border.right.style).toBe('thin');
        expect(worksheet.getCell('I3').border.right.style).toBe('medium');
    });

    test('hauria d’alinear a la dreta les notes i les capçaleres de RA', () => {
        const worksheet = creaWorksheet();

        expect(worksheet.getCell('A2').alignment.horizontal).toBe('center');
        expect(worksheet.getCell('B2').alignment.horizontal).toBe('center');
        expect(worksheet.getCell('C2').alignment.horizontal).toBe('right');
        expect(worksheet.getCell('D2').alignment.horizontal).toBe('right');
        expect(worksheet.getCell('C3').alignment.horizontal).toBe('right');
        expect(worksheet.getCell('D3').alignment.horizontal).toBe('right');
        expect(worksheet.getCell('B3').alignment).toBeUndefined();
    });

    test('hauria de mantenir estretes les columnes de notes encara que la capçalera del mòdul sigui llarga', () => {
        const worksheet = creaWorksheet([
            {
                idAlumne: '1',
                nom: 'Alumna amb un nom una mica llarg',
                avaluacions: [{ codi: 'FINAL_1', id: 'ava1' }],
                continguts: {
                    ava1: [
                        { codi: '0485_ICC0', nom: 'Programació amb un nom de mòdul molt llarg', jerarquia: '2', qualitativa: 'A7' },
                        { codi: '0485_ICC0_01RA', nom: 'RA 1', jerarquia: '3', qualitativa: 'A6' },
                    ],
                },
            },
        ]);

        expect(worksheet.getColumn(1).width).toBe(16);
        expect(worksheet.getColumn(2).width).toBeGreaterThan(18);
        expect(worksheet.getColumn(3).width).toBeLessThanOrEqual(14);
        expect(worksheet.getColumn(4).width).toBeLessThanOrEqual(14);
    });
});
