import ExcelJS from 'exceljs';

/**
 * Classe per a la gestió de les descàrregues Excel de les notes d'una avaluació d'Esfer@.
 * S'encarrega d'obtenir la informació a través d'Angular per descarregar un fitxer XLSX utilitzant l'enllaç Blob local.
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
        this.logger.log("CSVManager → procésDescàrregaXLSX inici");

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

            await this.descarregaXLSX(notesAlumnes, evaluation, nomGrup);

        } catch (error) {
            this.logger.error("Error crític al CSVManager:", error);
        }
    }

    /**
     * Genera i descarrega un XLSX amb totes les notes del grup
     * @param {Array<Object>} dadesAlumnes
     * @returns {Promise<void>}
     */
    async descarregaXLSX(dadesAlumnes, evaluation, nomGrup) {
        const workbook = this.construeixWorkbookNotes(dadesAlumnes, evaluation);
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Esfera_Notes_av_${evaluation}_${new Date().toISOString().slice(0, 10)}_${nomGrup}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);

        this.logger.log("CSVManager → XLSX descarregat correctament");
    }

    /**
     * Manté compatibilitat amb crides antigues del gestor CSV.
     * @param {Array<Object>} dadesAlumnes
     * @returns {Promise<void>}
     */
    descarregaCSV(dadesAlumnes, evaluation, nomGrup) {
        return this.descarregaXLSX(dadesAlumnes, evaluation, nomGrup);
    }

    /**
     * Construeix el llibre Excel amb capçaleres, dades i estils.
     * @param {Array<Object>} dadesAlumnes
     * @returns {ExcelJS.Workbook}
     */
    construeixWorkbookNotes(dadesAlumnes, evaluation) {
        const { header1, header2, files, spansModuls } = this.construeixTaulaNotes(dadesAlumnes, evaluation);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Notes');
        worksheet.views = [{ state: 'frozen', xSplit: 2, ySplit: 2 }];

        worksheet.addRow(header1);
        worksheet.addRow(header2);
        files.forEach(fila => worksheet.addRow(fila));

        worksheet.getRows(1, 2).forEach(row => {
            row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            row.alignment = { vertical: 'middle', horizontal: 'center' };
            row.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: row.number === 1 ? 'FF1D4ED8' : 'FF2563EB' },
            };
        });

        spansModuls.forEach(({ start, end }) => {
            if (end > start) {
                worksheet.mergeCells(1, start, 1, end);
            }
        });

        const borderFi = {
            top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        };

        const borderIniciModul = {
            ...borderFi,
            left: { style: 'medium', color: { argb: 'FF64748B' } },
        };

        const borderFinalModul = {
            ...borderFi,
            right: { style: 'medium', color: { argb: 'FF64748B' } },
        };

        const columnesIniciModul = new Set(spansModuls.map(({ start }) => start));
        const columnesFinalModul = new Set(spansModuls.map(({ end }) => end));

        for (let colNumber = 3; colNumber <= worksheet.columnCount; colNumber++) {
            worksheet.getRow(2).getCell(colNumber).alignment = { vertical: 'middle', horizontal: 'right' };
        }

        for (let rowNumber = 3; rowNumber <= worksheet.rowCount; rowNumber++) {
            const row = worksheet.getRow(rowNumber);
            for (let colNumber = 3; colNumber <= worksheet.columnCount; colNumber++) {
                const cell = row.getCell(colNumber);
                cell.alignment = { vertical: 'middle', horizontal: 'right' };
                cell.border = this.obtéBorderNota(colNumber, columnesIniciModul, columnesFinalModul, borderFi, borderIniciModul, borderFinalModul);
                if (this.ésNotaAprovada(cell.value)) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFC6EFCE' },
                    };
                    cell.font = { color: { argb: 'FF006100' } };
                }
            }
        }

        columnesIniciModul.forEach(colNumber => {
            for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
                const cell = worksheet.getRow(rowNumber).getCell(colNumber);
                cell.font = { ...(cell.font || {}), bold: true };
            }
        });

        this.ajustaAmpladesColumnes(worksheet);

        return workbook;
    }

    /**
     * Retorna el border de la cel·la marcant visualment l'inici i final de cada mòdul.
     */
    obtéBorderNota(colNumber, columnesIniciModul, columnesFinalModul, borderFi, borderIniciModul, borderFinalModul) {
        if (columnesIniciModul.has(colNumber) && columnesFinalModul.has(colNumber)) {
            return {
                ...borderFi,
                left: borderIniciModul.left,
                right: borderFinalModul.right,
            };
        }

        if (columnesIniciModul.has(colNumber)) return borderIniciModul;
        if (columnesFinalModul.has(colNumber)) return borderFinalModul;
        return borderFi;
    }

    /**
     * Ajusta amplades sense comptar la capçalera fusionada, que faria massa amples les columnes de notes.
     */
    ajustaAmpladesColumnes(worksheet) {
        worksheet.columns.forEach((column, index) => {
            if (index === 0) {
                column.width = 16;
                return;
            }

            const values = column.values.slice(index === 1 ? 1 : 2);
            const maxLength = Math.max(
                index === 1 ? 18 : 6,
                ...values.map(value => String(value ?? '').length),
            );

            column.width = index === 1
                ? Math.min(maxLength + 2, 40)
                : Math.min(maxLength + 1, 14);
        });
    }

    /**
     * Prepara la taula de notes mantenint l'estructura original d'exportació.
     * @param {Array<Object>} dadesAlumnes
     */
    construeixTaulaNotes(dadesAlumnes, evaluation) {
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
        const spansModuls = [];
        let spanActual = null;

        modulsArray.forEach(([codi, info]) => {
            const columnIndex = header2.length + 1;
            if (info.jerarquia == "2") {
                if (spanActual) {
                    spanActual.end = columnIndex - 1;
                    spansModuls.push(spanActual);
                }
                spanActual = { start: columnIndex, end: columnIndex };
                header1.push(info.nom);
                header2.push(codi);
            } else {
                header1.push("");
                header2.push(codi);
            }
        });

        if (spanActual) {
            spanActual.end = header2.length;
            spansModuls.push(spanActual);
        }

        // 4. CONSTRUIR FILES D'ALUMNES
        const files = alumnesValids.map(alumne => {
            const notes = getNotesAvaluacioSeleccionada(alumne);

            const fila = [alumne.idAlumne ?? "", alumne.nom ?? ""];
            modulsArray.forEach(([codi]) => {
                let modData = null;
                if (Array.isArray(notes)) {
                    modData = notes.find(m => m.codiExternContingut == codi);
                }
                
                try {
                    if (modData && modData.qualitativa) {
                        if (/^A\d{1,2}$/.test(modData.qualitativa)) {
                            fila.push(Number(modData.qualitativa.replace(/\D/g, "")));
                        } else {
                            fila.push(modData.qualitativa);
                        }
                    } else if(modData && modData.jerarquia == 2 && modData.quantitativa) {
                        fila.push(this.normalitzaValorNota(modData.quantitativa));
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

        return { header1, header2, files, spansModuls };
    }

    /**
     * Converteix les notes numèriques a número i preserva els codis textuals.
     */
    normalitzaValorNota(valor) {
        if (typeof valor === 'string' && /^\d+(?:[.,]\d+)?$/.test(valor.trim())) {
            return Number(valor.trim().replace(',', '.'));
        }
        return valor ?? "";
    }

    /**
     * Determina si una cel·la conté una nota aprovada.
     */
    ésNotaAprovada(valor) {
        if (typeof valor === 'number') return valor >= 5;
        if (typeof valor === 'string' && /^\d+(?:[.,]\d+)?$/.test(valor.trim())) {
            return Number(valor.trim().replace(',', '.')) >= 5;
        }
        return false;
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
