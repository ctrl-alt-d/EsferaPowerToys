// ==UserScript==
// @name         RevisaEsfera
// @namespace    https://github.com/ctrl-alt-d/EsferaPowerToys
// @version      1.0.5
// @description  Destaca en vermell i negreta els resultats d'aprenentatge (RA) marcats com "No assolit" a Esfer@.
// @author       Calamot & Cascade
// @match        https://bfgh.aplicacions.ensenyament.gencat.cat/bfgh/avaluacio/*
// @grant        none
// ==/UserScript==

(() => {
    // Logger (similar to PowerToysLogger)
    var RevisaEsferaLogger = class {
        constructor(debug = true) { // Enable debug by default for this script
            this.debug = debug;
            this.prefix = "[RevisaEsfera]";
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

    var GradeStylerController = class {
        constructor() {
            this.logger = new RevisaEsferaLogger(true);
            //Selector para los elementos que contienen las notas. ¡¡¡ESTO PUEDE NECESITAR AJUSTE!!!
            //Busca celdas de tabla (td) o spans que contengan principalmente números (potencialmente con decimales).
            this.gradeSelector = 'tr.alturallistat select'; // More specific selector targeting selects within relevant table rows
            this.processedElements = new WeakSet(); // Para evitar reprocesar innecesariamente

            this.init();
        }

        init() {
            this.logger.log("GradeStylerController inicialitzat per 'No assolit'.");
            this.applyStylesToRAresults(); // Call the new/renamed method

            const mainContainer = document.querySelector("#mainView") || document.body;
            this.observer = new MutationObserver((mutationsList, observer) => {
                this.logger.log("Detectat canvi en el DOM, re-aplicant estils per 'No assolit'.");
                this.applyStylesToRAresults(); // Call the new/renamed method
            });

            this.observer.observe(mainContainer, { childList: true, subtree: true, characterData: true });
            this.logger.log("MutationObserver activat per observar canvis en resultats 'No assolit'.");
        }

        applyStylesToRAresults() { // Renamed method
            this.logger.log("Intentant aplicar estils als resultats 'No assolit'.");
            const potentialResultElements = document.querySelectorAll(this.gradeSelector);
            let styledCount = 0;
            const noAssolitTextLower = "no assolit";
            const pendentTextLower = "pendent";
            const assolitPrefixLower = "assolit"; // For 'Assolit-A', 'Assolit-B', etc.
            const enProcesTextLower = "en procés";

            const redBg = 'red';
            const whiteColor = 'white';
            const yellowBg = 'yellow';
            const lightGreenBg = 'lightgreen';
            const defaultColor = ''; // Browser default
            const defaultFontWeight = ''; // Browser default
            const defaultBg = ''; // Browser default

            potentialResultElements.forEach(selectElement => {
                if (selectElement.tagName === 'SELECT' && selectElement.selectedOptions && selectElement.selectedOptions.length > 0) {
                    const selectedOptionText = selectElement.selectedOptions[0].text.trim();
                    const selectedOptionTextLower = selectedOptionText.toLowerCase();

                    // Flags to check current styles to avoid redundant operations
                    let isStyledForNoAssolit = selectElement.style.getPropertyValue('background-color') === redBg && selectElement.style.getPropertyValue('color') === whiteColor && selectElement.style.getPropertyValue('font-weight') === 'bold';
                    let isStyledForPendent = selectElement.style.getPropertyValue('background-color') === yellowBg;
                    let isStyledForAssolit = selectElement.style.getPropertyValue('background-color') === lightGreenBg;
                    let isStyledForEnProces = selectElement.style.getPropertyValue('color') === 'red' &&
                                              selectElement.style.getPropertyValue('font-weight') === 'bold' &&
                                              selectElement.style.getPropertyValue('background-color') !== redBg &&
                                              selectElement.style.getPropertyValue('background-color') !== yellowBg &&
                                              selectElement.style.getPropertyValue('background-color') !== lightGreenBg;

                    // Determine new styles based on text
                    let applyNoAssolit = false;
                    let applyPendent = false;
                    let applyAssolit = false;
                    let applyEnProces = false;

                    if (selectedOptionTextLower === noAssolitTextLower) {
                        applyNoAssolit = true;
                    } else if (selectedOptionTextLower === pendentTextLower) {
                        applyPendent = true;
                    } else if (selectedOptionTextLower.startsWith(assolitPrefixLower)) {
                        applyAssolit = true;
                    } else if (selectedOptionTextLower === enProcesTextLower) {
                        applyEnProces = true;
                    }

                    // Apply/Remove 'No Assolit' styles (red background, white text, bold)
                    if (applyNoAssolit) {
                        if (!isStyledForNoAssolit) {
                            selectElement.style.setProperty('background-color', redBg, 'important');
                            selectElement.style.setProperty('color', whiteColor, 'important');
                            selectElement.style.setProperty('font-weight', 'bold', 'important');
                            this.logger.log(`Estil 'No assolit' (vermell/blanc/negreta) aplicat: "${selectedOptionText}"`);
                            styledCount++;
                        }
                    } else if (isStyledForNoAssolit) {
                        selectElement.style.setProperty('background-color', defaultBg, 'important');
                        selectElement.style.setProperty('color', defaultColor, 'important');
                        selectElement.style.setProperty('font-weight', defaultFontWeight, 'important');
                        this.logger.log(`Estil 'No assolit' (vermell/blanc/negreta) eliminat (text canviat de "${selectedOptionText}")`);
                    }

                    // Apply/Remove 'Pendent' style (yellow background)
                    if (applyPendent) {
                        if (!isStyledForPendent) {
                            selectElement.style.setProperty('background-color', yellowBg, 'important');
                            this.logger.log(`Estil 'Pendent' aplicat: "${selectedOptionText}"`);
                            if(!applyNoAssolit) styledCount++; // Count only if not already counted for 'no assolit'
                        }
                    } else if (isStyledForPendent) {
                        selectElement.style.setProperty('background-color', defaultBg, 'important');
                        this.logger.log(`Estil 'Pendent' eliminat (text canviat de "${selectedOptionText}")`);
                    }

                    // Apply/Remove 'Assolit' style (light green background)
                    if (applyAssolit) {
                        if (!isStyledForAssolit) {
                            selectElement.style.setProperty('background-color', lightGreenBg, 'important');
                            this.logger.log(`Estil 'Assolit' aplicat: "${selectedOptionText}"`);
                            if(!applyNoAssolit && !applyPendent) styledCount++; // Count only if not already counted
                        }
                    } else if (isStyledForAssolit) {
                        selectElement.style.setProperty('background-color', defaultBg, 'important');
                        this.logger.log(`Estil 'Assolit' eliminat (text canviat de "${selectedOptionText}")`);
                    }

                    // Apply/Remove 'En Procés' style (red text, bold, default/white background)
                    if (applyEnProces) {
                        if (!isStyledForEnProces) {
                            selectElement.style.setProperty('color', 'red', 'important');
                            selectElement.style.setProperty('font-weight', 'bold', 'important');
                            selectElement.style.setProperty('background-color', defaultBg, 'important'); // Ensure no other custom bg
                            this.logger.log(`Estil 'En Procés' aplicat: "${selectedOptionText}"`);
                            if(!applyNoAssolit && !applyPendent && !applyAssolit) styledCount++;
                        }
                    } else if (isStyledForEnProces) {
                        selectElement.style.setProperty('color', defaultColor, 'important');
                        selectElement.style.setProperty('font-weight', defaultFontWeight, 'important');
                        // No need to reset defaultBg explicitly unless it was changed by something else
                        this.logger.log(`Estil 'En Procés' eliminat (text canviat de "${selectedOptionText}")`);
                    }

                    // Ensure other styles are cleared if a specific style is applied
                    if (applyNoAssolit) {
                        if (isStyledForPendent) selectElement.style.setProperty('background-color', defaultBg, 'important');
                        if (isStyledForAssolit) selectElement.style.setProperty('background-color', defaultBg, 'important');
                        if (isStyledForEnProces) {
                            // font-weight 'bold' is shared. background-color will be overridden by redBg.
                            // color will be overridden by whiteColor.
                        }
                        // Ensure No Assolit styles are dominant
                        selectElement.style.setProperty('background-color', redBg, 'important');
                        selectElement.style.setProperty('color', whiteColor, 'important');
                        selectElement.style.setProperty('font-weight', 'bold', 'important');

                    } else if (applyEnProces) {
                        if (isStyledForNoAssolit) {
                            selectElement.style.setProperty('background-color', defaultBg, 'important');
                            // font-weight 'bold' is shared. color will be set to 'red'.
                        }
                        if (isStyledForPendent) selectElement.style.setProperty('background-color', defaultBg, 'important');
                        if (isStyledForAssolit) selectElement.style.setProperty('background-color', defaultBg, 'important');
                        // Ensure En Proces styles are dominant
                        selectElement.style.setProperty('color', 'red', 'important');
                        selectElement.style.setProperty('font-weight', 'bold', 'important');
                        selectElement.style.setProperty('background-color', defaultBg, 'important');

                    } else if (applyPendent || applyAssolit) {
                        if (isStyledForNoAssolit) {
                            selectElement.style.setProperty('background-color', defaultBg, 'important');
                            selectElement.style.setProperty('color', defaultColor, 'important');
                            selectElement.style.setProperty('font-weight', defaultFontWeight, 'important');
                        }
                        if (isStyledForEnProces) {
                            selectElement.style.setProperty('color', defaultColor, 'important');
                            selectElement.style.setProperty('font-weight', defaultFontWeight, 'important');
                            // background-color is already defaultBg, will be overridden by Pendent/Assolit
                        }
                        // Ensure text color is default (black) if changed by No Assolit or En Proces
                        if (selectElement.style.getPropertyValue('color') === whiteColor || selectElement.style.getPropertyValue('color') === 'red') {
                            selectElement.style.setProperty('color', defaultColor, 'important');
                        }
                        // Pendent/Assolit specific background is applied in their respective blocks earlier
                    }

                } else if (selectElement.tagName === 'SELECT') {
                    // Element is a SELECT but no valid option or doesn't match criteria; clear all our styles
                    if (isStyledForNoAssolit || isStyledForEnProces || isStyledForPendent || isStyledForAssolit) { // Assolit bg

                        selectElement.style.setProperty('color', defaultColor, 'important');
                        selectElement.style.setProperty('font-weight', defaultFontWeight, 'important');
                        selectElement.style.setProperty('background-color', defaultBg, 'important');
                        this.logger.log(`Tots els estils personalitzats eliminats de <select> (sense opció vàlida o text no coincident)`);
                    }
                }
            });

            if (styledCount > 0) {
                this.logger.log(`${styledCount} elements 'No assolit' han sigut estilitzats.`);
            }
            // this.logger.log("Procés d'aplicació d'estils a 'No assolit' finalitzat."); // Optional: keep if you want a log even if nothing is styled
        }
    };

    // Iniciar el controlador quan el DOM estigui llest
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new GradeStylerController());
    } else {
        new GradeStylerController();
    }

})();