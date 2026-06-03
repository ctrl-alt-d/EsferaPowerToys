/**
 * Classe per a la creació i gestió del panell de descàrrega de notes en Excel.
 */
export class ExcelUIBuilder {
    /**
     * @param {import('../PowerToysLogger.js').PowerToysLogger} logger
     * @param {function} onDownload Callback activat a l'apretar el botó d'Excel
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
        this.maxAvaluacions = await this.dataProvider.obtéMaxAvaluacions();
    }

    /**
     * Crea el panell informatiu amb els controls d'Excel i visualització.
     * @param {string} id - Identificador del contenidor del panell.
     * @returns {HTMLElement} Panell preparat per inserir al DOM.
     */
    async createPanel(id = 'powertoys-info-box') {
        const contentDiv = document.createElement('div');
        const panelContent = document.createElement('div');

        const title = document.createElement('strong');
        title.textContent = 'PowerToys - Exportació Excel';

        const helpText = document.createElement('span');
        helpText.className = 'powertoy-excel-help-text';
        helpText.textContent = "Selecciona l'avaluació per descarregar les notes:";

        await this.updateMaxAvaluacions();

        // Comprovem de nou després de l'espera per evitar duplicitats si l'observador s'ha disparat varies vegades
        if (table.previousElementSibling?.id === 'powertoys-info-box') {
            return;
        }

        const contentDiv = document.createElement('div');
        let optionsHTML = '';
        const select = document.createElement('select');
        select.id = 'powertoys-evaluation-select';
        select.className = 'powertoy-excel-evaluation-select';
        for (let i = 1; i <= this.maxAvaluacions; i++) {
            const option = document.createElement('option');
            option.value = `${i}`;
            option.textContent = `Avaluació ${i}`;
            select.appendChild(option);
        }

        const actions = document.createElement('div');
        actions.className = 'powertoy-excel-actions';

        const downloadButton = document.createElement('button');
        downloadButton.id = 'btn-descargar-xlsx';
        downloadButton.className = 'powertoy-excel-button powertoy-excel-download-button';
        downloadButton.textContent = 'Descarregar Excel';

        const visualizeButton = document.createElement('button');
        visualizeButton.id = 'btn-visualitzar-dades';
        visualizeButton.className = 'powertoy-excel-button powertoy-excel-visualize-button';
        visualizeButton.textContent = 'Visualitzar dades (preview)';

        actions.appendChild(downloadButton);
        actions.appendChild(visualizeButton);
        panelContent.appendChild(title);
        panelContent.appendChild(document.createElement('br'));
        panelContent.appendChild(helpText);
        panelContent.appendChild(document.createElement('br'));
        panelContent.appendChild(select);
        panelContent.appendChild(actions);
        
      .appendChild(panelContent);

        const container = this.containerBuilder.createContainer(contentDiv, id);

        const btnExcel = container.querySelector('#btn-descargar-xlsx');
        const selectAvaluacio = container.querySelector('#powertoys-evaluation-select');
        if (btnExcel) {
            btnExcel.addEventListener('click', () => {
                const evaluation = selectAvaluacio ? parseInt(selectAvaluacio.value, 10) : 1;
                this.onDownload(evaluation);
            });
        }

        const btnVisualitzar = container.querySelector('#btn-visualitzar-dades');
        if (btnVisualitzar && this.onVisualize) {
            btnVisualitzar.addEventListener('click', () => {
                const evaluation = selectAvaluacio ? parseInt(selectAvaluacio.value, 10) : 1;
                this.onVisualize(evaluation);
            });
        }

        this.logger.log('ExcelUIBuilder → panell creat');
        return container;
    }
}
