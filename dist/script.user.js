// ==UserScript==
// @name         Esfer@ PowerToys
// @namespace    https://github.com/ctrl-alt-d/EsferaPowerToys
// @version      1.1.0
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

    const DEBUG = false; // Canvia a true per veure logs

    const PowerToysUtils = {
        log: (...args) => { if (DEBUG) console.log('[PowerToys]', ...args); },

        analitzaFiles(files) {
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
        },

        tradueixNotes(text) {
            if (!text || typeof text !== 'string') return null;

            const valors = text.trim().replace(/\t/g, ' ').replace(/\s+/g, ' ').split(' ');

            const traduïdes = valors.map(v => {
                const vNet = v.replace(',', '.').trim().toUpperCase();
                if (vNet === '' || vNet === '.' || vNet === 'X') return '';
                if (/^A(10|[5-9])$|^NA$|^EP$|^PDT$/.test(vNet)) return vNet;
                if (vNet.startsWith('PENDENT')) return 'PDT';
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
        },

        aplicaNotesARAs(raCodiList, valors) {
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
                if (Array.from(select.options).map(opt => opt.value).includes(valorIntern)) {
                    select.value = valorIntern;
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        },

        enfocaAssignaturaReal(materia) {
            if (!materia || !materia.codi) return;

            const selector = 'td.ng-binding.ng-scope';
            const targetTd = Array.from(document.querySelectorAll(selector))
                .find(td => td.textContent.includes(`¬(${materia.codi})`));

            if (targetTd) {
                targetTd.scrollIntoView({ behavior: 'smooth', block: 'start' });
                targetTd.style.transition = 'background-color 0.5s ease';
                targetTd.style.backgroundColor = '#ffffcc';
                setTimeout(() => targetTd.style.backgroundColor = '', 1500);
            } else {
                this.log(`No s'ha trobat la fila visual per a ${materia.codi}`);
            }
        },

        creaHTMLMateries(materies) {
            const container = document.createElement('div');
            container.id = 'powertoy-div';
            Object.assign(container.style, {
                marginBottom: '20px',
                padding: '10px',
                border: '1px solid #ccc',
                backgroundColor: '#f9f9f9'
            });

            const table = document.createElement('table');
            Object.assign(table.style, { width: '100%', borderCollapse: 'collapse' });

            materies.forEach(m => {
                const row = document.createElement('tr');

                const tdNom = document.createElement('td');
                tdNom.textContent = `${m.codi} — ${m.nom}`;
                Object.assign(tdNom.style, {
                    width: '30%', borderBottom: '1px solid #ddd',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                });

                const tdInput = document.createElement('td');
                tdInput.style.width = '60%';
                const input = document.createElement('input');
                input.type = 'text';
                input.style.width = '100%';
                tdInput.appendChild(input);

                const tdButton = document.createElement('td');
                const btn = document.createElement('button');
                btn.textContent = 'Aplica';
                btn.className = 'btn btn-primary';
                btn.addEventListener('click', () => {
                    const inputVal = input.value.trim();
                    const notes = PowerToysUtils.tradueixNotes(inputVal);
                    if (notes && notes.length === m.RAs.length) {
                        PowerToysUtils.aplicaNotesARAs(m.RAs, notes);
                        PowerToysUtils.enfocaAssignaturaReal(m);
                    } else {
                        alert(`Error: les notes no són vàlides o no coincideixen amb el nombre de RAs (${m.RAs.length}).`);
                    }
                });
                tdButton.appendChild(btn);

                row.appendChild(tdNom);
                row.appendChild(tdInput);
                row.appendChild(tdButton);
                table.appendChild(row);
            });

            container.appendChild(table);
            return container;
        },

        insereixDiv(div, abansDe) {
            const existent = document.getElementById('powertoy-div');
            if (existent) existent.remove();
            abansDe.parentElement.insertBefore(div, abansDe);
        }
    };

    let lastStudent = '';
    let reinicialitzaTimeout;

    function reinicialitza() {
        clearTimeout(reinicialitzaTimeout);
        reinicialitzaTimeout = setTimeout(() => {
            const form = document.querySelector('form[name="grupAlumne"]');
            const files = document.querySelectorAll('tr.alturallistat');
            if (!form || files.length === 0) {
                PowerToysUtils.log('Encara no hi ha files, esperant...');
                return;
            }

            const breadcrumb = document.querySelector('.breadcrumb li:last-child a');
            const studentName = breadcrumb ? breadcrumb.textContent.trim() : '';
            if (studentName === lastStudent) return;
            lastStudent = studentName;

            PowerToysUtils.log(`Processant alumne: ${studentName}`);
            const materies = PowerToysUtils.analitzaFiles(Array.from(files));
            const html = PowerToysUtils.creaHTMLMateries(materies);
            PowerToysUtils.insereixDiv(html, form);
        }, 100);
    }

    const mainContainer = document.querySelector('#mainView') || document.body;
    const observer = new MutationObserver(() => reinicialitza());
    observer.observe(mainContainer, { childList: true, subtree: true });

    PowerToysUtils.log('Observer activat!');
})();
