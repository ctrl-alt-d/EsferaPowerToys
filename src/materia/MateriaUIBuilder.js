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
     */
    constructor(logger, onApply, onPosaPendents, containerBuilder) {
        this.logger = logger;
        this.onApply = onApply;
        this.onPosaPendents = onPosaPendents;
        this.containerBuilder = containerBuilder;
    }

    createHTML(materies) {
        this.logger.log('MateriaUIBuilder → inici');

        // Contenidor responsive per la taula
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'powertoy-table-wrapper';
        tableWrapper.style.cssText = `
            max-width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
        `;

        const table = document.createElement('table');
        table.classList.add('powertoy-table');
        table.style.cssText = 'width: 98%; border-collapse: collapse; min-width: 320px;';

        const fieldset = document.querySelector('div.main div.ng-scope fieldset.ng-scope');
        const isDisabled = fieldset && fieldset.disabled;

        if (!isDisabled) {
            console.log("materies"+ materies);
            materies.forEach(m => {

                this.logger.log(`MateriaUIBuilder → afegint fila per: ${m.codi}`);
                const row = document.createElement('tr');

                const tdNom = document.createElement('td');
                tdNom.textContent = `${m.codi} — ${m.nom}`;
                Object.assign(tdNom.style, {
                    borderBottom: '1px solid #ddd',
                    whiteSpace: 'nowrap',
                    padding: '8px 4px',
                    textAlign: 'left'
                });

                row.appendChild(tdNom);

                const tdInput = document.createElement('td');
                tdInput.style.minWidth = '180px';
                const input = document.createElement('input');
                input.type = 'text';
                input.style.width = '100%';
                input.style.boxSizing = 'border-box';
                tdInput.appendChild(input);

                const tdButton = document.createElement('td');
                tdButton.style.minWidth = '140px';
                const btn = document.createElement('button');
                btn.textContent = 'Aplica';
                btn.className = 'btn btn-primary';
                btn.style.width = 'max-content';
                btn.addEventListener('click', () => {
                    const inputVal = input.value.trim();
                    this.logger.log(`MateriaUIBuilder → clic Aplica per ${m.codi}, valor: ${inputVal}`);
                    this.onApply(m, inputVal);
                });
                tdButton.appendChild(btn);

                row.appendChild(tdInput);
                row.appendChild(tdButton);

                table.appendChild(row);


                const btnPendent = document.createElement("button");
                btnPendent.textContent = "Posar pendent";
                btnPendent.className = "btn btn-warning btn-sm";
                btnPendent.style.marginLeft = "4px";
                btnPendent.style.width = "max-content;";

                btnPendent.addEventListener("click", () => {
                    this.onPosaPendents(m);
                });

                tdButton.appendChild(btnPendent);
            });
        }

        tableWrapper.appendChild(table);

        this.logger.log('MateriaUIBuilder → component creat');
        return this.containerBuilder.createContainer(tableWrapper, 'powertoy-div');
    }
}
