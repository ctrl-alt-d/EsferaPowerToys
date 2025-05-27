// ==UserScript==
// @name         Esfer@ PowerToys
// @namespace    https://github.com/ctrl-alt-d/EsferaPowerToys
// @version      1.2.0
// @description  Millores per a la plataforma Esfer@
// @author       ctrl-alt-d
// @license      MIT
// @match        https://bfgh.aplicacions.ensenyament.gencat.cat/bfgh/avaluacio/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/ctrl-alt-d/EsferaPowerToys/refs/heads/main/dist/script.user.js
// @downloadURL  https://raw.githubusercontent.com/ctrl-alt-d/EsferaPowerToys/refs/heads/main/dist/script.user.js
// ==/UserScript==

(() => {
  // src/main.js
  (function() {
    "use strict";
    const DEBUG = true;
    const PowerToysUtils = {
      log: (...args) => {
        if (DEBUG) console.log("[PowerToys]", ...args);
      },
      analitzaFiles(files) {
        this.log("analitzaFiles \u2192 inici");
        const materies = [];
        let actual = null;
        files.forEach((row) => {
          const codiCell = row.querySelector("td:nth-child(1)");
          const nomCell = row.querySelector("td:nth-child(2)");
          if (!codiCell || !nomCell) return;
          const codi = codiCell.textContent.trim().replace(/\s/g, "");
          const nom = nomCell.textContent.trim();
          this.log(`analitzaFiles \u2192 codi detectat: ${codi}`);
          if (/^[0-9]{4}_[A-Z0-9]+$/.test(codi)) {
            actual = { codi, nom, RAs: [] };
            materies.push(actual);
          } else if (/^[0-9]{4}_[A-Z0-9]+_[0-9]{2}RA$/.test(codi) && actual) {
            actual.RAs.push(codi);
          }
        });
        this.log(`analitzaFiles \u2192 materies trobades:`, materies);
        return materies;
      },
      creaHTMLMateries(materies) {
        this.log("creaHTMLMateries \u2192 inici");
        const container = document.createElement("div");
        container.id = "powertoy-div";
        Object.assign(container.style, {
          marginBottom: "20px",
          padding: "10px",
          border: "1px solid #ccc",
          backgroundColor: "#f9f9f9"
        });
        const table = document.createElement("table");
        Object.assign(table.style, { width: "100%", borderCollapse: "collapse" });
        materies.forEach((m) => {
          this.log(`creaHTMLMateries \u2192 afegint materia: ${m.codi}`);
          const row = document.createElement("tr");
          const tdNom = document.createElement("td");
          tdNom.textContent = `${m.codi} \u2014 ${m.nom}`;
          Object.assign(tdNom.style, {
            width: "30%",
            borderBottom: "1px solid #ddd",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          });
          const tdInput = document.createElement("td");
          tdInput.style.width = "60%";
          const input = document.createElement("input");
          input.type = "text";
          input.style.width = "100%";
          tdInput.appendChild(input);
          const tdButton = document.createElement("td");
          const btn = document.createElement("button");
          btn.textContent = "Aplica";
          btn.className = "btn btn-primary";
          btn.addEventListener("click", () => {
            const inputVal = input.value.trim();
            const notes = PowerToysUtils.tradueixNotes(inputVal);
            if (notes && notes.length === m.RAs.length) {
              PowerToysUtils.aplicaNotesARAs(m.RAs, notes);
              PowerToysUtils.enfocaAssignaturaReal(m);
            } else {
              alert(`Error: les notes no s\xF3n v\xE0lides o no coincideixen amb el nombre de RAs (${m.RAs.length}).`);
            }
          });
          tdButton.appendChild(btn);
          row.appendChild(tdNom);
          row.appendChild(tdInput);
          row.appendChild(tdButton);
          table.appendChild(row);
        });
        container.appendChild(table);
        this.log("creaHTMLMateries \u2192 container creat");
        return container;
      },
      insereixDiv(div, abansDe) {
        this.log("insereixDiv \u2192 intentant inserir div");
        const existent = document.getElementById("powertoy-div");
        if (existent) {
          this.log("insereixDiv \u2192 eliminant existent");
          existent.remove();
        }
        abansDe.parentElement.insertBefore(div, abansDe);
        this.log("insereixDiv \u2192 div inserit");
      }
    };
    let lastStudent = "";
    let reinicialitzaTimeout;
    function reinicialitza() {
      console.log("[PowerToys] reinicialitza \u2192 inici");
      clearTimeout(reinicialitzaTimeout);
      reinicialitzaTimeout = setTimeout(() => {
        const form = document.querySelector('form[name="grupAlumne"]');
        const files = document.querySelectorAll("tr.alturallistat");
        if (!form || files.length === 0) {
          PowerToysUtils.log("reinicialitza \u2192 no hi ha form o files, esperant...");
          return;
        }
        const breadcrumb = document.querySelector(".breadcrumb li:last-child a");
        const studentName = breadcrumb ? breadcrumb.textContent.trim() : "";
        if (studentName === lastStudent) {
          PowerToysUtils.log("reinicialitza \u2192 mateix alumne, saltant");
          return;
        }
        lastStudent = studentName;
        PowerToysUtils.log(`reinicialitza \u2192 processant alumne: ${studentName}`);
        const materies = PowerToysUtils.analitzaFiles(Array.from(files));
        const html = PowerToysUtils.creaHTMLMateries(materies);
        PowerToysUtils.insereixDiv(html, form);
      }, 100);
    }
    const mainContainer = document.querySelector("#mainView") || document.body;
    const observer = new MutationObserver(() => reinicialitza());
    observer.observe(mainContainer, { childList: true, subtree: true });
    PowerToysUtils.log("Observer activat!");
  })();
})();
