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
     * @param {string} version - Versió de l'script.
     */
    constructor(logger, onApply, onPosaPendents, version = '') {
        this.logger = logger;
        this.onApply = onApply;
        this.onPosaPendents = onPosaPendents;
        this.version = version;
    }

    createHTML(materies) {
        this.logger.log('MateriaUIBuilder → inici');
        const container = document.createElement('div');
        container.id = 'powertoy-div';
        container.classList.add('powertoy-container');
        Object.assign(container.style, {
            marginBottom: '20px',
            padding: '30px 10px 10px 10px',
            border: '1px solid #ccc',
            backgroundColor: '#f9f9f9',
            position: 'relative',
            overflow: 'auto',
            'max-height': '20em'
        });

        // Botó per comprimir/expandir
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'powertoy-toggle-btn';
        toggleBtn.textContent = '−';
        toggleBtn.type = 'button';
        toggleBtn.className = 'btn btn-secondary btn-sm';
        Object.assign(toggleBtn.style, {
            position: 'absolute',
            top: '5px',
            right: '5px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: '1'
        });
        toggleBtn.addEventListener('click', () => this.toggleContainer());
        container.appendChild(toggleBtn);

        const table = document.createElement('table');
        table.classList.add('powertoy-table');
        Object.assign(table.style, { width: '100%', borderCollapse: 'collapse' });

        const fieldset = document.querySelector('div.main div.ng-scope fieldset.ng-scope');
        const isDisabled = fieldset && fieldset.disabled;

        if (!isDisabled) {
            materies.forEach(m => {

                this.logger.log(`MateriaUIBuilder → afegint fila per: ${m.codi}`);
                const row = document.createElement('tr');

                const tdNom = document.createElement('td');
                tdNom.textContent = `${m.codi} — ${m.nom}`;
                Object.assign(tdNom.style, {
                    width: '30%', borderBottom: '1px solid #ddd',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                });

                row.appendChild(tdNom);

                const tdInput = document.createElement('td');
                tdInput.style.width = '60%';
                const input = document.createElement('input');
                input.type = 'text';
                input.style.width = '100%';
                tdInput.appendChild(input);

                const tdButton = document.createElement('td');
                const btn = document.createElement('button');
                btn.textContent = 'Aplica';
                btn.className = 'btn btn-primary';
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
                btnPendent.textContent = "Posar pendent RA buides";
                btnPendent.className = "btn btn-warning";
                btnPendent.style.marginLeft = "5px";

                btnPendent.addEventListener("click", () => {
                    this.onPosaPendents(m);
                });

                tdButton.appendChild(btnPendent);
            });
        }

        container.appendChild(table);

        const versionDiv = document.createElement('div');
        versionDiv.innerHTML = `<a href="https://github.com/ctrl-alt-d/EsferaPowerToys" target="_blank" style="text-decoration:none;">Esfer@ Power Toys</a> v. ${this.version}`;
        versionDiv.className = 'powertoy-version';
        Object.assign(versionDiv.style, {
            textAlign: 'right',
            fontSize: '0.8em',
            marginTop: '8px',
            color: '#666'
        });
        container.appendChild(versionDiv);

        this.logger.log('MateriaUIBuilder → container creat');
        return container;
    }

    insertDiv(div, abansDe) {
        this.logger.log('MateriaUIBuilder → intentant inserir div');
        const existent = document.getElementById('powertoy-div');
        if (existent) {
            this.logger.log('MateriaUIBuilder → eliminant existent');
            existent.remove();
        }
        abansDe.parentElement.insertBefore(div, abansDe);
        this.logger.log('MateriaUIBuilder → div inserit');

        window.dispatchEvent(new Event('resize'));

    }

    /**
     * Torna comprimeix/expandeix l'interfície de PowerToys.
     * Accedeix al container actual per l'id.
     */
    toggleContainer() {
        const container = document.getElementById('powertoy-div');
        if (!container) return;

        const table = container.querySelector('.powertoy-table');
        const versionDiv = container.querySelector('.powertoy-version');
        const toggleBtn = container.querySelector('#powertoy-toggle-btn');

        if (table && toggleBtn) {

            const isHidden = table.style.display === 'none';
            if (isHidden) {
                table.style.display = '';
                versionDiv.style.marginTop = '8px';
                toggleBtn.textContent = '−';
            } else {
                table.style.display = 'none';
                versionDiv.style.marginTop = '20px';
                toggleBtn.textContent = '+';
            }
        }
    }
}
