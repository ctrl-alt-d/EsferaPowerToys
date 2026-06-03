/**
 * Gestiona l'activació del panell d'exportació Excel i visualització de dades.
 */
export class ExcelFeatureManager {
    /**
     * @param {import('../PowerToysLogger.js').PowerToysLogger} logger
     * @param {import('./ExcelUIBuilder.js').ExcelUIBuilder} uiBuilder
     * @param {import('../ContainerUIBuilder.js').ContainerUIBuilder} containerBuilder
     */
    constructor(logger, uiBuilder, containerBuilder) {
        this.logger = logger;
        this.uiBuilder = uiBuilder;
        this.containerBuilder = containerBuilder;
        this.tableSelector = 'table[data-st-table="matriculaAlumneAva"]';
        this.containerId = 'powertoys-info-box';
    }

    /**
     * Localitza la taula de matrícula que habilita Excel i visualitzador.
     * @returns {HTMLTableElement|null}
     */
    detectContext() {
        return document.querySelector(this.tableSelector);
    }

    /**
     * @returns {boolean} Cert si la funcionalitat es pot activar.
     */
    canActivate() {
        return this.detectContext() !== null;
    }

    /**
     * Insereix el panell si la taula existeix i encara no hi és.
     * @returns {void}
     */
    tryActivate() {
        const table = this.detectContext();
        if (!table) return;

        if (table.previousElementSibling?.id === this.containerId) {
            return;
        }

        const panel = this.uiBuilder.createPanel(this.containerId);
        this.containerBuilder.insertDiv(panel, table);
        this.logger.log('ExcelFeatureManager → panell inserit correctament');
    }
}
