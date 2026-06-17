/**
 * Gestiona els estils i classes visuals de la funcionalitat de matèries.
 */
export class MateriaStyleManager {
    constructor(logger) {
        this.logger = logger;
        this.injectStyles();
    }

    injectStyles() {
        if (document.getElementById('powertoy-materia-styles')) return;

        const style = document.createElement('style');
        style.id = 'powertoy-materia-styles';
        style.textContent = `
            .powertoy-pass { background-color: #d4edda !important; }
            .powertoy-fail { background-color: #f8d7da !important; }
            .powertoy-pendent { background-color: #d1ecf1 !important; }
            .powertoy-proces { background-color: #fff3cd !important; }
            .powertoy-pq { background-color: #d1ecf1 !important; }
            .powertoy-pass select,
            .powertoy-fail select,
            .powertoy-pendent select,
            .powertoy-proces select,
            .powertoy-pq select {
                background-color: inherit !important;
            }

            /* Força l'alçada del fieldset relativa a l'alçada real de la finestra. */
            fieldset.col-md-12.bordure {
                padding: 0 !important;
                height: calc(100vh - 250px) !important;
                max-height: calc(100vh - 190px) !important;
                overflow-y: auto !important;
                display: block !important;
                box-sizing: border-box !important;
            }

            /* Elimina l'alçada fixa injectada per JS i deixa que ocupi tot l'espai disponible. */
            fieldset.col-md-12.bordure .container-auto-resize {
                height: auto !important;
                max-height: none !important;
                flex: 1 !important;
                min-height: 0 !important;
                overflow: visible !important;
            }

            /* Assegura que la taula no generi desbordaments horitzontals que trenquin el layout. */
            fieldset.col-md-12.bordure table.grades-table {
                min-width: 0 !important;
                table-layout: fixed !important;
            }

            .powertoy-materia-table-wrapper {
                max-width: 100%;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
            }

            .powertoy-materia-table {
                width: 98%;
                border-collapse: collapse;
                min-width: 320px;
            }

            .powertoy-materia-content {
                width: 100%;
            }

            .powertoy-materia-live-region {
                margin: 4px 0 8px;
                font-weight: 600;
            }

            .powertoy-materia-toolbar {
                display: flex;
                justify-content: flex-end;
                gap: 6px;
                margin-bottom: 8px;
            }

            .powertoy-materia-name-cell {
                border-bottom: 1px solid #ddd;
                white-space: nowrap;
                padding: 8px 4px;
                text-align: left;
            }

            .powertoy-materia-input-cell {
                min-width: 180px;
            }

            .powertoy-materia-input {
                width: 100%;
                box-sizing: border-box;
            }

            .powertoy-materia-actions-cell {
                min-width: 260px;
            }

            .powertoy-materia-action-button {
                width: max-content;
                margin-right: 4px;
            }

            .powertoy-materia-pendent-button {
                margin-left: 4px;
            }

            .powertoy-materia-preview-cell {
                min-width: 260px;
                max-width: 420px;
                padding: 6px 4px;
                vertical-align: top;
            }

            .powertoy-materia-preview-summary {
                font-weight: 600;
                margin-bottom: 4px;
            }

            .powertoy-materia-preview-summary--ok {
                color: #155724;
            }

            .powertoy-materia-preview-summary--error {
                color: #721c24;
            }

            .powertoy-materia-preview-list {
                margin: 0;
                padding-left: 18px;
                max-height: 120px;
                overflow: auto;
            }

            .powertoy-materia-preview-item {
                line-height: 1.35;
            }

            .powertoy-materia-preview-item--change::marker {
                color: #155724;
            }

            .powertoy-materia-preview-item--unchanged::marker,
            .powertoy-materia-preview-item--skipped::marker {
                color: #856404;
            }

            .powertoy-materia-preview-item--error::marker {
                color: #721c24;
            }
        `;

        document.head.appendChild(style);
        this.logger.log('MateriaStyleManager → estils injectats');
    }

    aplicaEstils() {
        const selects = document.querySelectorAll('tr.alturallistat select');

        selects.forEach(select => {
            const tr = select.closest('tr');
            if (!tr) return;

            tr.classList.remove('powertoy-pass', 'powertoy-fail', 'powertoy-pendent', 'powertoy-proces');

            if (!select.value) {
                this.logger.log('MateriaStyleManager → buit, no es pinta');
                return;
            }

            const value = select.value.replace('string:', '').toUpperCase();

            if (value === 'PDT' || value === 'PQ') {
                tr.classList.add('powertoy-pendent');
            } else if (value === 'EP') {
                tr.classList.add('powertoy-proces');
            } else if (value === 'NA') {
                tr.classList.add('powertoy-fail');
            } else if (/A(10|[5-9])/.test(value)) {
                tr.classList.add('powertoy-pass');
            } else {
                this.logger.warn(`MateriaStyleManager → valor desconegut: ${value}`);
            }
        });
    }
}
