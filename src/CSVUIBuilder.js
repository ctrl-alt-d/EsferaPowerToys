/**
 * Classe per a la creació i gestió del panell d'ajustes de PowerToys, incloent l'accés a descàrrega de dades d'avaluació en CSV.
 */
export const MAX_AVALUACIONS = 3;

export class CSVUIBuilder {
    /**
     * @param {import('./PowerToysLogger.js').PowerToysLogger} logger
     * @param {function} onDownload Callback activat a l'apretar el botó de CSV
     * @param {import('./ContainerUIBuilder.js').ContainerUIBuilder} containerBuilder - Constructor base del contenidor.
     */
    constructor(logger, onDownload, containerBuilder) {
        this.logger = logger;
        this.onDownload = onDownload;
        this.containerBuilder = containerBuilder;
    }

    /**
     * Insereix automàticament el panell informatiu o actualitza la vista si s'està carregant la taula admesa.
     */
    injectHeaderButtonIfNeeded() {
        var _a;
        const table = document.querySelector(
            'table[data-st-table="matriculaAlumneAva"]',
        );

        if (!table) return;

        if (
            ((_a = table.previousElementSibling) == null ? void 0 : _a.id) ===
            "powertoys-info-box"
        ) {
            return;
        }

        const contentDiv = document.createElement("div");
        let optionsHTML = '';
        for (let i = 1; i <= MAX_AVALUACIONS; i++) {
            optionsHTML += `<option value="${i}">Avaluació ${i}</option>`;
        }

        contentDiv.innerHTML = `
            <div>
                <strong>PowerToys - Exportació CSV</strong><br>
                <span style="font-size:0.9em">Selecciona l'avaluació per descarregar les notes:</span>
            <br>
            <select id="powertoys-evaluation-select" style="
                margin-top: 10px;
                padding: 5px;
                border-radius: 4px;
                border: 1px solid #ccc;
                font-family: sans-serif;
            ">
                ${optionsHTML}
            </select>
            <button id="btn-descargar-csv" style="
                background-color: #22c55e;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                align-self: flex-start;
                margin-top: 10px;
                transition: background 0.2s;
            ">Descargar CSV</button>
            </div>
        `;
        
        const container = this.containerBuilder.createContainer(contentDiv, "powertoys-csv-div");
        this.containerBuilder.insertDiv(container, table);

        const btnCSV = document.getElementById("btn-descargar-csv");
        const selectAvaluacio = document.getElementById("powertoys-evaluation-select");
        if (btnCSV) {
            btnCSV.addEventListener("click", () => {
                const evaluation = selectAvaluacio ? parseInt(selectAvaluacio.value, 10) : 1;
                this.onDownload(evaluation);
            });
        }

        this.logger.log("CSVUIBuilder → div inserit correctament");
    }
}
