/**
 * Construeix el model del visualitzador a partir del model intern de notes.
 */
export class VisualitzadorModelBuilder {
    /**
     * Converteix les dades d'alumnes en un model orientat a renderitzar el resum visual.
     * @param {Array<Object>} dadesAlumnes
     * @param {number} evaluation
     * @returns {{students: Array<Object>}}
     */
    construeixModel(dadesAlumnes, evaluation = 1) {
        const students = (dadesAlumnes || [])
            .filter(alumne => alumne && alumne.continguts && !alumne.skipped && !alumne.error)
            .map(alumne => this.construeixAlumne(alumne, evaluation))
            .filter(Boolean)
            .sort((a, b) => a.nom.localeCompare(b.nom));

        return { students };
    }

    /**
     * Construeix el model d'un alumne.
     */
    construeixAlumne(alumne, evaluation) {
        const notes = this.obtéNotesAvaluació(alumne, evaluation);
        if (!Array.isArray(notes)) return null;

        const subjects = this.construeixAssignatures(notes);
        if (subjects.length === 0) return null;

        return {
            id: String(alumne.idAlumne ?? alumne.idMatricula ?? alumne.nom ?? ''),
            nom: alumne.nom ?? '',
            subjects,
        };
    }

    /**
     * Obté el bloc de notes corresponent a l'avaluació seleccionada.
     */
    obtéNotesAvaluació(alumne, evaluation) {
        let idAvaluacio = null;
        const targetCodi = `FINAL_${evaluation}`;

        if (Array.isArray(alumne.avaluacions)) {
            const avaluacio = alumne.avaluacions.find(a => a.codi === targetCodi);
            if (avaluacio) idAvaluacio = avaluacio.id;
        }

        if (idAvaluacio && alumne.continguts[idAvaluacio]) {
            return alumne.continguts[idAvaluacio];
        }

        const notesValues = Object.values(alumne.continguts || {});
        return notesValues.at(-2) || notesValues.at(-1) || [];
    }

    /**
     * Agrupa mòduls i RAs mantenint una ordenació estable per codi.
     */
    construeixAssignatures(notes) {
        const ordenades = [...notes]
            .filter(nota => nota && nota.codi)
            .sort((a, b) => String(a.codi).localeCompare(String(b.codi)));
        const subjectMap = new Map();

        ordenades.forEach(nota => {
            const code = String(nota.codi);
            if (String(nota.jerarquia) === '2' || !code.includes('_')) {
                if (!subjectMap.has(code)) {
                    subjectMap.set(code, {
                        code,
                        name: nota.nom || code,
                        final: this.normalitzaNota(nota),
                        ras: [],
                    });
                } else {
                    subjectMap.get(code).final = this.normalitzaNota(nota);
                }
            }
        });

        ordenades.forEach(nota => {
            const code = String(nota.codi);
            if (String(nota.jerarquia) === '2' || !code.includes('_')) return;

            const subjectCode = this.obtéCodiAssignatura(code, subjectMap);
            if (!subjectCode) return;

            const subject = subjectMap.get(subjectCode);
            subject.ras.push({
                key: this.obtéEtiquetaRA(code, subjectCode),
                raw: this.normalitzaNota(nota),
            });
        });

        return Array.from(subjectMap.values()).filter(subject => subject.final !== '' || subject.ras.length > 0);
    }

    /**
     * Detecta el mòdul pare d'una RA a partir del prefix més llarg existent.
     */
    obtéCodiAssignatura(code, subjectMap) {
        return Array.from(subjectMap.keys())
            .filter(subjectCode => code.startsWith(`${subjectCode}_`))
            .sort((a, b) => b.length - a.length)[0] || null;
    }

    /**
     * Genera l'etiqueta curta de la RA.
     */
    obtéEtiquetaRA(code, subjectCode) {
        return code.replace(`${subjectCode}_`, '').replace('_IC10', '');
    }

    /**
     * Normalitza qualitatives A10 i quantitatives textuals.
     */
    normalitzaNota(nota) {
        if (nota.qualitativa !== undefined && nota.qualitativa !== null && nota.qualitativa !== '') {
            const qualitativa = String(nota.qualitativa).trim();
            if (/^A\d{1,2}$/.test(qualitativa)) return Number(qualitativa.replace(/\D/g, ''));
            return qualitativa;
        }

        if (nota.quantitativa !== undefined && nota.quantitativa !== null && nota.quantitativa !== '') {
            const quantitativa = String(nota.quantitativa).trim().replace(',', '.');
            return /^\d+(?:\.\d+)?$/.test(quantitativa) ? Number(quantitativa) : quantitativa;
        }

        return '';
    }

    parseVal(v) {
        if (this.isNA(v)) return null;
        if (v === 'PDT') return 'PDT';
        if (v === 'PQ') return 'PQ';
        const n = parseFloat(v);
        return Number.isNaN(n) ? null : n;
    }

    isNA(v) {
        return v === 'NA' || v === '' || v === undefined || v === null;
    }

    scoreClass(v) {
        if (this.isNA(v)) return 'fail';
        const parsed = this.parseVal(v);
        if (parsed === null) return 'fail';
        if (parsed === 'PDT') return 'pdt';
        if (parsed === 'PQ') return 'pass';
        return parsed >= 5 ? 'pass' : 'fail';
    }

    displayVal(v) {
        if (this.isNA(v)) return 'NA';
        const parsed = this.parseVal(v);
        if (parsed === null) return 'NA';
        return String(parsed);
    }

    finalClass(v) {
        if (this.isNA(v)) return 'na';
        const parsed = this.parseVal(v);
        if (parsed === null) return 'na';
        if (parsed === 'PDT') return 'warn';
        if (parsed === 'PQ') return 'pass';
        return parsed >= 5 ? 'pass' : 'fail';
    }
}
