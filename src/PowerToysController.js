import { PowerToysLogger } from './PowerToysLogger.js';
import { MateriaParser } from './MateriaParser.js';
import { MateriaUIBuilder } from './MateriaUIBuilder.js';
import { MateriaApplier } from './MateriaApplier.js';
import { ScrollHelper } from './ScrollHelper.js';
import { version } from '../build/version.js';
import { CSSApplier } from './CSSApplier.js';

/**
 * Classe principal que coordina les funcionalitats d'Esfer@ PowerToys.
 */
export class PowerToysController {
    /**
     * Constructor del controlador principal.
     * Inicialitza els components auxiliars i arrenca l'observador.
     */
    constructor() {
        /** @type {PowerToysLogger} */
        this.logger = new PowerToysLogger(true); // DEBUG activat

        /** @type {MateriaParser} */
        this.parser = new MateriaParser(this.logger);

        /** @type {MateriaApplier} */
        this.applier = new MateriaApplier(this.logger);

        /** @type {ScrollHelper} */
        this.scrollHelper = new ScrollHelper(this.logger);

        /** @type {MateriaUIBuilder} */
        this.uiBuilder = new MateriaUIBuilder(this.logger, (materia, inputVal) => this.onApply(materia, inputVal), version);

        /** @type {CSSApplier} */
        this.cssApplier = new CSSApplier(this.logger);



        this.lastStudent = '';
        this.reinicialitzaTimeout = null;

        const mainContainer = document.querySelector('#mainView') || document.body;
        this.observer = new MutationObserver(() => this.reinicialitza());
        this.observer.observe(mainContainer, { childList: true, subtree: true });

        document.body.addEventListener('change', (e) => {
            if (e.target.tagName === 'SELECT') {
                this.cssApplier.aplicaEstils();
            }
        });


        this.logger.log('PowerToysController → Observer activat');
    }

    /**
     * Callback quan es fa clic a "Aplica" a la interfície.
     * @param {{ codi: string, nom: string, RAs: string[] }} materia - La matèria seleccionada.
     * @param {string} inputVal - El valor introduït per l’usuari.
     * @returns {void}
     */
    onApply(materia, inputVal) {
        this.logger.log(`PowerToysController → onApply per ${materia.codi}: ${inputVal}`);

        const notes = this.applier.tradueixNotes(inputVal);
        if (notes && notes.length === materia.RAs.length) {
            this.applier.aplicaNotesARAs(materia.RAs, notes);
            this.scrollHelper.enfocaAssignatura(materia);
        } else {
            alert(`Error: les notes no són vàlides o no coincideixen amb el nombre de RAs (${materia.RAs.length}).`);
        }
    }

    /**
     * Reinicialitza el sistema quan es detecten canvis al DOM.
     * @returns {void}
     */
    reinicialitza() {
        this.logger.log('reinicialitza → inici');

        this.cssApplier.aplicaEstils();

        clearTimeout(this.reinicialitzaTimeout);
        this.reinicialitzaTimeout = setTimeout(() => {
            const form = document.querySelector('form[name="grupAlumne"]');
            const files = document.querySelectorAll('tr.alturallistat');
            if (!form || files.length === 0) {
                this.logger.log('reinicialitza → no hi ha form o files, esperant...');
                return;
            }

            const breadcrumb = document.querySelector('.breadcrumb li:last-child a');
            const studentName = breadcrumb ? breadcrumb.textContent.trim() : '';
            if (studentName === this.lastStudent) {
                this.logger.log('reinicialitza → mateix alumne, saltant');
                return;
            }
            this.lastStudent = studentName;

            this.logger.log(`reinicialitza → processant alumne: ${studentName}`);

            const materies = this.parser.parse(Array.from(files));
            const html = this.uiBuilder.createHTML(materies);
            this.uiBuilder.insertDiv(html, form);
        }, 100);
    }
}
