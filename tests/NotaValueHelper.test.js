import { describe, test, expect, beforeEach } from '@jest/globals';
import { NotaValueHelper } from '../src/dataProviders/NotaValueHelper.js';

describe('NotaValueHelper', () => {
    let helper;

    beforeEach(() => {
        helper = new NotaValueHelper();
    });

    test('hauria de normalitzar codis A i quantitatives amb coma o punt', () => {
        expect(helper.normalitzaValorNota('A8')).toBe(8);
        expect(helper.normalitzaValorNota('A10')).toBe(10);
        expect(helper.normalitzaValorNota('7,5')).toBe(7.5);
        expect(helper.normalitzaValorNota('7.5')).toBe(7.5);
    });

    test('hauria de preservar els codis textuals de nota coneguts', () => {
        ['NA', 'PDT', 'PQ', 'AS', 'AN', 'AE', 'CV', 'XM'].forEach(codi => {
            expect(helper.normalitzaValorNota(codi)).toBe(codi);
            expect(helper.interpretaNota(codi)).toEqual({ tipus: 'code', valor: codi });
        });
    });

    test('hauria de distingir aprovat numèric i resultat superat de domini', () => {
        expect(helper.ésNotaNumericaAprovada(5)).toBe(true);
        expect(helper.ésNotaNumericaAprovada('7,5')).toBe(true);
        expect(helper.ésNotaNumericaAprovada(4.9)).toBe(false);
        expect(helper.ésNotaNumericaAprovada('CV')).toBe(false);

        expect(helper.ésResultatSuperat('A5')).toBe(true);
        expect(helper.ésResultatSuperat('A4')).toBe(false);
        expect(helper.ésResultatSuperat('AS')).toBe(true);
        expect(helper.ésResultatSuperat('AN')).toBe(true);
        expect(helper.ésResultatSuperat('AE')).toBe(true);
        expect(helper.ésResultatSuperat('CV')).toBe(true);
        expect(helper.ésResultatSuperat('XM')).toBe(true);
        expect(helper.ésResultatSuperat('NA')).toBe(false);
        expect(helper.ésResultatPendent('PDT')).toBe(true);
        expect(helper.ésResultatPendent('PQ')).toBe(true);
    });

    test('hauria de normalitzar continguts amb la preferència històrica dels mòduls', () => {
        expect(helper.obtéValorContingut({ jerarquia: '2', quantitativa: '7,5', qualitativa: 'A8' })).toBe(7.5);
        expect(helper.obtéValorContingut({ jerarquia: '3', quantitativa: '7,5', qualitativa: 'A8' })).toBe(8);
        expect(helper.obtéValorContingut({ jerarquia: '2', qualitativa: 'CV' })).toBe('CV');
        expect(helper.obtéValorContingut({ jerarquia: '2', qualitativa: 'XM' })).toBe('XM');
    });
});
