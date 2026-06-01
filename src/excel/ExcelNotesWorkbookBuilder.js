/**
 * Construeix el llibre Excel de notes a partir de dades normalitzades d'Esfer@.
 */
export class ExcelNotesWorkbookBuilder {
    constructor(excelJS = (typeof window !== 'undefined' ? window.ExcelJS : null)) {
        this.excelJS = excelJS;
    }

    /**
     * Construeix el llibre Excel amb capçaleres, dades i estils.
     * @param {Array<Object>} dadesAlumnes
     * @param {number} evaluation
     * @returns {any}
     */
    construeixWorkbookNotes(dadesAlumnes, evaluation) {
        const { header1, header2, files, spansModuls } = this.construeixTaulaNotes(dadesAlumnes, evaluation);

        const workbook = new this.excelJS.Workbook();
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
            if (alumne.avaluacions && Array.isArray(alumne.avaluacions)) {
                const ava = alumne.avaluacions[evaluation-1];
                if (ava) {
                    idAvaluacio = ava.id;
                }
            }

            if (idAvaluacio && alumne.continguts[idAvaluacio]) {
                return alumne.continguts[idAvaluacio];
            }

            const notesValues = Object.values(alumne.continguts);
            return notesValues.at(-2) || notesValues.at(-1) || [];
        };

        // Filtra alumnes que no tinguin notes, per exemple si hi ha hagut error.
        const alumnesValids = dadesAlumnes.filter(a => a && a.continguts);

        const moduls = new Map();

        alumnesValids.forEach(alumne => {
            const notes = getNotesAvaluacioSeleccionada(alumne);
            if (!notes || !Array.isArray(notes)) return;
            notes.forEach(mod => {
                if (!mod || !mod.codi) return;
                if (!moduls.has(mod.codi)) {
                    moduls.set(mod.codi, {
                        nom: mod.nom || mod.codi || 'Sense nom',
                        jerarquia: mod.jerarquia || '0',
                    });
                }
            });
        });

        const modulsArray = Array.from(moduls.entries()).sort((a, b) => a[0].localeCompare(b[0]));

        const header1 = ['', ''];
        const header2 = ['idAlumne', 'nom'];
        const spansModuls = [];
        let spanActual = null;

        modulsArray.forEach(([codi, info]) => {
            const columnIndex = header2.length + 1;
            if (info.jerarquia == '2') {
                if (spanActual) {
                    spanActual.end = columnIndex - 1;
                    spansModuls.push(spanActual);
                }
                spanActual = { start: columnIndex, end: columnIndex };
                header1.push(info.nom);
                header2.push(codi);
            } else {
                header1.push('');
                header2.push(codi);
            }
        });

        if (spanActual) {
            spanActual.end = header2.length;
            spansModuls.push(spanActual);
        }

        const files = alumnesValids.map(alumne => {
            const notes = getNotesAvaluacioSeleccionada(alumne);

            const fila = [alumne.idAlumne ?? '', alumne.nom ?? ''];
            modulsArray.forEach(([codi]) => {
                let modData = null;
                if (Array.isArray(notes)) {
                    modData = notes.find(m => m.codi == codi);
                }

                try {
                    if (modData && modData.jerarquia == 2 && modData.quantitativa) {
                        fila.push(this.normalitzaValorNota(modData.quantitativa));
                    } else if (modData && modData.qualitativa) {
                        if (/^A\d{1,2}$/.test(modData.qualitativa)) {
                            fila.push(Number(modData.qualitativa.replace(/\D/g, '')));
                        } else {
                            fila.push(modData.qualitativa);
                        }
                    } else {
                        fila.push('');
                    }
                } catch {
                    fila.push('');
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
        return valor ?? '';
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
}
