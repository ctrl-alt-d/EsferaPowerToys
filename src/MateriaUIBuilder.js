/**
 * Classe encarregada de generar i gestionar la interfície HTML
 * per mostrar les matèries i permetre introduir i aplicar notes.
 */
export class MateriaUIBuilder {
    /**
     * Constructor del builder.
     * @param {PowerToysLogger} logger - Instància del logger per registrar missatges.
     * @param {function} onApply - Callback a executar quan es fa clic al botó "Aplica".
     * Ha de rebre (materia, inputValue).
     * @param {string} version - Número de versió de l'script (ex: "1.2.0").
     */
    constructor(logger, onApply, version = '') {
        this.logger = logger;
        this.onApply = onApply;
        this.version = version;
    }

    /**
     * Crea l’estructura HTML per mostrar totes les matèries,
     * incloent un text de versió alineat a la dreta.
     * @param {Array<{ codi: string, nom: string, RAs: string[] }>} materies - Llista de matèries.
     * @returns {HTMLElement} Div HTML amb el contingut generat.
     */
    createHTML(materies) {
        this.logger.log('MateriaUIBuilder → inici');
        const container = document.createElement('div');
        container.id = 'powertoy-div';
        Object.assign(container.style, {
            marginBottom: '20px',
            padding: '10px',
            border: '1px solid #ccc',
            backgroundColor: '#f9f9f9'
        });

        const table = document.createElement('table');
        Object.assign(table.style, { width: '100%', borderCollapse: 'collapse' });

        materies.forEach(m => {
            this.logger.log(`MateriaUIBuilder → afegint fila per: ${m.codi}`);
            const row = document.createElement('tr');

            const tdNom = document.createElement('td');
            tdNom.textContent = `${m.codi} — ${m.nom}`;
            Object.assign(tdNom.style, {
                width: '30%', borderBottom: '1px solid #ddd',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            });

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

            row.appendChild(tdNom);
            row.appendChild(tdInput);
            row.appendChild(tdButton);
            table.appendChild(row);
        });

        container.appendChild(table);

        // Afegim la línia de versió a sota, alineada a la dreta
        if (this.version) {
            const versionDiv = document.createElement('div');
            versionDiv.textContent = `versió: ${this.version}`;
            Object.assign(versionDiv.style, {
                textAlign: 'right',
                fontSize: '0.8em',
                marginTop: '8px',
                color: '#666'
            });
            container.appendChild(versionDiv);
            this.logger.log(`MateriaUIBuilder → mostrant versió: ${this.version}`);
        }

        this.logger.log('MateriaUIBuilder → container creat');
        return container;
    }

    /**
     * Insereix el div generat abans d’un element concret del DOM.
     * Si ja existeix un div amb id 'powertoy-div', l’elimina.
     * @param {HTMLElement} div - L’element HTML a inserir.
     * @param {HTMLElement} abansDe - L’element davant del qual s’inserirà.
     * @returns {void}
     */
    insertDiv(div, abansDe) {
        this.logger.log('MateriaUIBuilder → intentant inserir div');
        const existent = document.getElementById('powertoy-div');
        if (existent) {
            this.logger.log('MateriaUIBuilder → eliminant existent');
            existent.remove();
        }
        abansDe.parentElement.insertBefore(div, abansDe);
        this.logger.log('MateriaUIBuilder → div inserit');
    }
}
