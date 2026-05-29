/**
 * Normalitza les dades crues d'Esfer@ a un model intern estable de notes.
 *
 * Model intern d'alumne:
 * {
 *   idAlumne,
 *   idMatricula,
 *   nom,
 *   grup,
 *   avaluacions: [{ id, codi }],
 *   continguts: {
 *     [idAvaluacio]: [{ codi, nom, jerarquia, qualitativa, quantitativa }]
 *   }
 * }
 */
export class NotesMapper {
    /**
     * Construeix el model intern d'un alumne a partir de la matrícula i la resposta crua.
     * @param {Object} alumne
     * @param {Object} dadesAlumne
     * @returns {Object}
     */
    normalitzaAlumne(alumne = {}, dadesAlumne = {}) {
        return {
            success: true,
            idAlumne: alumne.identificadorAlumne ?? alumne.idAlumne ?? '',
            idMatricula: alumne.idMatricula ?? '',
            nom: alumne.nomComplet ?? alumne.nom ?? '',
            grup: alumne.nomGrup ?? alumne.grup ?? '',
            avaluacions: this.normalitzaAvaluacions(dadesAlumne.lAvaluacions),
            continguts: this.normalitzaContinguts(dadesAlumne.lContinguts),
        };
    }

    /**
     * Normalitza les avaluacions crues exposant només el codi intern i l'identificador.
     * @param {Array<Object>} avaluacions
     * @returns {Array<{id: string|number, codi: string}>}
     */
    normalitzaAvaluacions(avaluacions = []) {
        if (!Array.isArray(avaluacions)) return [];

        return avaluacions
            .filter(Boolean)
            .map(avaluacio => ({
                id: avaluacio.id ?? '',
                codi: avaluacio.codiExternAva ?? avaluacio.codi ?? '',
            }));
    }

    /**
     * Normalitza els continguts indexats per identificador d'avaluació.
     * @param {Object<string, Array<Object>>} continguts
     * @returns {Object<string, Array<{codi: string, nom: string, jerarquia: string, qualitativa: string, quantitativa: string}>>}
     */
    normalitzaContinguts(continguts = {}) {
        if (!continguts || typeof continguts !== 'object') return {};

        return Object.entries(continguts).reduce((normalitzats, [idAvaluacio, notes]) => {
            normalitzats[idAvaluacio] = Array.isArray(notes)
                ? notes.filter(Boolean).map(nota => this.normalitzaContingut(nota))
                : [];
            return normalitzats;
        }, {});
    }

    /**
     * Normalitza un contingut individual eliminant noms de camps propis del backend.
     * @param {Object} contingut
     * @returns {{codi: string, nom: string, jerarquia: string, qualitativa: string, quantitativa: string}}
     */
    normalitzaContingut(contingut = {}) {
        return {
            codi: contingut.codiExternContingut ?? contingut.codi ?? '',
            nom: contingut.nom ?? '',
            jerarquia: contingut.jerarquia ?? '',
            qualitativa: contingut.qualitativa ?? '',
            quantitativa: contingut.quantitativa ?? '',
        };
    }
}
