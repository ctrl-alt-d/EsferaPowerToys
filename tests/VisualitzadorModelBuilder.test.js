import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { VisualitzadorModelBuilder } from '../src/visualitzador/VisualitzadorModelBuilder.js';

describe('VisualitzadorModelBuilder', () => {
    let builder;

    beforeEach(() => {
        builder = new VisualitzadorModelBuilder();
    });

    test('hauria de construir alumnes, mòduls i RAs des del model intern de notes', () => {
        const model = builder.construeixModel([
            {
                idAlumne: '1',
                nom: 'Cognom, Nom',
                avaluacions: [{ codi: 'FINAL_1', id: 'ava1' }],
                continguts: {
                    ava1: [
                        { codi: 'M01', nom: 'Mòdul 1', jerarquia: '2', qualitativa: 'A6' },
                        { codi: 'M01_01RA', nom: 'RA 1', jerarquia: '3', qualitativa: 'A4' },
                        { codi: 'M01_02RA', nom: 'RA 2', jerarquia: '3', qualitativa: 'PDT' },
                    ],
                },
            },
        ], 1);

        expect(model.students).toHaveLength(1);
        expect(model.students[0].subjects[0]).toEqual({
            code: 'M01',
            name: 'Mòdul 1',
            final: 6,
            ras: [
                { key: '01RA', raw: 4 },
                { key: '02RA', raw: 'PDT' },
            ],
        });
    });

    test('hauria de conservar un mòdul sense nota final ni RAs quan només té provisional 0', () => {
        const model = builder.construeixModel([
            {
                idAlumne: '1',
                nom: 'Cognom, Nom',
                avaluacions: [{ codi: 'FINAL_1', id: 'ava1' }],
                continguts: {
                    ava1: [
                        { codi: 'M01', nom: 'Mòdul provisional', jerarquia: '2', qualitativa: '', quantitativa: '', provisional: 0 },
                        { codi: 'M02', nom: 'Mòdul buit', jerarquia: '2', qualitativa: '', quantitativa: '', provisional: '' },
                    ],
                },
            },
        ], 1);

        expect(model.students).toHaveLength(1);
        expect(model.students[0].subjects).toEqual([
            { code: 'M01', name: 'Mòdul provisional', final: '', provisional: 0, ras: [] },
        ]);
    });

    test('hauria d’aplicar les mateixes classes de notes que el visualitzador original', () => {
        expect(builder.scoreClass('NA')).toBe('fail');
        expect(builder.scoreClass(5)).toBe('pass');
        expect(builder.scoreClass(4.9)).toBe('fail');
        expect(builder.scoreClass('PDT')).toBe('pdt');
        expect(builder.finalClass('')).toBe('na');
        expect(builder.finalClass('PQ')).toBe('warn');
        expect(builder.displayVal(undefined)).toBe('NA');
    });

    test('hauria de preservar CV i XM al model i classificar-los com a superats', () => {
        const model = builder.construeixModel([
            {
                idAlumne: '1',
                nom: 'Cognom, Nom',
                avaluacions: [{ codi: 'FINAL_1', id: 'ava1' }],
                continguts: {
                    ava1: [
                        { codi: 'M01', nom: 'Mòdul CV', jerarquia: '2', qualitativa: 'CV' },
                        { codi: 'M01_01RA', nom: 'RA CV', jerarquia: '3', qualitativa: 'CV' },
                        { codi: 'M02', nom: 'Mòdul XM', jerarquia: '2', qualitativa: 'XM' },
                    ],
                },
            },
        ], 1);

        expect(model.students[0].subjects[0].final).toBe('CV');
        expect(model.students[0].subjects[0].ras[0].raw).toBe('CV');
        expect(model.students[0].subjects[1].final).toBe('XM');
        expect(builder.displayVal('CV')).toBe('CV');
        expect(builder.displayVal('XM')).toBe('XM');
        expect(builder.scoreClass('CV')).toBe('pass');
        expect(builder.finalClass('CV')).toBe('pass');
        expect(builder.finalClass('XM')).toBe('pass');
    });

    test('hauria d’agregar totes les avaluacions amb la mateixa semàntica que el full Agregat', () => {
        const model = builder.construeixModel([
            {
                idAlumne: '1',
                nom: 'Cognom, Nom',
                avaluacions: [
                    { codi: 'FINAL_1', id: 'ava1' },
                    { codi: 'FINAL_2', id: 'ava2' },
                ],
                continguts: {
                    ava1: [
                        { codi: 'M01', nom: 'Mòdul 1', jerarquia: '2', qualitativa: 'A6' },
                        { codi: 'M01_01RA', nom: 'RA 1', jerarquia: '3', qualitativa: 'A5' },
                        { codi: 'M02', nom: 'Mòdul 2', jerarquia: '2', qualitativa: 'A4' },
                    ],
                    ava2: [
                        { codi: 'M01', nom: 'Mòdul 1', jerarquia: '2', qualitativa: 'A8' },
                    ],
                },
            },
        ], 'agregat', 2);

        expect(model.students[0].subjects).toEqual([
            {
                code: 'M01',
                name: 'Mòdul 1',
                final: 8,
                ras: [{ key: '01RA', raw: 5 }],
            },
            {
                code: 'M02',
                name: 'Mòdul 2',
                final: 4,
                ras: [],
            },
        ]);
    });

    test('hauria de seleccionar F2 pel codi encara que les avaluacions vinguin desordenades', () => {
        const model = builder.construeixModel([
            {
                idAlumne: '1',
                nom: 'Cognom, Nom',
                avaluacions: [
                    { codi: 'F2', id: 'ava2' },
                    { codi: 'F1', id: 'ava1' },
                ],
                continguts: {
                    ava1: [{ codi: 'M01', nom: 'Primera', jerarquia: '2', qualitativa: 'A5' }],
                    ava2: [{ codi: 'M02', nom: 'Segona', jerarquia: '2', qualitativa: 'A9' }],
                },
            },
        ], 2);

        expect(model.students[0].subjects).toEqual([
            { code: 'M02', name: 'Segona', final: 9, ras: [] },
        ]);
    });

    test('hauria d’usar el helper compartit per resoldre l’agregació canònica', () => {
        const notesAgregades = [{ codi: 'M01', nom: 'Mòdul 1', jerarquia: '2', qualitativa: 'A7' }];
        const aggregationHelper = {
            ésModeAgregació: jest.fn(evaluation => evaluation === 'agregat'),
            obtéNotesAgregades: jest.fn(() => notesAgregades),
        };
        builder = new VisualitzadorModelBuilder(undefined, aggregationHelper);

        const model = builder.construeixModel([{ idAlumne: '1', nom: 'Cognom, Nom', continguts: {}, avaluacions: [] }], 'agregat', 2);

        expect(aggregationHelper.ésModeAgregació).toHaveBeenCalledWith('agregat');
        expect(aggregationHelper.obtéNotesAgregades).toHaveBeenCalledWith(expect.any(Object), 2);
        expect(model.students[0].subjects[0].final).toBe(7);
    });
});
