// ==UserScript==
// @name         RevisaNoAssolits
// @namespace    https://github.com/ctrl-alt-d/EsferaPowerToys
// @version      1.0.0
// @description  Oculta a Esfer@ totes les files d'avaluació que no estiguin marcades com "No assolit".
// @author       Calamot & Cascade
// @match        https://bfgh.aplicacions.ensenyament.gencat.cat/bfgh/avaluacio/*
// @grant        none
// ==/UserScript==

(() => {
    // Logger
    var RevisaNoAssolitsLogger = class {
        constructor(debug = true) {
            this.debug = debug;
            this.prefix = "[RevisaNoAssolits]";
        }
        log(...args) {
            if (this.debug) {
                console.log(this.prefix, ...args);
            }
        }
        error(...args) {
            console.error(this.prefix + " ERROR", ...args);
        }
        warn(...args) {
            if (this.debug) {
                console.warn(this.prefix + " WARNING", ...args);
            }
        }
    };

    var EvaluationFilterController = class {
        constructor() {
            this.logger = new RevisaNoAssolitsLogger(true);
            this.gradeSelector = 'tr.alturallistat select'; // Selector per als <select> en files d'avaluació
            this.init();
        }

        init() {
            this.logger.log("EvaluationFilterController inicialitzat.");
            this.filterEvaluationRows(); // Aplica el filtre inicialment

            const mainContainer = document.querySelector("#mainView") || document.body;
            this.observer = new MutationObserver((mutationsList, observer) => {
                this.logger.log("Detectat canvi en el DOM, re-aplicant filtre de files.");
                this.filterEvaluationRows();
            });

            // Observa canvis en la llista de fills i en el subarbre
            this.observer.observe(mainContainer, { childList: true, subtree: true });
            this.logger.log("MutationObserver activat.");
        }

        filterEvaluationRows() {
            this.logger.log("Intentant filtrar les files d'avaluació i capçaleres de matèria.");
            const allRowsInTable = document.querySelectorAll('tr.alturallistat'); // Get all rows we might care about
            const noAssolitTextLower = "no assolit";
            let processedSelectCount = 0;

            // Step 1: Determine visibility for all RA rows (those with select elements)
            // And hide them initially if they are not "No Assolit"
            allRowsInTable.forEach(row => {
                const selectElement = row.querySelector('select'); // Does this row have a select?
                if (selectElement) { // This is an RA row
                    processedSelectCount++;
                    if (selectElement.selectedOptions && selectElement.selectedOptions.length > 0) {
                        const selectedOptionTextLower = selectElement.selectedOptions[0].text.trim().toLowerCase();
                        if (selectedOptionTextLower === noAssolitTextLower) {
                            row.style.display = ''; // Show "No assolit"
                        } else {
                            row.style.display = 'none'; // Hide others
                        }
                    } else {
                        row.style.display = 'none'; // Hide if no option selected or other issue
                    }
                }
                // Header rows are not touched in this first pass regarding their own display style
            });

            // Step 2: Determine visibility for header rows based on their RAs' visibility
            let currentHeaderRow = null;
            let currentHeaderShouldBeVisible = false;

            allRowsInTable.forEach(row => {
                const isHeader = !row.querySelector('select'); // A row is a header if it doesn't have a select

                if (isHeader) {
                    // This is a new header. Finalize the previous one.
                    if (currentHeaderRow) {
                        currentHeaderRow.style.display = currentHeaderShouldBeVisible ? '' : 'none';
                        this.logger.log(`Capçalera '${currentHeaderRow.cells && currentHeaderRow.cells[1] ? currentHeaderRow.cells[1].textContent.trim().substring(0, 70) : 'N/A'}' ${currentHeaderShouldBeVisible ? 'MOSTRADA' : 'OCULTADA'}`);
                    }
                    // Set current header and reset its visibility flag
                    currentHeaderRow = row;
                    currentHeaderShouldBeVisible = false; // Assume hidden unless a 'No Assolit' is found under it
                } else { // This is an RA row
                    if (currentHeaderRow && row.style.display !== 'none') {
                        // If this RA row is visible (it's "No assolit"),
                        // then its current subject header should be visible.
                        currentHeaderShouldBeVisible = true;
                    }
                }
            });

            // After the loop, finalize the last header row
            if (currentHeaderRow) {
                currentHeaderRow.style.display = currentHeaderShouldBeVisible ? '' : 'none';
                this.logger.log(`Capçalera (última) '${currentHeaderRow.cells && currentHeaderRow.cells[1] ? currentHeaderRow.cells[1].textContent.trim().substring(0, 70) : 'N/A'}' ${currentHeaderShouldBeVisible ? 'MOSTRADA' : 'OCULTADA'}`);
            }

            if (processedSelectCount > 0) {
                this.logger.log(`${processedSelectCount} files amb <select> (RA) processades.`);
            } else if (allRowsInTable.length > 0) { 
                this.logger.log("No s'han trobat elements <select> en les files 'tr.alturallistat'. Potser només hi ha capçaleres o la pàgina té una estructura diferent.");
            } else {
                this.logger.log("No s'han trobat files 'tr.alturallistat'.");
            }
        }
    };

    // Iniciar el controlador quan el DOM estigui a punt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new EvaluationFilterController());
    } else {
        new EvaluationFilterController(); // Si el DOM ja està carregat
    }
})();
