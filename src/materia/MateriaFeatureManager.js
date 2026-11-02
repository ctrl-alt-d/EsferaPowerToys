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

        if (!inputVal?.trim()) {
            alert(`Falten ${materia.RAs.length} ${materia.RAs.length === 1 ? 'nota' : 'notes'} per als RAs.`);
            return;
        }
        const notes = this.applier.tradueixNotes(inputVal);
        if (!notes) {
            alert('Error: hi ha notes no vàlides.');
            return;
        }

        const notesOriginals = inputVal.trim().replace(/\t/g, ' ').replace(/\s+/g, ' ').split(' ');
        if (notes.length < materia.RAs.length) {
            const falten = materia.RAs.length - notes.length;
            alert(`Falten ${falten} ${falten === 1 ? 'nota' : 'notes'}: calen ${materia.RAs.length} per als RAs i, opcionalment, una més per al mòdul.`);
            return;
        }
        if (notes.length > materia.RAs.length + 1) {
            alert(`Hi ha massa notes: calen ${materia.RAs.length} per als RAs i, com a màxim, una més per al mòdul.`);
            return;
        }

        const notesRAs = notes.slice(0, materia.RAs.length);
        const téNotaModul = notes.length === materia.RAs.length + 1;
        const notaModulOriginal = téNotaModul ? notesOriginals.at(-1).replace(',', '.') : '';
        const notaModulNumero = Number(notaModulOriginal);
        const ésNPModul = notaModulOriginal.toUpperCase() === 'NP';
        if (téNotaModul && !ésNPModul && !/^\d+(?:\.\d+)?$/.test(notaModulOriginal)) {
            alert('La nota del mòdul ha de ser numèrica o NP.');
            return;
        }
        if (téNotaModul && !ésNPModul && (notaModulNumero < 1 || notaModulNumero > 10)) {
            alert('La nota numèrica del mòdul ha d’estar entre 1 i 10.');
            return;
        }
        if (téNotaModul && !ésNPModul && notaModulNumero >= 5
            && !notesRAs.every(nota => /^A(5|6|7|8|9|10)$/.test(nota))) {
            alert('No es pot posar una nota de mòdul igual o superior a 5 si tots els RAs no estan aprovats.');
            return;
        }

        this.applier.aplicaNotesARAs(materia.RAs, notesRAs);
        if (téNotaModul) {
            if (ésNPModul) {
                this.applier.aplicaNoPresentatModul(materia.codi);
            } else {
                const provisional = this.applier.estadaPendent(materia.estada);
                this.applier.aplicaNotaModul(materia.codi, notaModulOriginal, provisional);
            }
        }
        this.scrollHelper.enfocaAssignatura(materia);
    }

    /**
     * Posa totes les RA buides d'una matèria a pendent.
     * @param {{ codi: string, nom: string, RAs: string[] }} materia
     * @returns {void}
     */
    posaPendentsRA(materia) {
        this.logger.log(`PDT al mòdul ${materia.codi}`);

        const rows = document.querySelectorAll('tr.alturallistat');

        rows.forEach(row => {
            const tdCodi = row.querySelector('td:first-child');
            if (!tdCodi) return;

            const codi = tdCodi.textContent.trim();
            if (!codi.startsWith(materia.codi)) return;

            const select = row.querySelector('select');
            if (!select || select.disabled || select.value) return;

            const opcions = [...select.options].map(o => o.value);

            if (opcions.includes('string:PDT')) {
                select.value = 'string:PDT';
            } else if (opcions.includes('string:PQ')) {
                select.value = 'string:PQ';
            }

            select.dispatchEvent(new Event('change', { bubbles: true }));
        });

        this.materiaStyleManager.aplicaEstils();
    }
}
