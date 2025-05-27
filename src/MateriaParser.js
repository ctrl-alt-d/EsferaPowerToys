/**
 * Classe encarregada de processar les files de la taula HTML
 * i construir l’estructura de matèries amb els seus RAs.
 */
export class MateriaParser {
    /**
     * Constructor del parser.
     * @param {PowerToysLogger} logger - Instància del logger per registrar missatges.
     */
    constructor(logger) {
        this.logger = logger;
    }

    /**
     * Analitza les files d’una taula i extreu la llista de matèries i RAs.
     * @param {HTMLElement[]} files - Array de files <tr> de la taula.
     * @returns {Array<{ codi: string, nom: string, RAs: string[] }>} Llista de matèries.
     */
    parse(files) {
        this.logger.log('MateriaParser → inici');
        const materies = [];
        let actual = null;

        files.forEach(row => {
            const codiCell = row.querySelector('td:nth-child(1)');
            const nomCell = row.querySelector('td:nth-child(2)');
            if (!codiCell || !nomCell) return;

            const codi = codiCell.textContent.trim().replace(/\s/g, '');
            const nom = nomCell.textContent.trim();

            this.logger.log(`MateriaParser → codi detectat: ${codi}`);

            if (/^[0-9]{4}_[A-Z0-9]+$/.test(codi)) {
                // Nova matèria detectada
                actual = { codi, nom, RAs: [] };
                materies.push(actual);
                this.logger.log(`MateriaParser → nova matèria afegida: ${codi}`);
            } else if (/^[0-9]{4}_[A-Z0-9]+_[0-9]{2}RA$/.test(codi) && actual) {
                // RA pertanyent a la matèria actual
                actual.RAs.push(codi);
                this.logger.log(`MateriaParser → RA afegit a ${actual.codi}: ${codi}`);
            }
        });

        this.logger.log('MateriaParser → resultat final:', materies);
        return materies;
    }
}
