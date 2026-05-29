import { describe, test, expect, beforeEach } from '@jest/globals';
import { NotesMapper } from '../src/dataProviders/NotesMapper.js';

describe('NotesMapper', () => {
    let mapper;

    beforeEach(() => {
        mapper = new NotesMapper();
    });

    test('hauria de normalitzar matrícula, avaluacions i continguts crus d’Esfer@', () => {
        const alumne = {
            identificadorAlumne: 'alu1',
            idMatricula: 'mat1',
            nomComplet: 'Cognom, Nom',
            nomGrup: '1A',
        };
        const dadesAlumne = {
            lAvaluacions: [
                { id: 'ava1', codiExternAva: 'FINAL_1' },
                { id: 'ava2', codiExternAva: 'FINAL_2' },
            ],
            lContinguts: {
                ava1: [
                    { codiExternContingut: 'M01', nom: 'Mòdul 1', jerarquia: '2', qualitativa: 'A7', quantitativa: '7.1' },
                    { codiExternContingut: 'M01_01RA', nom: 'RA 1', jerarquia: '3', qualitativa: 'PDT', quantitativa: null },
                ],
            },
        };

        expect(mapper.normalitzaAlumne(alumne, dadesAlumne)).toEqual({
            success: true,
            idAlumne: 'alu1',
            idMatricula: 'mat1',
            nom: 'Cognom, Nom',
            grup: '1A',
            avaluacions: [
                { id: 'ava1', codi: 'FINAL_1' },
                { id: 'ava2', codi: 'FINAL_2' },
            ],
            continguts: {
                ava1: [
                    { codi: 'M01', nom: 'Mòdul 1', jerarquia: '2', qualitativa: 'A7', quantitativa: '7.1' },
                    { codi: 'M01_01RA', nom: 'RA 1', jerarquia: '3', qualitativa: 'PDT', quantitativa: '' },
                ],
            },
        });
    });

    test('hauria de retornar valors buits quan faltin camps opcionals', () => {
        expect(mapper.normalitzaAlumne({}, {})).toEqual({
            success: true,
            idAlumne: '',
            idMatricula: '',
            nom: '',
            grup: '',
            avaluacions: [],
            continguts: {},
        });
    });

    test('hauria de protegir-se de llistes de continguts no vàlides', () => {
        const continguts = mapper.normalitzaContinguts({ ava1: null, ava2: [{ codiExternContingut: 'M02' }] });

        expect(continguts).toEqual({
            ava1: [],
            ava2: [{ codi: 'M02', nom: '', jerarquia: '', qualitativa: '', quantitativa: '' }],
        });
    });
});
