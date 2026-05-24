/**
 * Classe per a la gestió de les descàrregues CSV de les notes d'una avaluació d'Esfer@.
 * S'encarrega d'obtenir la informació a través d'Angular per descarregar un fitxer utilitzant l'enllaç Blob local.
 */
export class CSVManager {
    /**
     * @param {import('./PowerToysLogger.js').PowerToysLogger} logger
     */
    constructor(logger) {
        this.logger = logger;
    }

    /**
     * Inicia i coordina el procés de descàrrega
     * @returns {Promise<void>}
     */
    async procésDescàrregaCSV(evaluation = 1) {
        this.logger.log("CSVManager → procésDescàrregaCSV inici");

        const idGrup = this.extractIdGrup();
        if (idGrup === null) {
            this.logger.error("CSVManager → No s'ha pogut extreure idGrup");
            return;
        }

        var element = document.documentElement;
        var injector = window.angular ? window.angular.element(element).injector() : null;

        if (!injector) {
            this.logger.error(
                "CSVManager → No s'ha pogut obtenir l'injector. Potser Angular no està bootstrapat encara.",
            );
            return;
        }

        // Obté el servei factory de l'injector
        var factory = injector.get("newFinalAvaluacioGrupAlumneFactory");

        var matricules = await this.extractIdMatricula(factory, idGrup);

        if (!matricules || matricules.length === 0) {
            this.logger.error("CSVManager → No hi ha matricules per recuperar");
            return;
        }

        const nomGrup = matricules[0].nomGrup;

        try {
            const tasks = matricules.map((alumne, idx) => () =>
                new Promise(async (resolve) => {
                    const idMat = alumne.idMatricula;

                    if (!idMat || !idGrup) {
                        this.logger.warn(`CSVManager → Alumne ${alumne.nomComplet} sense IDs → saltant`);
                        return resolve({ skipped: true, nom: alumne.nomComplet });
                    }

                    try {
                        this.logger.log(`CSVManager → ⏳ [${idx + 1}/${matricules.length}] Carregant ${alumne.nomComplet}...`);

                        const dadesAlumne = await this.fetchAvaluacioData(factory, idMat, idGrup);

                        if (!dadesAlumne || !dadesAlumne.lContinguts) {
                            this.logger.warn(`CSVManager → No s'han rebut dades per ${alumne.nomComplet}`);
                            return resolve({ skipped: true, nom: alumne.nomComplet });
                        }

                        resolve({
                            success: true,
                            idAlumne: alumne.identificadorAlumne,
                            idMatricula: idMat,
                            nom: alumne.nomComplet,
                            notes: dadesAlumne.lContinguts,
                            avaluacions: dadesAlumne.lAvaluacions
                        });

                    } catch (err) {
                        this.logger.error(`CSVManager → Error amb ${alumne.nomComplet}:`, err);
                        resolve({ error: true, nom: alumne.nomComplet, err });
                    }
                })
            );

            const config = {
                concurrency: 1,        // maxim peticions alhora
                limit: Infinity,       // Màxim de peticions per interval
                interval: 500          // Interval entre peticions en ms (1000 = 1 segon)
            };

            const notesAlumnes = await executeQueue(tasks, config);

            this.descarregaCSV(notesAlumnes, evaluation, nomGrup);

        } catch (error) {
            this.logger.error("Error crític al CSVManager:", error);
        }
    }

    /**
     * Genera i descarrega un CSV amb totes les notes del grup
     * @param {Array<Object>} dadesAlumnes
     */
    descarregaCSV(dadesAlumnes, evaluation, nomGrup) {
        // 1. FUNCIÓ AUXILIAR: Escapar valors per a CSV
        const csvEscape = (val) => {
            const str = String(val ?? "");
            return str.includes(",") || str.includes('"') || str.includes("\n")
                ? `"${str.replace(/"/g, '""')}"`
                : str;
        };

        const getNotesAvaluacioSeleccionada = (alumne) => {
            let idAvaluacio = null;
            const targetCodi = `FINAL_${evaluation}`;
            if (alumne.avaluacions && Array.isArray(alumne.avaluacions)) {
                const ava = alumne.avaluacions.find(a => a.codiExternAva === targetCodi);
                if (ava) {
                    idAvaluacio = ava.id;
                }
            }

            if (idAvaluacio && alumne.notes[idAvaluacio]) {
                return alumne.notes[idAvaluacio];
            }

            const notesValues = Object.values(alumne.notes);
            return notesValues.at(-2) || notesValues.at(-1) || [];
        };

        // Filtrar alumnes que no tinguin notes (per exemple, si hi ha hagut error)
        const alumnesValids = dadesAlumnes.filter(a => a && a.notes);

        // 2. IDENTIFICAR ESTRUCTURA GLOBAL
        const moduls = new Map();

        alumnesValids.forEach(alumne => {
            const notes = getNotesAvaluacioSeleccionada(alumne);
            if (!notes || !Array.isArray(notes)) return;
            notes.forEach(mod => {
                if (!mod || !mod.codiExternContingut) return;
                if (!moduls.has(mod.codiExternContingut)) {
                    moduls.set(mod.codiExternContingut, {
                        nom: mod.nom || mod.codiExternContingut || "Sense nom",
                        jerarquia: mod.jerarquia || "0"
                    });
                }
            });
        });

        const modulsArray = Array.from(moduls.entries()).sort((a, b) => a[0].localeCompare(b[0]));

        // 3. CONSTRUIR CAPÇALERES
        const header1 = ["", ""];
        const header2 = ["idAlumne", "nom"];

        modulsArray.forEach(([codi, info]) => {
            if (info.jerarquia == "2") {
                header1.push(csvEscape(info.nom));
                header2.push(csvEscape(codi));
            } else {
                header1.push("");
                header2.push(csvEscape(codi));
            }
        });

        // 4. CONSTRUIR FILES D'ALUMNES
        const files = alumnesValids.map(alumne => {
            const notes = getNotesAvaluacioSeleccionada(alumne);

            const fila = [csvEscape(alumne.idAlumne), csvEscape(alumne.nom)];
            modulsArray.forEach(([codi]) => {
                let modData = null;
                if (Array.isArray(notes)) {
                    modData = notes.find(m => m.codiExternContingut == codi);
                }
                
                try {
                    if (modData && modData.qualitativa) {
                        if (/^A\d{1,2}$/.test(modData.qualitativa)) {
                            fila.push(csvEscape(modData.qualitativa.replace(/\D/g, "")));
                        } else {
                            fila.push(csvEscape(modData.qualitativa));
                        }
                    } else if(modData && modData.jerarquia == 2 && modData.quantitativa) {
                        fila.push(modData.quantitativa);
                    }
                    else{
                        fila.push("");
                    }
                } catch {
                    fila.push("");
                }
            });
            return fila;
        });

        // 5. GENERAR I DESCARREGAR
        const csvContent = [
            header1.join(","),
            header2.join(","),
            ...files.map(f => f.join(","))
        ].join("\n");

        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Esfera_Notes_av_${evaluation}_${new Date().toISOString().slice(0, 10)}_${nomGrup}.csv`;
        link.click();
        URL.revokeObjectURL(url);

        this.logger.log("CSVManager → CSV descarregat correctament");
    }

    /**
     * @param {Object} factory
     * @param {number} idGrup
     * @returns {Promise<Array|null>}
     */
    extractIdMatricula(factory, idGrup) {
        this.logger.log("CSVManager → inici idMatricula");

        var injector = window.angular ? window.angular.element(document.documentElement).injector() : null;
        if (!injector) {
            this.logger.error('CSVManager → Injector Angular no disponible');
            return Promise.resolve(null);
        }

        var factoryGrup = injector.get('finalavaluaciogrupalumneFactory');

        return factoryGrup.getGrupClasseById(idGrup)
            .then((resGrup) => {
                var fkGrup = resGrup.data.fkGrup;
                return factory.getAlumnesGrupById(fkGrup);
            })
            .then((resAlumnes) => {
                var matricules = resAlumnes.data.matriculesGrupDTOList;
                return matricules;
            })
            .catch((err) => {
                this.logger.error('CSVManager → Error obtenint el grup:', err);
                return null;
            });
    }

    /**
     * @returns {number|null}
     */
    extractIdGrup() {
        const url_grup = new URL(window.location.href).href;
        const grup = url_grup.replace(/\/+$/, '').split('/').pop().match(/\d+/);
        return grup ? parseInt(grup[0], 10) : null;
    }

    /**
     * @param {Object} factory
     * @param {string|number} idMat
     * @param {number} idGrup
     * @returns {Promise<object>}
     */
    async fetchAvaluacioData(factory, idMat, idGrup) {
        return factory
            .obtenirDadesGrupIAlumneFinal(idMat, idGrup)
            .then(function (res) {
                var dadesAlumne = res.data.avaluacioGrupIAlumneWrapper;
                return dadesAlumne;
            })
            .catch((err) => {
                this.logger.error("CSVManager → ERROR EN LA PETICIÓ:", err);
            });
    }
}

/**
 * Funció auxiliar utilitzada exclusivament per establir i controlar de forma asíncrona peticions.
 */
async function executeQueue(tasks, {
    concurrency = Infinity,
    limit = Infinity,
    interval = 0
} = {}) {

    const results = new Array(tasks.length);
    const queue = tasks.map((task, index) => ({ task, index }));

    let activeCount = 0;
    let launchedInInterval = 0;
    let lastIntervalStart = Date.now();

    return new Promise((resolve) => {
        const next = async () => {
            if (queue.length === 0 && activeCount === 0) {
                return resolve(results);
            }

            const now = Date.now();

            if (interval > 0 && now - lastIntervalStart >= interval) {
                launchedInInterval = 0;
                lastIntervalStart = now;
            }

            while (queue.length > 0) {
                if (activeCount >= concurrency) break;

                if (interval > 0 && launchedInInterval >= limit) {
                    const delay = interval - (Date.now() - lastIntervalStart);
                    setTimeout(next, Math.max(0, delay));
                    return;
                }

                const { task, index } = queue.shift();

                activeCount++;
                launchedInInterval++;

                (async (i) => {
                    try {
                        results[i] = await task();
                    } catch (err) {
                        results[i] = err;
                    } finally {
                        activeCount--;
                        next();
                    }
                })(index);
            }
        };
        next();
    });
}
