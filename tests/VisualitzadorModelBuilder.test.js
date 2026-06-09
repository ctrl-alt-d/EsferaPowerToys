import { describe, test, expect, beforeEach } from '@jest/globals';
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
});
