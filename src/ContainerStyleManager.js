/**
 * Gestiona els estils compartits dels contenidors i efectes comuns de PowerToys.
 */
export class ContainerStyleManager {
    /**
     * @param {import('./PowerToysLogger.js').PowerToysLogger} logger
     */
    constructor(logger) {
        this.logger = logger;
        this.injectStyles();
    }

    /**
     * Injecta els estils compartits una sola vegada.
     * @returns {void}
     */
    injectStyles() {
        if (document.getElementById('powertoy-container-styles')) return;

        const style = document.createElement('style');
        style.id = 'powertoy-container-styles';
        style.textContent = `
            .powertoy-container {
                margin-bottom: 20px;
                padding: 30px 10px 10px 10px;
                border: 1px solid #ccc;
                background-color: #f9f9f9;
                position: relative;
                overflow: auto;
                max-height: 20em;
            }

            .powertoy-toggle-button {
                position: absolute;
                top: 5px;
                right: 5px;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                line-height: 1;
            }

            .powertoy-content-wrapper--collapsed {
                display: none;
            }

            .powertoy-instructions {
                font-size: 0.85em;
                margin-top: 8px;
                color: #555;
            }

            .powertoy-version {
                text-align: right;
                font-size: 0.8em;
                margin-top: 8px;
                color: #666;
            }

            .powertoy-version-link {
                text-decoration: none;
            }

            .powertoy-scroll-highlight {
                transition: background-color 0.5s ease;
            }

            .powertoy-scroll-highlight.powertoy-scroll-highlight--active {
                background-color: #ffffcc !important;
            }
        `;

        document.head.appendChild(style);
        this.logger.log('ContainerStyleManager → estils injectats');
    }
}
