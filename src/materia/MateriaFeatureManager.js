/**
 * Gestiona l'activació i l'orquestració de la funcionalitat de notes per matèries.
 */
export class MateriaFeatureManager {
    /**
     * @param {import('../PowerToysLogger.js').PowerToysLogger} logger
     * @param {import('./MateriaParser.js').MateriaParser} parser
     * @param {import('./MateriaApplier.js').MateriaApplier} applier
     * @param {import('./MateriaUIBuilder.js').MateriaUIBuilder} uiBuilder
     * @param {import('./ScrollHelper.js').ScrollHelper} scrollHelper
     * @param {import('./MateriaStyleManager.js').MateriaStyleManager} materiaStyleManager
     * @param {import('../ContainerUIBuilder.js').ContainerUIBuilder} containerBuilder
     */
    constructor(logger, parser, applier, uiBuilder, scrollHelper, materiaStyleManager, containerBuilder) {
        this.logger = logger;
        this.parser = parser;
        this.applier = applier;
        this.uiBuilder = uiBuilder;
        this.scrollHelper = scrollHelper;
        this.materiaStyleManager = materiaStyleManager;
        this.containerBuilder = containerBuilder;
        this.lastStudent = null;
        this.lastUndo = [];
        this.formTimeout = null;
        this.instruccions = 'Valors acceptats: >=4.5 → Assolit, <4.5 o NA → No assolit, EP → En procés, P o PDT → Pendent, . o X → Blanc';
    }

    /**
     * Indica si el DOM actual conté el formulari i les files necessàries per activar la funcionalitat.
     * @returns {{ form: HTMLFormElement, files: HTMLElement[] }|null}
     */
    detectContext() {
        const form = document.querySelector('form[name="grupAlumne"]');
        const files = Array.from(document.querySelectorAll('tr.alturallistat'));

        if (!form || files.length === 0) {
            return null;
        }

        return { form, files };
    }

    /**
     * @returns {boolean} Cert si la funcionalitat es pot activar.
     */
    canActivate() {
        return this.detectContext() !== null;
    }

    /**
     * Reintenta l'activació amb debounce per evitar processar DOM parcialment renderitzat.
     * @returns {void}
     */
    tryActivate() {
        clearTimeout(this.formTimeout);
        this.formTimeout = setTimeout(() => this.activateIfReady(), 100);
    }

    /**
     * Activa la UI de matèries si el context és vàlid i l'alumne ha canviat.
     * @returns {void}
     */
    activateIfReady() {
        const context = this.detectContext();
        if (!context) {
            this.logger.log('MateriaFeatureManager → no hi ha form o files, esperant...');
            return;
        }

        const studentName = this.getCurrentStudentName();
        if (studentName === this.lastStudent) {
            this.logger.log('MateriaFeatureManager → mateix alumne, saltant');
            return;
        }

        this.lastStudent = studentName;
        this.logger.log(`MateriaFeatureManager → processant alumne: ${studentName}`);

        const materies = this.parser.parse(context.files);
        const html = this.uiBuilder.createHTML(materies, this.instruccions);
        this.containerBuilder.insertDiv(html, context.form);
    }

    /**
     * Extreu el nom de l'alumne des del breadcrumb d'Esfer@.
     * @returns {string}
     */
    getCurrentStudentName() {
        const breadcrumb = document.querySelector('.breadcrumb li:last-child a');
        return breadcrumb ? breadcrumb.textContent.trim() : '';
    }

    /**
     * Aplica les notes introduïdes a les RA de la matèria.
     * @param {{ codi: string, nom: string, RAs: string[] }} materia
     * @param {string} inputVal
     * @returns {void}
     */
    onApply(materia, inputVal) {
        this.logger.log(`MateriaFeatureManager → onApply per ${materia.codi}: ${inputVal}`);

        const notes = this.applier.tradueixNotes(inputVal);
        if (!notes || notes.length !== materia.RAs.length) {
            const message = `Error: les notes no són vàlides o no coincideixen amb el nombre de RAs (${materia.RAs.length}).`;
            alert(message);
            return { ok: false, message };
        }

        const plan = this.applier.creaPlaAplicacio(materia.RAs, notes);
        if (!plan.valid) {
            const message = `Error: hi ha ${plan.summary.errors} valor(s) que no es poden aplicar. Revisa la previsualització.`;
            alert(message);
            return { ok: false, message, plan };
        }

        const result = this.applier.aplicaNotesARAs(materia.RAs, notes);
        this.lastUndo = result.previousValues;
        this.materiaStyleManager.aplicaEstils();
        this.scrollHelper.enfocaAssignatura(materia);

        return {
            ok: true,
            message: `Aplicades ${result.applied} notes. Sense canvis: ${result.unchanged}.`,
            result,
            plan,
        };
    }

    /**
     * Genera la previsualització de les notes introduïdes.
     * @param {{ codi: string, nom: string, RAs: string[] }} materia
     * @param {string} inputVal
     * @returns {{ok: boolean, message: string, plan?: object}}
     */
    onPreview(materia, inputVal) {
        const notes = this.applier.tradueixNotes(inputVal);
        if (!notes) {
            return { ok: false, message: 'Hi ha valors no reconeguts.' };
        }

        if (notes.length !== materia.RAs.length) {
            return {
                ok: false,
                message: `Has introduït ${notes.length} notes i aquesta matèria té ${materia.RAs.length} RA.`,
            };
        }

        const plan = this.applier.creaPlaAplicacio(materia.RAs, notes);
        if (!plan.valid) {
            return {
                ok: false,
                message: `Hi ha ${plan.summary.errors} incidència(es) abans d'aplicar.`,
                plan,
            };
        }

        return {
            ok: true,
            message: `${plan.summary.changes} canvi(s), ${plan.summary.unchanged} sense canvis.`,
            plan,
        };
    }

    /**
     * Desfà l'última aplicació de notes feta amb PowerToys.
     * @returns {{ok: boolean, message: string, restored: number}}
     */
    onUndo() {
        if (!this.lastUndo.length) {
            return { ok: false, message: 'No hi ha cap aplicació per desfer.', restored: 0 };
        }

        const restored = this.applier.desfesCanvis(this.lastUndo);
        this.lastUndo = [];
        this.materiaStyleManager.aplicaEstils();

        return {
            ok: restored > 0,
            message: restored > 0 ? `S'han restaurat ${restored} nota(es).` : 'No s\'ha pogut restaurar cap nota.',
            restored,
        };
    }

    /**
     * Posa totes les RA buides d'una matèria a pendent.
     * @param {{ codi: string, nom: string, RAs: string[] }} materia
     * @returns {void}
     */
    posaPendentsRA(materia) {
        this.logger.log(`PDT al mòdul ${materia.codi}`);

        const rows = document.querySelectorAll('tr.alturallistat');
        const previousValues = [];

        rows.forEach(row => {
            const tdCodi = row.querySelector('td:first-child');
            if (!tdCodi) return;

            const codi = tdCodi.textContent.trim();
            if (!codi.startsWith(materia.codi)) return;

            const select = row.querySelector('select');
            if (!select || select.disabled || select.value) return;

            const opcions = [...select.options].map(o => o.value);
            const previousValue = select.value;

            if (opcions.includes('string:PDT')) {
                select.value = 'string:PDT';
            } else if (opcions.includes('string:PQ')) {
                select.value = 'string:PQ';
            }

            if (select.value !== previousValue) {
                previousValues.push({ raCodi: codi.replace(/\s/g, ''), value: previousValue });
            }

            select.dispatchEvent(new Event('change', { bubbles: true }));
        });

        this.lastUndo = previousValues;
        this.materiaStyleManager.aplicaEstils();
    }
}
