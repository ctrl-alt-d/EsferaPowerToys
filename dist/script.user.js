// ==UserScript==
// @name         Esfer@ PowerToys
// @namespace    https://github.com/ctrl-alt-d/EsferaPowerToys
// @version      1.0.0
// @description  Millores per a la plataforma Esfer@
// @author       ctrl-alt-d
// @license      MIT
// @match        https://bfgh.aplicacions.ensenyament.gencat.cat/bfgh/avaluacio/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/ctrl-alt-d/EsferaPowerToys/refs/heads/main/dist/script.user.js
// @downloadURL  https://raw.githubusercontent.com/ctrl-alt-d/EsferaPowerToys/refs/heads/main/dist/script.user.js
// ==/UserScript==


(function () {
    'use strict';

    // PROCESSA LES FILES HTML I EXTRAEIX LES MATÈRIES I RAs
    function analitzaFiles(files) {
        const materies = [];
        let actual = null;

        files.forEach(row => {
            const codiCell = row.querySelector('td:nth-child(1)');
            const nomCell = row.querySelector('td:nth-child(2)');
            if (!codiCell || !nomCell) return;

            const codi = codiCell.textContent.trim().replace(/\s/g, '');
            const nom = nomCell.textContent.trim();

            if (/^[0-9]{4}_[A-Z0-9]+$/.test(codi)) {
                actual = { codi, nom, RAs: [] };
                materies.push(actual);
            } else if (/^[0-9]{4}_[A-Z0-9]+_[0-9]{2}RA$/.test(codi) && actual) {
                actual.RAs.push(codi);
            }
        });

        return materies;
    }

    /**
 * Converteix una cadena de text amb notes (separades per espais/tabulacions) en valors vàlids per als <select>.
 *
 * Exemples d’entrada:
 *   "Pendent 9,52 9,05 x . A10 8,4"
 *
 * Retorna:
 *   ["PDT", "A10", "A9", "", "", "A10", "A8"]
 *
 * Regles:
 *   - Valors com ".", "x", o "" → retornen ""
 *   - Valors numèrics → es transformen en A10–A5 o NA
 *   - Valors ja vàlids (A10, EP, PDT, etc.) → es conserven
 *   - Si alguna entrada no es pot interpretar → retorna null
 *
 * @param {string} text - El text amb notes
 * @returns {string[]|null} Array de codis de nota per als selects o null si hi ha errors
 */
    function tradueixNotes(text) {
        if (!text || typeof text !== 'string') return null;

        const valors = text
            .trim()
            .replace(/\t/g, ' ')
            .replace(/\s+/g, ' ')
            .split(' ');

        const traduïdes = valors.map(v => {
            const vNet = v.replace(',', '.').trim().toUpperCase();

            // Interpretar com a nota buida
            if (vNet === '' || vNet === '.' || vNet === 'X') return '';

            // Ja és un codi vàlid
            if (/^A(10|[5-9])$|^NA$|^EP$|^PDT$/.test(vNet)) return vNet;

            // "Pendent" → PDT
            if (vNet.startsWith('PENDENT')) return 'PDT';

            // Prova de convertir en número
            const num = parseFloat(vNet);
            if (isNaN(num)) return null;

            if (num >= 9.5) return 'A10';
            if (num >= 8.5) return 'A9';
            if (num >= 7.5) return 'A8';
            if (num >= 6.5) return 'A7';
            if (num >= 5.5) return 'A6';
            if (num >= 4.5) return 'A5';
            return 'NA';
        });

        return traduïdes.includes(null) ? null : traduïdes;
    }


    /**
 * Assigna a cada RA del codi corresponent la nota donada.
 * Si la nota és "", es neteja el select.
 *
 * @param {string[]} raCodiList - Llista de codis RA (ex: ["0179_ICC0_01RA", ...])
 * @param {string[]} valors - Llista de valors per a cada RA (ex: ["A10", "", "NA", ...])
 */
    function aplicaNotesARAs(raCodiList, valors) {
        if (!Array.isArray(valors) || valors.length !== raCodiList.length) return;

        raCodiList.forEach((raCodi, index) => {
            const nota = valors[index];
            const valorIntern = nota ? `string:${nota}` : '';

            const td = Array.from(document.querySelectorAll('tr.alturallistat td:first-child'))
                .find(td => td.textContent.trim().replace(/\s/g, '') === raCodi);

            if (!td) return;

            const row = td.parentElement;
            const select = row.querySelector('select');

            if (!select) return;

            const options = Array.from(select.options).map(opt => opt.value);
            if (options.includes(valorIntern)) {
                select.value = valorIntern;
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    }


    // FA SCROLL I DESTACA LA MATÈRIA REAL A LA TAULA PRINCIPAL
    function enfocaAssignaturaReal(materia) {
        if (!materia || !materia.codi) return;

        const selector = `td.ng-binding.ng-scope`;
        const targetTd = Array.from(document.querySelectorAll(selector))
            .find(td => td.textContent.includes(`¬(${materia.codi})`));

        if (targetTd) {
            targetTd.scrollIntoView({ behavior: 'smooth', block: 'start' });
            targetTd.style.transition = 'background-color 0.5s ease';
            targetTd.style.backgroundColor = '#ffffcc';
            setTimeout(() => {
                targetTd.style.backgroundColor = '';
            }, 1500);
        } else {
            console.warn(`No s'ha trobat la fila visual per a ${materia.codi}`);
        }
    }

    // CONSTRUEIX LA UI DE LA TAULA DE MATÈRIES
    function creaHTMLMateries(materies) {
        const container = document.createElement('div');
        container.id = 'hola-div';
        Object.assign(container.style, {
            marginBottom: '20px',
            padding: '10px',
            border: '1px solid #ccc',
            backgroundColor: '#f9f9f9'
        });

        const table = document.createElement('table');
        Object.assign(table.style, {
            width: '100%',
            borderCollapse: 'collapse'
        });

        materies.forEach(m => {
            const row = document.createElement('tr');

            // Columna 1: Nom
            const tdNom = document.createElement('td');
            tdNom.textContent = `${m.codi} — ${m.nom}`;
            Object.assign(tdNom.style, {
                width: '30%',
                borderBottom: '1px solid #ddd',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            });

            // Columna 2: Input
            const tdInput = document.createElement('td');
            tdInput.style.width = '60%';
            const input = document.createElement('input');
            input.type = 'text';
            input.style.width = '100%';
            tdInput.appendChild(input);

            // Columna 3: Botó
            const tdButton = document.createElement('td');
            const btn = document.createElement('button');
            btn.textContent = 'Aplica';
            btn.className = 'btn btn-primary';
            btn.addEventListener('click', () => {
                const inputVal = input.value.trim();
                const notes = tradueixNotes(inputVal);

                if (notes && notes.length === m.RAs.length) {
                    aplicaNotesARAs(m.RAs, notes);
                    enfocaAssignaturaReal(m);
                } else {
                    alert(`Error: les notes no són vàlides o no coincideixen amb el nombre de RAs (${m.RAs.length}).`);
                }
            });
            tdButton.appendChild(btn);

            // Construcció de la fila
            row.appendChild(tdNom);
            row.appendChild(tdInput);
            row.appendChild(tdButton);
            table.appendChild(row);
        });

        container.appendChild(table);
        return container;
    }

    // INSEREIX EL DIV GENERAT ABANS DEL FORMULARI
    function insereixDiv(div, abansDe) {
        if (!document.getElementById('hola-div')) {
            abansDe.parentElement.insertBefore(div, abansDe);
        }
    }

    // OBSERVA LA CÀRREGA DINÀMICA DE LA PÀGINA I EXECUTA EL CODI
    const observer = new MutationObserver(() => {
        const form = document.querySelector('form[name="grupAlumne"]');
        const files = document.querySelectorAll('tr.alturallistat');

        if (form && files.length) {
            const materies = analitzaFiles(Array.from(files));
            const html = creaHTMLMateries(materies);
            insereixDiv(html, form);
            observer.disconnect(); // Només una execució
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
