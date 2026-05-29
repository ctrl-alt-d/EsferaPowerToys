/**
 * Coordina l'obtenció de dades, la construcció del workbook i la descàrrega XLSX.
 */
export class ExcelExportManager {
    /**
     * @param {import('../PowerToysLogger.js').PowerToysLogger} logger
     * @param {import('../dataProviders/NotesDataProvider.js').NotesDataProvider} dataProvider
     * @param {import('./ExcelNotesWorkbookBuilder.js').ExcelNotesWorkbookBuilder} workbookBuilder
     */
    constructor(logger, dataProvider, workbookBuilder) {
        this.logger = logger;
        this.dataProvider = dataProvider;
        this.workbookBuilder = workbookBuilder;
    }

    /**
     * Inicia i coordina el procés de descàrrega del fitxer Excel.
     * @returns {Promise<void>}
     */
    async procésDescàrregaExcel(evaluation = 1) {
        this.logger.log('ExcelExportManager → procésDescàrregaExcel inici');

        try {
            const dadesExportació = await this.dataProvider.obtéDadesExportació();
            if (!dadesExportació) return;

            await this.descarregaXLSX(dadesExportació.notesAlumnes, evaluation, dadesExportació.nomGrup);
        } catch (error) {
            this.logger.error('Error crític a ExcelExportManager:', error);
        }
    }

    /**
     * Genera i descarrega un XLSX amb totes les notes del grup.
     * @param {Array<Object>} dadesAlumnes
     * @param {number} evaluation
     * @param {string} nomGrup
     * @returns {Promise<void>}
     */
    async descarregaXLSX(dadesAlumnes, evaluation, nomGrup) {
        const workbook = this.workbookBuilder.construeixWorkbookNotes(dadesAlumnes, evaluation);
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Esfera_Notes_av_${evaluation}_${new Date().toISOString().slice(0, 10)}_${nomGrup}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);

        this.logger.log('ExcelExportManager → XLSX descarregat correctament');
    }
}
