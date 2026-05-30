/**
 * Gestiona els estils locals del panell d'exportació Excel.
 */
export class ExcelStyleManager {
    /**
     * @param {import('../PowerToysLogger.js').PowerToysLogger} logger
     */
    constructor(logger) {
        this.logger = logger;
        this.injectStyles();
    }

    /**
     * Injecta els estils del panell Excel una sola vegada.
     * @returns {void}
     */
    injectStyles() {
        if (document.getElementById('powertoy-excel-styles')) return;

        const style = document.createElement('style');
        style.id = 'powertoy-excel-styles';
        style.textContent = `
            .powertoy-excel-help-text {
                font-size: 0.9em;
            }

            .powertoy-excel-evaluation-select {
                margin-top: 10px;
                padding: 5px;
                border-radius: 4px;
                border: 1px solid #ccc;
                font-family: sans-serif;
            }

            .powertoy-excel-actions {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
                align-items: center;
                margin-top: 10px;
            }

            .powertoy-excel-button {
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                align-self: flex-start;
                transition: background 0.2s;
            }

            .powertoy-excel-download-button {
                background-color: #22c55e;
            }

            .powertoy-excel-visualize-button {
                background-color: #2563eb;
            }
        `;

        document.head.appendChild(style);
        this.logger.log('ExcelStyleManager → estils injectats');
    }
}
