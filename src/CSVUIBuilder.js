/**
 * Classe per a la creació i gestió del panell d'ajustes de PowerToys, incloent l'accés a descàrrega de dades d'avaluació en CSV.
 */
export class CSVUIBuilder {
    /**
     * @param {import('./PowerToysLogger.js').PowerToysLogger} logger
     * @param {function} onDownload Callback activat a l'apretar el botó de CSV
     */
    constructor(logger, onDownload) {
        this.logger = logger;
        this.onDownload = onDownload;
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

        const div = document.createElement("div");
        div.id = "powertoys-info-box";
        div.style.cssText = `
            width: 400px;
            height: 200px;
            background-color: yellow;
            border: 2px solid #333;
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 15px;
            box-sizing: border-box;
            font-family: sans-serif;
        `;
        div.innerHTML = `
            <div>
                <strong>PowerToys</strong><br>
                <span style="font-size:0.9em">Contingut de prova...</span>
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
        table.parentNode.insertBefore(div, table);

        const btnCSV = document.getElementById("btn-descargar-csv");
        if (btnCSV) {
            btnCSV.addEventListener("click", () => {
                this.onDownload();
            });
        }

        this.logger.log("CSVUIBuilder → div inserit correctament");
    }
}
