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

        const codis = this._extractCodis(files);
        const ras = this._filterRAs(codis);
        const modules = this._detectModules(codis, ras);

        const materies = this._buildMateries(files, modules, ras);

        this.logger.log('MateriaParser → resultat final:', materies);
        return materies;
    }

    /**
     * Extreu tots els codis de les files.
     * @param {HTMLElement[]} files
     * @returns {string[]} Llista de codis.
     */
    _extractCodis(files) {
        return files
            .map(row => row.querySelector('td:nth-child(1)')?.textContent.trim().replace(/\s/g, ''))
            .filter(codi => codi);
    }

    /**
     * Filtra els codis que són RAs.
     * @param {string[]} codis
     * @returns {Set<string>} Conjunt de codis RA.
     */
    _filterRAs(codis) {
        const raRegex = /^[0-9]{4}_[A-Z0-9]+_[0-9]{2}RA$/;
        return new Set(codis.filter(codi => raRegex.test(codi)));
    }

    /**
     * Detecta quins codis són mòduls (tenen algun RA que comença per ells).
     * @param {string[]} codis
     * @param {Set<string>} ras
     * @returns {Set<string>} Conjunt de codis mòdul.
     */
    _detectModules(codis, ras) {
        const modules = new Set();
        codis.forEach(codi => {
            const prefix = codi + '_';
            for (const ra of ras) {
                if (ra.startsWith(prefix)) {
                    modules.add(codi);
                    break;
                }
            }
        });
        return modules;
    }

    /**
     * Construeix l’estructura final de matèries.
     * @param {HTMLElement[]} files
     * @param {Set<string>} modules
     * @param {Set<string>} ras
     * @returns {Array<{ codi: string, nom: string, RAs: string[] }>}
     */
    _buildMateries(files, modules, ras) {
        return Array.from(modules).map(modulCodi => {
            const row = files.find(r => {
                const cell = r.querySelector('td:nth-child(1)');
                return cell && cell.textContent.trim().replace(/\s/g, '') === modulCodi;
            });

            const nom = row?.querySelector('td:nth-child(2)')?.textContent.trim() || '';

            const raList = Array.from(ras).filter(ra => ra.startsWith(modulCodi + '_'));

            return { codi: modulCodi, nom, RAs: raList };
        });
    }
}
