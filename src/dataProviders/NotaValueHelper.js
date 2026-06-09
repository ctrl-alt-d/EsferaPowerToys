/**
 * Centralitza la semàntica de notes compartida entre Excel i visualitzador.
 */
export class NotaValueHelper {
    static CODIS_CONEGUTS = new Set(['NA', 'PDT', 'PQ', 'AS', 'AN', 'AE', 'CV', 'XM']);

    /**
     * Normalitza valors genèrics: A8 -> 8, decimals amb coma -> número i codis textuals preservats.
     */
    normalitzaValorNota(valor) {
        if (this.ésBuit(valor)) return '';
        if (typeof valor === 'number') return valor;

        const text = String(valor).trim();
        if (/^A\d{1,2}$/i.test(text)) return Number(text.replace(/\D/g, ''));
        if (/^\d+(?:[.,]\d+)?$/.test(text)) return Number(text.replace(',', '.'));

        return text;
    }

    /**
     * Normalitza qualitatives preservant codis textuals i cadenes numèriques no codificades.
     */
    normalitzaQualitativa(valor) {
        if (this.ésBuit(valor)) return '';
        const text = String(valor).trim();
        if (/^A\d{1,2}$/i.test(text)) return Number(text.replace(/\D/g, ''));
        return text;
    }

    /**
     * Normalitza quantitatives convertint decimals amb coma o punt a número.
     */
    normalitzaQuantitativa(valor) {
        return this.normalitzaValorNota(valor);
    }

    /**
     * Obté el valor visible d'un contingut mantenint la preferència històrica dels mòduls.
     */
    obtéValorContingut(contingut) {
        if (!contingut) return '';

        if (contingut.jerarquia == 2 && !this.ésBuit(contingut.quantitativa)) {
            return this.normalitzaQuantitativa(contingut.quantitativa);
        }

        if (!this.ésBuit(contingut.qualitativa)) {
            return this.normalitzaQualitativa(contingut.qualitativa);
        }

        if (!this.ésBuit(contingut.quantitativa)) {
            return this.normalitzaQuantitativa(contingut.quantitativa);
        }

        return '';
    }

    /**
     * Interpreta un valor normalitzat com a número, codi reconegut, buit o desconegut.
     */
    interpretaNota(valor) {
        if (this.ésBuit(valor)) return { tipus: 'empty', valor: null };

        const normalitzat = this.normalitzaValorNota(valor);
        if (this.ésBuit(normalitzat)) return { tipus: 'empty', valor: null };
        if (typeof normalitzat === 'number') return { tipus: 'number', valor: normalitzat };

        const codi = String(normalitzat).trim().toUpperCase();
        if (this.codisConeguts().has(codi)) return { tipus: 'code', valor: codi };

        return { tipus: 'unknown', valor: normalitzat };
    }

    /**
     * Determina si un valor és una nota numèrica aprovada.
     */
    ésNotaNumericaAprovada(valor) {
        const interpretada = this.interpretaNota(valor);
        return interpretada.tipus === 'number' && interpretada.valor >= 5;
    }

    /**
     * Determina si un valor representa un resultat superat en domini de notes.
     */
    ésResultatSuperat(valor) {
        const interpretada = this.interpretaNota(valor);
        if (interpretada.tipus === 'number') return interpretada.valor >= 5;
        return ['AS', 'AN', 'AE', 'CV', 'XM'].includes(interpretada.valor);
    }

    /**
     * Determina si un valor representa un resultat pendent.
     */
    ésResultatPendent(valor) {
        const interpretada = this.interpretaNota(valor);
        return ['PDT', 'PQ'].includes(interpretada.valor);
    }

    /**
     * Codis textuals de nota que el domini reconeix i preserva.
     */
    codisConeguts() {
        return NotaValueHelper.CODIS_CONEGUTS;
    }

    ésBuit(valor) {
        return valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() === '');
    }
}
