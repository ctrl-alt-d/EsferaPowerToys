/**
 * Coordina l'obtenció de dades i l'obertura del visualitzador.
 */
export class VisualitzadorManager {
    constructor(logger, dataProvider, modelBuilder, modal) {
        this.logger = logger;
        this.dataProvider = dataProvider;
        this.modelBuilder = modelBuilder;
        this.modal = modal;
    }

    /**
     * Carrega les dades directament d'Esfer@ i obre el modal.
     */
    async obreVisualitzador(evaluation = 1) {
        this.logger.log('VisualitzadorManager → obreVisualitzador inici');

        try {
            const dadesExportació = await this.dataProvider.obtéDadesExportació();
            if (!dadesExportació) return;

            const model = this.modelBuilder.construeixModel(dadesExportació.notesAlumnes, evaluation);
            this.modal.open(model.students);
        } catch (error) {
            this.logger.error('Error crític a VisualitzadorManager:', error);
        }
    }
}
