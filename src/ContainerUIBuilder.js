/**
 * Classe centralitzada per a la creació del contenidor base de PowerToys.
 * Aquesta classe permet injectar contingut personalitzat dins del contenidor 
 * estàndard (amb estil comú, botó de minimitzar i versió).
 */
export class ContainerUIBuilder {
    /**
     * @param {import('./PowerToysLogger.js').PowerToysLogger} logger
     * @param {string} version - Versió de l'script per mostrar al peu.
     */
    constructor(logger, version = '') {
        this.logger = logger;
        this.version = version;
    }

    /**
     * Crea un contenidor HTML estàndard i hi insereix l'element de contingut personalitzat.
     * @param {HTMLElement} contentElement - Element HTML a mostrar dins del contenidor.
     * @param {string} id - ID únic del contenidor (per defecte: 'powertoy-div').
     * @returns {HTMLElement} - El contenidor creat.
     */
    createContainer(contentElement, id = 'powertoy-div') {
        this.logger.log(`ContainerUIBuilder → creant contenidor: ${id}`);
        const container = document.createElement('div');
        container.id = id;
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
        toggleBtn.id = `${id}-toggle-btn`;
        toggleBtn.textContent = '−';
        toggleBtn.type = 'button';
        toggleBtn.className = 'btn btn-secondary btn-sm';
        toggleBtn.setAttribute('aria-label', 'Minimitza PowerToys');
        toggleBtn.setAttribute('aria-expanded', 'true');
        toggleBtn.title = 'Minimitza PowerToys';
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
        
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'powertoy-content-wrapper';
        contentWrapper.appendChild(contentElement);

        const actualitzaEstatToggle = (expanded) => {
            toggleBtn.textContent = expanded ? '−' : '+';
            toggleBtn.setAttribute('aria-expanded', String(expanded));
            toggleBtn.setAttribute('aria-label', expanded ? 'Minimitza PowerToys' : 'Expandeix PowerToys');
            toggleBtn.title = expanded ? 'Minimitza PowerToys' : 'Expandeix PowerToys';
        };

        toggleBtn.addEventListener('click', () => {
            const isHidden = contentWrapper.style.display === 'none';
            if (isHidden) {
                contentWrapper.style.display = '';
                actualitzaEstatToggle(true);
            } else {
                contentWrapper.style.display = 'none';
                actualitzaEstatToggle(false);
            }
        });
        
        container.appendChild(toggleBtn);
        container.appendChild(contentWrapper);

        const instructionsDiv = document.createElement('div');
        instructionsDiv.className = 'powertoy-instructions';
        instructionsDiv.textContent = 'Valors acceptats: >=4.5 → Assolit, <4.5 ó NA → No assolit, EP → En procés, P ó PDT → Pendent, . ó X → Blanc';
        Object.assign(instructionsDiv.style, {
            fontSize: '0.85em',
            marginTop: '8px',
            color: '#555'
        });
        container.appendChild(instructionsDiv);

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

        return container;
    }

    /**
     * Insereix un contenidor davant d'un altre element de la interfície.
     * Si ja existeix un element amb el mateix ID, l'elimina.
     * @param {HTMLElement} div - El contenidor creat.
     * @param {HTMLElement} abansDe - Element previ on s'ha d'inserir el contenidor.
     */
    insertDiv(div, abansDe) {
        this.logger.log(`ContainerUIBuilder → intentant inserir div amb ID ${div.id}`);
        const existent = document.getElementById(div.id);
        if (existent) {
            this.logger.log(`ContainerUIBuilder → eliminant existent ${div.id}`);
            existent.remove();
        }
        abansDe.parentElement.insertBefore(div, abansDe);
        this.logger.log('ContainerUIBuilder → div inserit');
        window.dispatchEvent(new Event('resize'));
    }
}
