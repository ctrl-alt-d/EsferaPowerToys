import { NotesMapper } from './NotesMapper.js';

/**
 * Obté les dades de notes exposades pels serveis Angular d'Esfer@.
 */
export class NotesDataProvider {
    /**
     * @param {import('../PowerToysLogger.js').PowerToysLogger} logger
     * @param {NotesMapper} mapper
     */
    constructor(logger, mapper = new NotesMapper()) {
        this.logger = logger;
        this.mapper = mapper;
    }

    /**
     * Obté totes les dades necessàries per exportar o visualitzar les notes del grup actual.
     * @returns {Promise<{notesAlumnes: Array<Object>, nomGrup: string}|null>}
     */
    async obtéDadesExportació() {
        const idGrup = this.extractIdGrup();
        if (idGrup === null) {
            this.logger.error("NotesDataProvider → No s'ha pogut extreure idGrup");
            return null;
        }

        const injector = this.obtéInjectorAngular();
        if (!injector) {
            this.logger.error(
                "NotesDataProvider → No s'ha pogut obtenir l'injector. Potser Angular no està bootstrapat encara.",
            );
            return null;
        }

        const factory = injector.get('newFinalAvaluacioGrupAlumneFactory');
        const matricules = await this.extractIdMatricula(factory, idGrup, injector);

        if (!matricules || matricules.length === 0) {
            this.logger.error('NotesDataProvider → No hi ha matricules per recuperar');
            return null;
        }

        const tasks = matricules.map((alumne, idx) => () => this.obtéDadesAlumne(factory, alumne, idx, matricules.length, idGrup));
        const notesAlumnes = await this.executeQueue(tasks, {
            concurrency: 1,
            limit: Infinity,
            interval: 500,
        });

        return {
            notesAlumnes,
            nomGrup: matricules[0].nomGrup,
        };
    }

    /**
     * Obté l'injector Angular de la pàgina d'Esfer@ si està disponible.
     */
    obtéInjectorAngular() {
        const element = document.documentElement;
        return window.angular ? window.angular.element(element).injector() : null;
    }

    /**
     * Obté les dades d'avaluació d'un alumne i les normalitza al model intern.
     */
    async obtéDadesAlumne(factory, alumne, idx, total, idGrup) {
        const idMat = alumne.idMatricula;

        if (!idMat || !idGrup) {
            this.logger.warn(`NotesDataProvider → Alumne ${alumne.nomComplet} sense IDs → saltant`);
            return { skipped: true, nom: alumne.nomComplet };
        }

        try {
            this.logger.log(`NotesDataProvider → ⏳ [${idx + 1}/${total}] Carregant ${alumne.nomComplet}...`);

            const dadesAlumne = await this.fetchAvaluacioData(factory, idMat, idGrup);

            if (!dadesAlumne || !dadesAlumne.lContinguts) {
                this.logger.warn(`NotesDataProvider → No s'han rebut dades per ${alumne.nomComplet}`);
                return { skipped: true, nom: alumne.nomComplet };
            }

            return this.mapper.normalitzaAlumne(alumne, dadesAlumne);
        } catch (err) {
            this.logger.error(`NotesDataProvider → Error amb ${alumne.nomComplet}:`, err);
            return { error: true, nom: alumne.nomComplet, err };
        }
    }

    /**
     * @param {Object} factory
     * @param {number} idGrup
     * @param {Object} injector
     * @returns {Promise<Array|null>}
     */
    extractIdMatricula(factory, idGrup, injector = this.obtéInjectorAngular()) {
        this.logger.log('NotesDataProvider → inici idMatricula');

        if (!injector) {
            this.logger.error('NotesDataProvider → Injector Angular no disponible');
            return Promise.resolve(null);
        }

        const factoryGrup = injector.get('finalavaluaciogrupalumneFactory');

        return factoryGrup.getGrupClasseById(idGrup)
            .then((resGrup) => {
                const fkGrup = resGrup.data.fkGrup;
                return factory.getAlumnesGrupById(fkGrup);
            })
            .then((resAlumnes) => resAlumnes.data.matriculesGrupDTOList)
            .catch((err) => {
                this.logger.error('NotesDataProvider → Error obtenint el grup:', err);
                return null;
            });
    }

    /**
     * @returns {number|null}
     */
    extractIdGrup() {
        const urlGrup = new URL(window.location.href).href;
        const grup = urlGrup.replace(/\/+$/, '').split('/').pop().match(/\d+/);
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
                return res.data.avaluacioGrupIAlumneWrapper;
            })
            .catch((err) => {
                this.logger.error('NotesDataProvider → ERROR EN LA PETICIÓ:', err);
            });
    }

    /**
     * Executa peticions asíncrones controlant concurrència i interval.
     */
    async executeQueue(tasks, { concurrency = Infinity, limit = Infinity, interval = 0 } = {}) {
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
}
