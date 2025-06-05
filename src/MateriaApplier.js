/**
 * Classe encarregada d’aplicar les notes introduïdes als selectors del formulari
 * i disparar els events necessaris perquè el sistema els registri.
 */
export class MateriaApplier {
    /**
     * Constructor de l’applier.
     * @param {PowerToysLogger} logger - Instància del logger per registrar missatges.
     */
    constructor(logger) {
        this.logger = logger;
    }

    /**
     * Converteix el text d’entrada a un array de codis interns de notes.
     * @param {string} text - Text d’entrada separat per espais (ex: "9 8,5 6 NA").
     * @returns {string[]|null} Array amb codis (ex: ["A10", "A9", "A7", "NA"]) o null si error.
     */
    tradueixNotes(text) {
        if (!text || typeof text !== 'string') return null;

        const valors = text.trim().replace(/\t/g, ' ').replace(/\s+/g, ' ').split(' ');

        const traduïdes = valors.map(v => {
            const vNet = v.replace(',', '.').trim().toUpperCase();
            if (vNet === '' || vNet === '.' || vNet === 'X') return '';
            if (/^A(10|[5-9])$|^NA$|^EP$|^PDT$/.test(vNet)) return vNet;
            if (vNet.startsWith('PENDENT')) return 'PDT';
            const num = parseFloat(vNet);
            if (isNaN(num)) return null;
            if (num >= 9.5) return 'A10';
            if (num >= 8.5) return 'A9';
            if (num >= 7.5) return 'A8';
            if (num >= 6.5) return 'A7';
            if (num >= 5.5) return 'A6';
            if (num >= 4.5) return 'A5';
            return 'NA';
        });

        if (traduïdes.includes(null)) {
            this.logger.warn('MateriaApplier → error en traduir notes:', valors);
            return null;
        }

        this.logger.log('MateriaApplier → notes traduïdes:', traduïdes);
        return traduïdes;
    }

    /**
     * Aplica les notes traduïdes als RAs corresponents de la matèria.
     * @param {string[]} raCodiList - Llista de codis RA.
     * @param {string[]} valors - Llista de valors interns (ex: "A10").
     * @returns {void}
     */
    aplicaNotesARAs(raCodiList, valors) {
        if (!Array.isArray(valors) || valors.length !== raCodiList.length) {
            this.logger.warn('MateriaApplier → la mida de valors no coincideix amb els RAs');
            return;
        }

        raCodiList.forEach((raCodi, index) => {
            const nota = valors[index];
            const valorIntern = nota ? `string:${nota}` : '';
            const td = Array.from(document.querySelectorAll('tr.alturallistat td:first-child'))
                .find(td => td.textContent.trim().replace(/\s/g, '') === raCodi);
            if (!td) {
                this.logger.warn(`MateriaApplier → no trobat td per RA: ${raCodi}`);
                return;
            }
            const row = td.parentElement;
            const select = row.querySelector('select');
            if (!select) {
                this.logger.warn(`MateriaApplier → no trobat select per RA: ${raCodi}`);
                return;
            }
            if (select.disabled) {
                this.logger.warn(`MateriaApplier → select desactivat per RA: ${raCodi}`);
                return;
            }
            if (Array.from(select.options).map(opt => opt.value).includes(valorIntern)) {
                select.value = valorIntern;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                this.logger.log(`MateriaApplier → aplicat ${valorIntern} a ${raCodi}`);
            } else {
                this.logger.warn(`MateriaApplier → valor no vàlid per ${raCodi}: ${valorIntern}`);
            }
        });
    }
}
