/**
 * Classe encarregada de gestionar els logs del sistema.
 * Permet activar o desactivar fàcilment els missatges de debugging.
 */
export class PowerToysLogger {
    /**
     * Constructor del logger.
     * @param {boolean} debug - Si és true, es mostraran els logs per consola.
     */
    constructor(debug = false) {
        this.debug = debug;
    }

    /**
     * Mostra un missatge de log si el mode debug està activat.
     * @param  {...any} args - Arguments que es passaran a console.log.
     * @returns {void}
     */
    log(...args) {
        if (this.debug) {
            console.log('[PowerToys]', ...args);
        }
    }

    /**
     * Mostra un missatge d’error, sempre, independentment del mode debug.
     * @param  {...any} args - Arguments que es passaran a console.error.
     * @returns {void}
     */
    error(...args) {
        console.error('[PowerToys ERROR]', ...args);
    }

    /**
     * Mostra un missatge d’avís si el mode debug està activat.
     * @param  {...any} args - Arguments que es passaran a console.warn.
     * @returns {void}
     */
    warn(...args) {
        if (this.debug) {
            console.warn('[PowerToys WARNING]', ...args);
        }
    }

    /**
     * Activa o desactiva el mode debug.
     * @param {boolean} value - True per activar, false per desactivar.
     * @returns {void}
     */
    setDebug(value) {
        this.debug = value;
        console.log(`[PowerToys] Debug mode ${value ? 'activat' : 'desactivat'}`);
    }
}
