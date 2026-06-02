/**
 * Classe per a la creació i gestió del panell de descàrrega de notes en Excel.
 */
export class ExcelUIBuilder {
    /**
     * @param {import('../PowerToysLogger.js').PowerToysLogger} logger
     * @param {functioddn} onDownload Callback activat a l'apretar el botó d'Excel
     * @param {import('../ContainerUIBuilder.js').ContainerUIBuilder} containerBuilder - Constructor base del contenidor.
     * @param {function} onVisualize Callback activat a l'apretar el botó del visualitzador
     * @param {import('../dataProviders/NotesDataProvider.js').NotesDataProvider} dataProvider - Proveïdor de dades de notes.
     */
    constructor(logger, onDownload, containerBuilder, onVisualize = null, dataProvider = null) {
        this.logger = logger;
        this.onDownload = onDownload;
        this.containerBuilder = containerBuilder;
        this.onVisualize = onVisualize;
        this.dataProvider = dataProvider;
        this.maxAvaluacions = 4;
    }

    async updateMaxAvaluacions() {
        if (!this.dataProvider) return;
        
        const idGrup = this.dataProvider.extractIdGrup();
        if (!idGrup) return;

        const isParcial = window.location.pathname.includes("parcialAvaluacioGrupAlumne");
        const type = isParcial ? 'parcial' : 'final';
        const cacheKey = `powertoys_max_avaluacions_${type}_${idGrup}`;
        
        const cached = localStorage.getItem(cacheKey);
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        if (cached) {
            try {
                const parsed = JSON.parse(cached);

                //s'actualitza cada hora
                if (now - parsed.timestamp < oneHour) {
                    this.maxAvaluacions = parsed.maxAvaluacions;
                    return;
                }
            } catch (e) {
                this.logger.warn('Error parsejant cache de maxAvaluacions', e);
            }
        }

        try {
            const injector = this.dataProvider.obtéInjectorAngular();
            if (!injector) return;

            let factory;
            if (isParcial) {
                factory = injector.get('newParcialAvaluacioGrupAlumneFactory');
            } else {
                factory = injector.get('newFinalAvaluacioGrupAlumneFactory');
            }

            const matricules = await this.dataProvider.extractIdMatricula(factory, idGrup, injector);
            if (!matricules || matricules.length === 0) return;

            const primerAlumne = matricules[0];
            const data = await this.dataProvider.fetchAvaluacioData(factory, primerAlumne.idMatricula, idGrup);
            
            if (data && data.lAvaluacions && Array.isArray(data.lAvaluacions)) {
                this.maxAvaluacions = data.lAvaluacions.length;
                localStorage.setItem(cacheKey, JSON.stringify({ maxAvaluacions: this.maxAvaluacions, timestamp: now }));
                this.logger.log(`ExcelUIBuilder → maxAvaluacions actualitzat a ${this.maxAvaluacions} per a ${type} (grup ${idGrup})`);
            }
        } catch (error) {
            this.logger.error('ExcelUIBuilder → Error obtenint maxAvaluacions:', error);
        }
    }

    /**
     * Insereix automàticament el panell informatiu o actualitza la vista si s'està carregant la taula admesa.
     */
    async injectHeaderButtonIfNeeded() {
        const table = document.querySelector(
            'table[data-st-table="matriculaAlumneAva"]',
        );

        if (!table) return;

        if (table.previousElementSibling?.id === 'powertoys-info-box') {
            return;
        }

        await this.updateMaxAvaluacions();

        // Comprovem de nou després de l'espera per evitar duplicitats si l'observador s'ha disparat varies vegades
        if (table.previousElementSibling?.id === 'powertoys-info-box') {
            return;
        }

        const contentDiv = document.createElement('div');
        let optionsHTML = '';
        for (let i = 1; i <= this.maxAvaluacions; i++) {
            optionsHTML += `<option value="${i}">Avaluació ${i}</option>`;
        }

        contentDiv.innerHTML = `
            <div>
                <strong>PowerToys - Exportació Excel</strong><br>
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
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px;">
            <button id="btn-descargar-xlsx" style="
                background-color: #22c55e;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                align-self: flex-start;
                transition: background 0.2s;
            ">Descarregar Excel</button>
            <button id="btn-visualitzar-dades" style="
                background-color: #2563eb;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                align-self: flex-start;
                transition: background 0.2s;
            ">Visualitzar dades (preview)</button>
            </div>
            </div>
        `;

        const container = this.containerBuilder.createContainer(contentDiv, 'powertoys-info-box');
        this.containerBuilder.insertDiv(container, table);

        const btnExcel = document.getElementById('btn-descargar-xlsx');
        const selectAvaluacio = document.getElementById('powertoys-evaluation-select');
        if (btnExcel) {
            btnExcel.addEventListener('click', () => {
                const evaluation = selectAvaluacio ? parseInt(selectAvaluacio.value, 10) : 1;
                this.onDownload(evaluation);
            });
        }

        const btnVisualitzar = document.getElementById('btn-visualitzar-dades');
        if (btnVisualitzar && this.onVisualize) {
            btnVisualitzar.addEventListener('click', () => {
                const evaluation = selectAvaluacio ? parseInt(selectAvaluacio.value, 10) : 1;
                this.onVisualize(evaluation);
            });
        }

        this.logger.log('ExcelUIBuilder → div inserit correctament');
    }
}
