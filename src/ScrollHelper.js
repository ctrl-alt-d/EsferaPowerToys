/**
 * Classe encarregada de gestionar el focus i l’scroll cap a una matèria concreta
 * per fer que l’usuari vegi clarament on s’han aplicat els canvis.
 */
export class ScrollHelper {
    /**
     * Constructor del helper.
     * @param {PowerToysLogger} logger - Instància del logger per registrar missatges.
     */
    constructor(logger) {
        this.logger = logger;
    }

    /**
     * Fa scroll i destaca visualment la matèria indicada.
     * @param {{ codi: string, nom: string, RAs: string[] }} materia - L’objecte matèria.
     * @returns {void}
     */
    enfocaAssignatura(materia) {
        if (!materia || !materia.codi) {
            this.logger.warn('ScrollHelper → materia nul·la o sense codi');
            return;
        }

        const selector = 'td.ng-binding.ng-scope';
        const targetTd = Array.from(document.querySelectorAll(selector))
            .find(td => td.textContent.includes(`¬(${materia.codi})`));

        if (targetTd) {
            this.logger.log(`ScrollHelper → trobada fila visual per ${materia.codi}, fent scroll`);
            targetTd.scrollIntoView({ behavior: 'smooth', block: 'start' });
            targetTd.style.transition = 'background-color 0.5s ease';
            targetTd.style.backgroundColor = '#ffffcc';
            setTimeout(() => {
                targetTd.style.backgroundColor = '';
            }, 1500);
        } else {
            this.logger.warn(`ScrollHelper → no s'ha trobat la fila visual per ${materia.codi}`);
        }
    }
}
