import { PowerToysLogger } from './PowerToysLogger.js';
import { MateriaParser } from './materia/MateriaParser.js';
import { MateriaUIBuilder } from './materia/MateriaUIBuilder.js';
import { MateriaApplier } from './materia/MateriaApplier.js';
import { MateriaFeatureManager } from './materia/MateriaFeatureManager.js';
import { ScrollHelper } from './materia/ScrollHelper.js';
import { version } from '../build/version.js';
import { MateriaStyleManager } from './materia/MateriaStyleManager.js';
import { NotesDataProvider } from './dataProviders/NotesDataProvider.js';
import { ExcelExportManager } from './excel/ExcelExportManager.js';
import { ExcelUIBuilder } from './excel/ExcelUIBuilder.js';
import { ExcelFeatureManager } from './excel/ExcelFeatureManager.js';
import { ExcelStyleManager } from './excel/ExcelStyleManager.js';
import { ExcelNotesWorkbookBuilder } from './excel/ExcelNotesWorkbookBuilder.js';
import { ContainerUIBuilder } from './ContainerUIBuilder.js';
import { ContainerStyleManager } from './ContainerStyleManager.js';
import { VisualitzadorManager } from './visualitzador/VisualitzadorManager.js';
import { VisualitzadorModelBuilder } from './visualitzador/VisualitzadorModelBuilder.js';
import { VisualitzadorRenderer } from './visualitzador/VisualitzadorRenderer.js';
import { VisualitzadorPdfExporter } from './visualitzador/VisualitzadorPdfExporter.js';
import { VisualitzadorModal } from './visualitzador/VisualitzadorModal.js';
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

        /** @type {ContainerStyleManager} */
        this.containerStyleManager = new ContainerStyleManager(this.logger);

        /** @type {MateriaUIBuilder} */
        const materiaUIBuilder = new MateriaUIBuilder(
            this.logger,
            (materia, inputVal) => this.materiaFeatureManager.onApply(materia, inputVal),
            (materia) => this.materiaFeatureManager.posaPendentsRA(materia),
            this.containerBuilder
        );

        /** @type {MateriaStyleManager} */
        this.materiaStyleManager = new MateriaStyleManager(this.logger);

        /** @type {ExcelStyleManager} */
        this.excelStyleManager = new ExcelStyleManager(this.logger);

        const notesDataProvider = new NotesDataProvider(this.logger);

        /** @type {ExcelExportManager} */
        this.excelExportManager = new ExcelExportManager(
            this.logger,
            notesDataProvider,
            new ExcelNotesWorkbookBuilder(),
        );

        const visualitzadorModelBuilder = new VisualitzadorModelBuilder();

        /** @type {VisualitzadorManager} */
        this.visualitzadorManager = new VisualitzadorManager(
            this.logger,
            notesDataProvider,
            visualitzadorModelBuilder,
            new VisualitzadorModal(
                this.logger,
                new VisualitzadorRenderer(visualitzadorModelBuilder),
                new VisualitzadorPdfExporter(),
            ),
        );

        /** @type {ExcelUIBuilder} */
        const excelUIBuilder = new ExcelUIBuilder(
            this.logger,
            (evaluation) => this.excelExportManager.procésDescàrregaExcel(evaluation),
            this.containerBuilder,
            (evaluation) => this.visualitzadorManager.obreVisualitzador(evaluation),
            notesDataProvider
        );

        /** @type {MateriaFeatureManager} */
        this.materiaFeatureManager = new MateriaFeatureManager(
            this.logger,
            this.parser,
            this.applier,
            materiaUIBuilder,
            this.scrollHelper,
            this.materiaStyleManager,
            this.containerBuilder,
        );

        /** @type {ExcelFeatureManager} */
        this.excelFeatureManager = new ExcelFeatureManager(
            this.logger,
            excelUIBuilder,
            this.containerBuilder,
        );

        const mainContainer = document.querySelector('#mainView') || document.body;
        this.observer = new MutationObserver(() => this.reinicialitza());
        this.observer.observe(mainContainer, { childList: true, subtree: true });

        document.body.addEventListener('change', (e) => {
            if (e.target.tagName === 'SELECT') {
                this.materiaStyleManager.aplicaEstils();
            }
        });


        this.logger.log('PowerToysController → Observer activat');
    }

    /**
     * Reinicialitza el sistema quan es detecten canvis al DOM.
     * @returns {void}
     */
    reinicialitza() {
        this.logger.log('reinicialitza → inici');

        this.materiaStyleManager.aplicaEstils();
        this.excelFeatureManager.tryActivate();
        this.materiaFeatureManager.tryActivate();
    }
}
