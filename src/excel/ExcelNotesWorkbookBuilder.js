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

        const headers2 = worksheet.getRow(2).values;

        for (let rowNumber = 3; rowNumber <= worksheet.rowCount; rowNumber++) {
            const row = worksheet.getRow(rowNumber);
            for (let colNumber = 3; colNumber <= worksheet.columnCount; colNumber++) {
                const cell = row.getCell(colNumber);
                cell.alignment = { vertical: 'middle', horizontal: 'right' };
                cell.border = this.obtéBorderNota(colNumber, columnesIniciModul, columnesFinalModul, borderFi, borderIniciModul, borderFinalModul);

                const isConvocatoria = headers2[colNumber] === 'n. convocatoria';
                const isProvisional = headers2[colNumber] === 'provisional';
                const isCodiModul = headers2[colNumber - 1] === 'n. convocatoria';

                if (isConvocatoria || isCodiModul || isProvisional) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF1F5F9' }, // slate-100 lleuger
                    };
                }

                this.aplicaEstilNota(cell);
            }
        }

        columnesIniciModul.forEach(colNumber => {
            for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
                const cell = worksheet.getRow(rowNumber).getCell(colNumber);
                cell.font = { ...(cell.font || {}), bold: true };
            }
        });

        this.ajustaAmpladesColumnes(worksheet);
        this.afegeixFullNotesFlat(workbook, dadesAlumnes, evaluation);

        return workbook;
    }

    /**
     * Afegeix una pestanya normalitzada amb una fila per nota.
     */
    afegeixFullNotesFlat(workbook, dadesAlumnes, evaluation) {
        const worksheet = workbook.addWorksheet('Notes Flat');
        worksheet.views = [{ state: 'frozen', xSplit: 2, ySplit: 1 }];

        const header = ['idAlumne', 'nom Alumne', 'Codi Mòdul', 'Nom Mòdul', 'Codi', 'Nom', 'Tipus', 'Subtipus', 'Nota'];
        worksheet.addRow(header);

        this.obtéAlumnesValids(dadesAlumnes).forEach(alumne => {
            const notes = this.obtéNotesAvaluacioSeleccionada(alumne, evaluation);
            if (!Array.isArray(notes)) return;

            const modulsPerCodi = new Map(
                notes
                    .filter(contingut => contingut?.codi && String(contingut.jerarquia) === '2')
                    .map(contingut => [contingut.codi, contingut]),
            );

            notes.forEach(contingut => {
                if (!contingut?.codi) return;

                const codiModul = this.obtéCodiModul(contingut.codi);
                const tipusNota = this.obtéTipusNotaFlat(contingut.codi, codiModul);
                const modul = contingut.codi === codiModul ? contingut : modulsPerCodi.get(codiModul);

                worksheet.addRow([
                    alumne.idAlumne ?? '',
                    alumne.nom ?? '',
                    codiModul,
                    modul?.nom ?? '',
                    contingut.codi,
                    contingut.nom ?? '',
                    tipusNota.tipus,
                    tipusNota.subtipus,
                    this.obtéValorNota(contingut),
                ]);
            });
        });

        worksheet.getRow(1).font = { bold: true };
        worksheet.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: 1, column: header.length },
        };

        const notaColumn = header.indexOf('Nota') + 1;
        for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
            this.aplicaEstilNotaAFila(worksheet.getRow(rowNumber), notaColumn, header.length);
        }

        this.ajustaAmpladesColumnesFlat(worksheet);
    }

    /**
     * Aplica l'estil de nota aprovada a tota la fila plana, clonant els objectes d'estil per cel·la.
     */
    aplicaEstilNotaAFila(row, notaColumn, columnCount) {
        const notaCell = row.getCell(notaColumn);
        if (!this.aplicaEstilNota(notaCell)) return;

        for (let colNumber = 1; colNumber <= columnCount; colNumber++) {
            const cell = row.getCell(colNumber);
            cell.fill = this.clonaEstil(notaCell.fill);
            cell.font = this.clonaEstil(notaCell.font);
        }
    }

    /**
     * Clona estructures simples d'estil d'ExcelJS per evitar compartir referències mutables.
     */
    clonaEstil(style) {
        if (!style) return style;
        return JSON.parse(JSON.stringify(style));
    }

    /**
     * Deriva el codi del mòdul eliminant només sufixos RA/EM coneguts.
     */
    obtéCodiModul(codi) {
        return String(codi).replace(/_\d{2}(?:RA|EM)$/, '');
    }

    /**
     * Deriva el tipus i subtipus per a la pestanya plana.
     */
    obtéTipusNotaFlat(codi, codiModul) {
        if (codi === codiModul) {
            return { tipus: 'MP', subtipus: 'MP' };
        }

        const match = String(codi).match(/_(\d{2}(RA|EM))$/);
        return {
            tipus: match?.[1] ?? '',
            subtipus: match?.[2] ?? '',
        };
    }

    /**
     * Ajusta amplades de la pestanya plana segons el contingut.
     */
    ajustaAmpladesColumnesFlat(worksheet) {
        worksheet.columns.forEach(column => {
            const maxLength = Math.max(
                10,
                ...column.values.slice(1).map(value => String(value ?? '').length),
            );
            column.width = Math.min(maxLength + 2, 45);
        });
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
     * Aplica l'estil compartit per a notes aprovades.
     */
    aplicaEstilNota(cell) {
        if (!this.ésNotaAprovada(cell.value)) return false;

        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFC6EFCE' },
        };
        cell.font = { ...(cell.font || {}), color: { argb: 'FF006100' } };
        return true;
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
        // Filtra alumnes que no tinguin notes, per exemple si hi ha hagut error.
        const alumnesValids = this.obtéAlumnesValids(dadesAlumnes);

        const moduls = new Map();

        alumnesValids.forEach(alumne => {
            const notes = this.obtéNotesAvaluacioSeleccionada(alumne, evaluation);
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
                header2.push("n. convocatoria");

                header1.push("");
                header2.push(codi);

                header1.push('');
                header2.push("provisional");
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
            const notes = this.obtéNotesAvaluacioSeleccionada(alumne, evaluation);

            const fila = [alumne.idAlumne ?? '', alumne.nom ?? ''];
            modulsArray.forEach(([codi, info]) => {
                let modData = null;
                if (Array.isArray(notes)) {
                    modData = notes.find(m => m.codi == codi);
                }

                try {
                    if (info.jerarquia == '2'){
                        fila.push(modData?.convocatoria ?? undefined);
                    }
                    fila.push(this.obtéValorNota(modData));

                    //nota provisional just després de la final
                    if(info.jerarquia == '2'){
                        fila.push(modData?.provisional ?? undefined);
                    }
                } catch {
                    if (info.jerarquia == '2') {
                        fila.push('', '', '');
                    } else {
                        fila.push('');
                    }
                }
            });
            return fila;
        });

        return { header1, header2, files, spansModuls };
    }

    /**
     * Filtra alumnes que tenen continguts de notes.
     */
    obtéAlumnesValids(dadesAlumnes) {
        return dadesAlumnes.filter(a => a && a.continguts);
    }

    /**
     * Obté les notes de l'avaluació seleccionada amb el mateix fallback històric.
     */
    obtéNotesAvaluacioSeleccionada(alumne, evaluation) {
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
    }

    /**
     * Normalitza una nota de contingut exactament igual que el full Notes.
     */
    obtéValorNota(contingut) {
        if (!contingut) return '';

        if (contingut.jerarquia == 2 && contingut.quantitativa) {
            return this.normalitzaValorNota(contingut.quantitativa);
        }

        if (contingut.qualitativa) {
            if (/^A\d{1,2}$/.test(contingut.qualitativa)) {
                return Number(contingut.qualitativa.replace(/\D/g, ''));
            }
            return contingut.qualitativa;
        }

        return '';
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
