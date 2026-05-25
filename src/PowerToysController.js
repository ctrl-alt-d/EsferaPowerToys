import { PowerToysLogger } from './PowerToysLogger.js';
import { MateriaParser } from './materia/MateriaParser.js';
import { MateriaUIBuilder } from './materia/MateriaUIBuilder.js';
import { MateriaApplier } from './materia/MateriaApplier.js';
import { ScrollHelper } from './ScrollHelper.js';
import { version } from '../build/version.js';
import { CSSApplier } from './CSSApplier.js';
import { ExcelExportDataProvider } from './excel/ExcelExportDataProvider.js';
import { ExcelExportManager } from './excel/ExcelExportManager.js';
import { ExcelUIBuilder } from './excel/ExcelUIBuilder.js';
import { ExcelNotesWorkbookBuilder } from './excel/ExcelNotesWorkbookBuilder.js';
import { ContainerUIBuilder } from './ContainerUIBuilder.js';
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

        /** @type {ContainerUIBuilder} */
        this.containerBuilder = new ContainerUIBuilder(this.logger, version);

        /** @type {MateriaUIBuilder} */
        this.uiBuilder = new MateriaUIBuilder(
            this.logger,
            (materia, inputVal) => this.onApply(materia, inputVal),
            (materia) => this.posaPendentsRA(materia),
            this.containerBuilder
        );

        /** @type {CSSApplier} */
        this.cssApplier = new CSSApplier(this.logger);

        /** @type {ExcelExportManager} */
        this.excelExportManager = new ExcelExportManager(
            this.logger,
            new ExcelExportDataProvider(this.logger),
            new ExcelNotesWorkbookBuilder(),
        );

        /** @type {ExcelUIBuilder} */
        this.excelUIBuilder = new ExcelUIBuilder(this.logger, (evaluation) => this.excelExportManager.procésDescàrregaExcel(evaluation), this.containerBuilder);

        this.lastStudent = '';
        this._formTimeout = null;

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

        // 1️⃣ Gestiona la taula (ara s'executa a cada mutació fins que trobi la taula)
        this.excelUIBuilder.injectHeaderButtonIfNeeded();

        // 2️⃣ Gestiona el formulari (el teu codi original)
        clearTimeout(this._formTimeout);
        this._formTimeout = setTimeout(() => {
            const form = document.querySelector('form[name="grupAlumne"]');
            const files = document.querySelectorAll("tr.alturallistat");
            if (!form || files.length === 0) {
                this.logger.log("reinicialitza → no hi ha form o files, esperant...");
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
            const instruccions = 'Valors acceptats: >=4.5 → Assolit, <4.5 o NA → No assolit, EP → En procés, P o PDT → Pendent, . o X → Blanc';
            const html = this.uiBuilder.createHTML(materies, instruccions);
            this.containerBuilder.insertDiv(html, form);
        }, 100);
    }



    /**
     * Posa totes les RA buides a pendent.
     * @param {{ codi: string, nom: string, RAs: string[] }} materia - La matèria seleccionada.
     */
    posaPendentsRA(materia) {

        this.logger.log(`PDT al mòdul ${materia.codi}`);

        const rows = document.querySelectorAll("tr.alturallistat");

        rows.forEach(row => {

            const tdCodi = row.querySelector("td:first-child");
            if (!tdCodi) return;

            const codi = tdCodi.textContent.trim();

            // comprova si pertany al mòdul
            if (!codi.startsWith(materia.codi)) return;

            const select = row.querySelector("select");

            if (!select || select.disabled || select.value) return;

            const opcions = [...select.options].map(o => o.value);

            if (opcions.includes("string:PDT")) {
                select.value = "string:PDT";
            }
            else if (opcions.includes("string:PQ")) {
                select.value = "string:PQ";
            }

            select.dispatchEvent(new Event("change", { bubbles: true }));

        });

        this.cssApplier.aplicaEstils();
    }
}
