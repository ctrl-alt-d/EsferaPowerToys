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
            if (vNet === 'P') return 'PDT';
            if (vNet.startsWith('PENDENT') || vNet === 'NP') return 'PDT';
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
     * Cerca el select associat a una RA.
     * @param {string} raCodi - Codi de la RA.
     * @returns {HTMLSelectElement|null}
     */
    getSelectForRA(raCodi) {
        const td = Array.from(document.querySelectorAll('tr.alturallistat td:first-child'))
            .find(cell => cell.textContent.trim().replace(/\s/g, '') === raCodi);
        if (!td) return null;

        const row = td.parentElement;
        return row ? row.querySelector('select') : null;
    }

    /**
     * Construeix una vista prèvia dels canvis que s'aplicarien.
     * @param {string[]} raCodiList - Llista de codis RA.
     * @param {string[]} valors - Llista de valors interns.
     * @returns {{valid: boolean, items: object[], summary: object}}
     */
    creaPlaAplicacio(raCodiList, valors) {
        if (!Array.isArray(valors) || valors.length !== raCodiList.length) {
            return {
                valid: false,
                items: [],
                summary: {
                    total: raCodiList.length,
                    changes: 0,
                    unchanged: 0,
                    skipped: 0,
                    errors: 1,
                },
            };
        }

        const items = raCodiList.map((raCodi, index) => {
            const nota = valors[index];
            const valorIntern = nota ? `string:${nota}` : '';
            const select = this.getSelectForRA(raCodi);

            if (!select) {
                return {
                    raCodi,
                    nota,
                    currentValue: '',
                    newValue: valorIntern,
                    status: 'error',
                    message: 'No s\'ha trobat el selector de nota',
                };
            }

            if (select.disabled) {
                return {
                    raCodi,
                    nota,
                    currentValue: select.value,
                    newValue: valorIntern,
                    status: 'skipped',
                    message: 'Selector desactivat',
                };
            }

            const optionValues = Array.from(select.options).map(option => option.value);
            if (!optionValues.includes(valorIntern)) {
                return {
                    raCodi,
                    nota,
                    currentValue: select.value,
                    newValue: valorIntern,
                    status: 'error',
                    message: `Valor no disponible: ${valorIntern || 'blanc'}`,
                };
            }

            if (select.value === valorIntern) {
                return {
                    raCodi,
                    nota,
                    currentValue: select.value,
                    newValue: valorIntern,
                    status: 'unchanged',
                    message: 'Sense canvis',
                };
            }

            return {
                raCodi,
                nota,
                currentValue: select.value,
                newValue: valorIntern,
                status: 'change',
                message: 'Es modificarà',
            };
        });

        const summary = items.reduce((acc, item) => {
            if (item.status === 'change') acc.changes += 1;
            if (item.status === 'unchanged') acc.unchanged += 1;
            if (item.status === 'skipped') acc.skipped += 1;
            if (item.status === 'error') acc.errors += 1;
            return acc;
        }, {
            total: items.length,
            changes: 0,
            unchanged: 0,
            skipped: 0,
            errors: 0,
        });

        return {
            valid: summary.errors === 0,
            items,
            summary,
        };
    }

    /**
     * Aplica les notes traduïdes als RAs corresponents de la matèria.
     * @param {string[]} raCodiList - Llista de codis RA.
     * @param {string[]} valors - Llista de valors interns (ex: "A10").
     * @returns {{applied: number, unchanged: number, skipped: number, errors: number, previousValues: object[]}}
     */
    aplicaNotesARAs(raCodiList, valors) {
        const plan = this.creaPlaAplicacio(raCodiList, valors);
        if (!plan.valid) {
            this.logger.warn('MateriaApplier → la mida de valors no coincideix amb els RAs');
            return {
                applied: 0,
                unchanged: plan.summary.unchanged,
                skipped: plan.summary.skipped,
                errors: plan.summary.errors,
                previousValues: [],
            };
        }

        const previousValues = [];

        plan.items
            .filter(item => item.status === 'change')
            .forEach(item => {
                const select = this.getSelectForRA(item.raCodi);
                if (!select) return;

                previousValues.push({
                    raCodi: item.raCodi,
                    value: select.value,
                });
                select.value = item.newValue;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                this.logger.log(`MateriaApplier → aplicat ${item.newValue} a ${item.raCodi}`);
            });

        return {
            applied: previousValues.length,
            unchanged: plan.summary.unchanged,
            skipped: plan.summary.skipped,
            errors: plan.summary.errors,
            previousValues,
        };
    }

    /**
     * Restaura els valors previs guardats abans d'una aplicació.
     * @param {{raCodi: string, value: string}[]} previousValues - Valors previs per RA.
     * @returns {number} Nombre de selects restaurats.
     */
    desfesCanvis(previousValues) {
        if (!Array.isArray(previousValues)) return 0;

        let restored = 0;
        previousValues.forEach(item => {
            const select = this.getSelectForRA(item.raCodi);
            if (!select || select.disabled) return;

            select.value = item.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            restored += 1;
        });

        return restored;
    }
}
