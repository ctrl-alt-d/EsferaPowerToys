/**
 * Classe encarregada de generar i gestionar la interfície HTML
 * per mostrar les matèries i permetre introduir i aplicar notes.
 * Si detecta que els inputs estan dins d’un fieldset desactivat, només mostra el div i la versió, sense inputs.
 */
export class MateriaUIBuilder {
    /**
     * @param {PowerToysLogger} logger - Instància del logger.
     * @param {function} onApply - Callback per aplicar notes (materia, inputVal).
     * @param {function} onPosaPendents - Callback per posar pendents les RA buides (materia).
     * @param {import('../ContainerUIBuilder.js').ContainerUIBuilder} containerBuilder - Constructor base del contenidor.
     * @param {function} onPreview - Callback per previsualitzar els canvis (materia, inputVal).
     * @param {function} onUndo - Callback per desfer l'última aplicació.
     */
    constructor(logger, onApply, onPosaPendents, containerBuilder, onPreview = null, onUndo = null) {
        this.logger = logger;
        this.onApply = onApply;
        this.onPosaPendents = onPosaPendents;
        this.containerBuilder = containerBuilder;
        this.onPreview = onPreview;
        this.onUndo = onUndo;
    }

    createHTML(materies, instruccions = null) {
        this.logger.log('MateriaUIBuilder → inici');

        const content = document.createElement('div');
        content.className = 'powertoy-materia-content';

        const liveRegion = document.createElement('div');
        liveRegion.className = 'powertoy-materia-live-region';
        liveRegion.setAttribute('role', 'status');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.textContent = 'PowerToys preparat per introduir notes.';
        content.appendChild(liveRegion);

        const toolbar = document.createElement('div');
        toolbar.className = 'powertoy-materia-toolbar';
        const undoBtn = document.createElement('button');
        undoBtn.type = 'button';
        undoBtn.textContent = 'Desfer';
        undoBtn.className = 'btn btn-default btn-sm powertoy-materia-undo-button';
        undoBtn.setAttribute('aria-label', 'Desfer l\'última aplicació de notes feta amb PowerToys');
        undoBtn.disabled = !this.onUndo;
        undoBtn.addEventListener('click', () => {
            if (!this.onUndo) return;
            const result = this.onUndo();
            liveRegion.textContent = result.message;
        });
        toolbar.appendChild(undoBtn);
        content.appendChild(toolbar);

        // Contenidor responsive per la taula
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'powertoy-table-wrapper powertoy-materia-table-wrapper';

        const table = document.createElement('table');
        table.classList.add('powertoy-table', 'powertoy-materia-table');

        const fieldset = document.querySelector('div.main div.ng-scope fieldset.ng-scope');
        const isDisabled = fieldset && fieldset.disabled;

        if (!isDisabled) {
            materies.forEach(m => {

                this.logger.log(`MateriaUIBuilder → afegint fila per: ${m.codi}`);
                const row = document.createElement('tr');

                const tdNom = document.createElement('td');
                tdNom.textContent = `${m.codi} — ${m.nom}`;
                tdNom.className = 'powertoy-materia-name-cell';

                row.appendChild(tdNom);

                const tdInput = document.createElement('td');
                tdInput.className = 'powertoy-materia-input-cell';
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'powertoy-materia-input';
                input.setAttribute('aria-label', `Notes per a ${m.codi} ${m.nom}`);
                tdInput.appendChild(input);

                const tdButton = document.createElement('td');
                tdButton.className = 'powertoy-materia-actions-cell';

                const preview = document.createElement('div');
                preview.className = 'powertoy-materia-preview';
                preview.setAttribute('aria-live', 'polite');

                const updatePreview = () => {
                    const inputVal = input.value.trim();
                    if (!this.onPreview || !inputVal) {
                        preview.textContent = '';
                        return null;
                    }

                    const previewResult = this.onPreview(m, inputVal);
                    this.renderPreview(preview, previewResult);
                    liveRegion.textContent = previewResult.message;
                    return previewResult;
                };

                input.addEventListener('input', () => updatePreview());

                const btnPreview = document.createElement('button');
                btnPreview.type = 'button';
                btnPreview.textContent = 'Previsualitza';
                btnPreview.className = 'btn btn-info btn-sm powertoy-materia-action-button powertoy-materia-preview-button';
                btnPreview.addEventListener('click', () => updatePreview());
                tdButton.appendChild(btnPreview);

                const btn = document.createElement('button');
                btn.textContent = 'Aplica';
                btn.type = 'button';
                btn.className = 'btn btn-primary powertoy-materia-action-button';
                btn.addEventListener('click', () => {
                    const inputVal = input.value.trim();
                    this.logger.log(`MateriaUIBuilder → clic Aplica per ${m.codi}, valor: ${inputVal}`);
                    const result = this.onApply(m, inputVal);
                    if (result) {
                        liveRegion.textContent = result.message;
                        this.renderPreview(preview, result);
                    }
                });
                tdButton.appendChild(btn);

                row.appendChild(tdInput);
                row.appendChild(tdButton);

                table.appendChild(row);


                const btnPendent = document.createElement("button");
                btnPendent.textContent = "Posar pendent";
                btnPendent.type = 'button';
                btnPendent.className = "btn btn-warning btn-sm powertoy-materia-action-button powertoy-materia-pendent-button";

                btnPendent.addEventListener("click", () => {
                    this.onPosaPendents(m);
                    liveRegion.textContent = `S'han posat com a pendents les RA buides de ${m.codi}.`;
                });

                tdButton.appendChild(btnPendent);
                const tdPreview = document.createElement('td');
                tdPreview.className = 'powertoy-materia-preview-cell';
                tdPreview.appendChild(preview);
                row.appendChild(tdPreview);
            });
        }

        tableWrapper.appendChild(table);
        content.appendChild(tableWrapper);

        this.logger.log('MateriaUIBuilder → component creat');
        return this.containerBuilder.createContainer(content, 'powertoy-div', instruccions);
    }

    /**
     * Mostra el resum de validació i canvis d'una matèria.
     * @param {HTMLElement} preview - Contenidor on renderitzar la previsualització.
     * @param {{ok: boolean, message: string, plan?: object}} result - Resultat de previsualització o aplicació.
     * @returns {void}
     */
    renderPreview(preview, result) {
        preview.textContent = '';
        if (!result) return;

        const summary = document.createElement('div');
        summary.className = result.ok ? 'powertoy-materia-preview-summary powertoy-materia-preview-summary--ok' : 'powertoy-materia-preview-summary powertoy-materia-preview-summary--error';
        summary.textContent = result.message;
        preview.appendChild(summary);

        if (!result.plan || !result.plan.items || result.plan.items.length === 0) return;

        const list = document.createElement('ul');
        list.className = 'powertoy-materia-preview-list';

        result.plan.items.forEach(item => {
            const listItem = document.createElement('li');
            listItem.className = `powertoy-materia-preview-item powertoy-materia-preview-item--${item.status}`;
            const currentValue = item.currentValue ? item.currentValue.replace('string:', '') : 'blanc';
            const newValue = item.newValue ? item.newValue.replace('string:', '') : 'blanc';
            listItem.textContent = `${item.raCodi}: ${currentValue} → ${newValue} (${item.message})`;
            list.appendChild(listItem);
        });

        preview.appendChild(list);
    }
}
