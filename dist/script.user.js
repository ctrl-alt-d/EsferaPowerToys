// ==UserScript==
// @name         Esfer@ PowerToys
// @namespace    https://github.com/ctrl-alt-d/EsferaPowerToys
// @version      1.5.0
// @description  Millores per a la plataforma Esfer@
// @author       ctrl-alt-d
// @license      MIT
// @match        https://bfgh.aplicacions.ensenyament.gencat.cat/bfgh/avaluacio/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/ctrl-alt-d/EsferaPowerToys/refs/heads/main/dist/script.user.js
// @downloadURL  https://raw.githubusercontent.com/ctrl-alt-d/EsferaPowerToys/refs/heads/main/dist/script.user.js
// ==/UserScript==

(() => {
  // src/PowerToysLogger.js
  var PowerToysLogger = class {
    /**
     * Constructor del logger.
     * @param {boolean} debug - Si és true, es mostraran els logs per consola.
     */
    constructor(debug = false) {
      this.debug = debug;
    }
    /**
     * Mostra un missatge de log si el mode debug està activat.
     * @param  {...any} args - Arguments que es passaran a console.log.
     * @returns {void}
     */
    log(...args) {
      if (this.debug) {
        console.log("[PowerToys]", ...args);
      }
    }
    /**
     * Mostra un missatge d’error, sempre, independentment del mode debug.
     * @param  {...any} args - Arguments que es passaran a console.error.
     * @returns {void}
     */
    error(...args) {
      console.error("[PowerToys ERROR]", ...args);
    }
    /**
     * Mostra un missatge d’avís si el mode debug està activat.
     * @param  {...any} args - Arguments que es passaran a console.warn.
     * @returns {void}
     */
    warn(...args) {
      if (this.debug) {
        console.warn("[PowerToys WARNING]", ...args);
      }
    }
    /**
     * Activa o desactiva el mode debug.
     * @param {boolean} value - True per activar, false per desactivar.
     * @returns {void}
     */
    setDebug(value) {
      this.debug = value;
      console.log(`[PowerToys] Debug mode ${value ? "activat" : "desactivat"}`);
    }
  };

  // src/MateriaParser.js
  var MateriaParser = class {
    /**
     * Constructor del parser.
     * @param {PowerToysLogger} logger - Instància del logger per registrar missatges.
     */
    constructor(logger) {
      this.logger = logger;
    }
    /**
     * Analitza les files d’una taula i extreu la llista de matèries i RAs.
     * @param {HTMLElement[]} files - Array de files <tr> de la taula.
     * @returns {Array<{ codi: string, nom: string, RAs: string[] }>} Llista de matèries.
     */
    parse(files) {
      this.logger.log("MateriaParser \u2192 inici");
      const codis = this._extractCodis(files);
      const ras = this._filterRAs(codis);
      const modules = this._detectModules(codis, ras);
      const materies = this._buildMateries(files, modules, ras);
      this.logger.log("MateriaParser \u2192 resultat final:", materies);
      return materies;
    }
    /**
     * Extreu tots els codis de les files.
     * @param {HTMLElement[]} files
     * @returns {string[]} Llista de codis.
     */
    _extractCodis(files) {
      return files.map((row) => {
        var _a;
        return (_a = row.querySelector("td:nth-child(1)")) == null ? void 0 : _a.textContent.trim().replace(/\s/g, "");
      }).filter((codi) => codi);
    }
    /**
     * Filtra els codis que són RAs.
     * @param {string[]} codis
     * @returns {Set<string>} Conjunt de codis RA.
     */
    _filterRAs(codis) {
      const raRegex = /^[A-Z0-9]{4}_[A-Z0-9]+_[0-9]{2}RA$/;
      return new Set(codis.filter((codi) => raRegex.test(codi)));
    }
    /**
     * Detecta quins codis són mòduls (tenen algun RA que comença per ells).
     * @param {string[]} codis
     * @param {Set<string>} ras
     * @returns {Set<string>} Conjunt de codis mòdul.
     */
    _detectModules(codis, ras) {
      const modules = /* @__PURE__ */ new Set();
      codis.forEach((codi) => {
        const prefix = codi + "_";
        for (const ra of ras) {
          if (ra.startsWith(prefix)) {
            modules.add(codi);
            break;
          }
        }
      });
      return modules;
    }
    /**
     * Construeix l’estructura final de matèries.
     * @param {HTMLElement[]} files
     * @param {Set<string>} modules
     * @param {Set<string>} ras
     * @returns {Array<{ codi: string, nom: string, RAs: string[] }>}
     */
    _buildMateries(files, modules, ras) {
      return Array.from(modules).map((modulCodi) => {
        var _a;
        const row = files.find((r) => {
          const cell = r.querySelector("td:nth-child(1)");
          return cell && cell.textContent.trim().replace(/\s/g, "") === modulCodi;
        });
        const nom = ((_a = row == null ? void 0 : row.querySelector("td:nth-child(2)")) == null ? void 0 : _a.textContent.trim()) || "";
        const raList = Array.from(ras).filter((ra) => ra.startsWith(modulCodi + "_"));
        return { codi: modulCodi, nom, RAs: raList };
      });
    }
  };

  // src/MateriaUIBuilder.js
  var MateriaUIBuilder = class {
    /**
     * Constructor del builder.
     * @param {PowerToysLogger} logger - Instància del logger per registrar missatges.
     * @param {function} onApply - Callback a executar quan es fa clic al botó "Aplica".
     * Ha de rebre (materia, inputValue).
     * @param {string} version - Número de versió de l'script (ex: "1.2.0").
     */
    constructor(logger, onApply, version2 = "") {
      this.logger = logger;
      this.onApply = onApply;
      this.version = version2;
    }
    /**
     * Crea l’estructura HTML per mostrar totes les matèries,
     * incloent un text de versió alineat a la dreta.
     * @param {Array<{ codi: string, nom: string, RAs: string[] }>} materies - Llista de matèries.
     * @returns {HTMLElement} Div HTML amb el contingut generat.
     */
    createHTML(materies) {
      this.logger.log("MateriaUIBuilder \u2192 inici");
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
        this.logger.log(`MateriaUIBuilder \u2192 afegint fila per: ${m.codi}`);
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
          this.logger.log(`MateriaUIBuilder \u2192 clic Aplica per ${m.codi}, valor: ${inputVal}`);
          this.onApply(m, inputVal);
        });
        tdButton.appendChild(btn);
        row.appendChild(tdNom);
        row.appendChild(tdInput);
        row.appendChild(tdButton);
        table.appendChild(row);
      });
      container.appendChild(table);
      if (this.version) {
        const versionDiv = document.createElement("div");
        versionDiv.textContent = `versi\xF3: ${this.version}`;
        Object.assign(versionDiv.style, {
          textAlign: "right",
          fontSize: "0.8em",
          marginTop: "8px",
          color: "#666"
        });
        container.appendChild(versionDiv);
        this.logger.log(`MateriaUIBuilder \u2192 mostrant versi\xF3: ${this.version}`);
      }
      this.logger.log("MateriaUIBuilder \u2192 container creat");
      return container;
    }
    /**
     * Insereix el div generat abans d’un element concret del DOM.
     * Si ja existeix un div amb id 'powertoy-div', l’elimina.
     * @param {HTMLElement} div - L’element HTML a inserir.
     * @param {HTMLElement} abansDe - L’element davant del qual s’inserirà.
     * @returns {void}
     */
    insertDiv(div, abansDe) {
      this.logger.log("MateriaUIBuilder \u2192 intentant inserir div");
      const existent = document.getElementById("powertoy-div");
      if (existent) {
        this.logger.log("MateriaUIBuilder \u2192 eliminant existent");
        existent.remove();
      }
      abansDe.parentElement.insertBefore(div, abansDe);
      this.logger.log("MateriaUIBuilder \u2192 div inserit");
    }
  };

  // src/MateriaApplier.js
  var MateriaApplier = class {
    /**
     * Constructor de l’applier.
     * @param {PowerToysLogger} logger - Instància del logger per registrar missatges.
     */
    constructor(logger) {
      this.logger = logger;
    }
    /**
     * Converteix el text d’entrada a un array de codis interns de notes.
     * @param {string} text - Text d’entrada separat per espais (ex: "9 8,5 6 NA").
     * @returns {string[]|null} Array amb codis (ex: ["A10", "A9", "A7", "NA"]) o null si error.
     */
    tradueixNotes(text) {
      if (!text || typeof text !== "string") return null;
      const valors = text.trim().replace(/\t/g, " ").replace(/\s+/g, " ").split(" ");
      const tradu\u00EFdes = valors.map((v) => {
        const vNet = v.replace(",", ".").trim().toUpperCase();
        if (vNet === "" || vNet === "." || vNet === "X") return "";
        if (/^A(10|[5-9])$|^NA$|^EP$|^PDT$/.test(vNet)) return vNet;
        if (vNet.startsWith("PENDENT")) return "PDT";
        const num = parseFloat(vNet);
        if (isNaN(num)) return null;
        if (num >= 9.5) return "A10";
        if (num >= 8.5) return "A9";
        if (num >= 7.5) return "A8";
        if (num >= 6.5) return "A7";
        if (num >= 5.5) return "A6";
        if (num >= 4.5) return "A5";
        return "NA";
      });
      if (tradu\u00EFdes.includes(null)) {
        this.logger.warn("MateriaApplier \u2192 error en traduir notes:", valors);
        return null;
      }
      this.logger.log("MateriaApplier \u2192 notes tradu\xEFdes:", tradu\u00EFdes);
      return tradu\u00EFdes;
    }
    /**
     * Aplica les notes traduïdes als RAs corresponents de la matèria.
     * @param {string[]} raCodiList - Llista de codis RA.
     * @param {string[]} valors - Llista de valors interns (ex: "A10").
     * @returns {void}
     */
    aplicaNotesARAs(raCodiList, valors) {
      if (!Array.isArray(valors) || valors.length !== raCodiList.length) {
        this.logger.warn("MateriaApplier \u2192 la mida de valors no coincideix amb els RAs");
        return;
      }
      raCodiList.forEach((raCodi, index) => {
        const nota = valors[index];
        const valorIntern = nota ? `string:${nota}` : "";
        const td = Array.from(document.querySelectorAll("tr.alturallistat td:first-child")).find((td2) => td2.textContent.trim().replace(/\s/g, "") === raCodi);
        if (!td) {
          this.logger.warn(`MateriaApplier \u2192 no trobat td per RA: ${raCodi}`);
          return;
        }
        const row = td.parentElement;
        const select = row.querySelector("select");
        if (!select) {
          this.logger.warn(`MateriaApplier \u2192 no trobat select per RA: ${raCodi}`);
          return;
        }
        if (Array.from(select.options).map((opt) => opt.value).includes(valorIntern)) {
          select.value = valorIntern;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          this.logger.log(`MateriaApplier \u2192 aplicat ${valorIntern} a ${raCodi}`);
        } else {
          this.logger.warn(`MateriaApplier \u2192 valor no v\xE0lid per ${raCodi}: ${valorIntern}`);
        }
      });
    }
  };

  // src/ScrollHelper.js
  var ScrollHelper = class {
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
        this.logger.warn("ScrollHelper \u2192 materia nul\xB7la o sense codi");
        return;
      }
      const selector = "td.ng-binding.ng-scope";
      const targetTd = Array.from(document.querySelectorAll(selector)).find((td) => td.textContent.includes(`\xAC(${materia.codi})`));
      if (targetTd) {
        this.logger.log(`ScrollHelper \u2192 trobada fila visual per ${materia.codi}, fent scroll`);
        targetTd.scrollIntoView({ behavior: "smooth", block: "start" });
        targetTd.style.transition = "background-color 0.5s ease";
        targetTd.style.backgroundColor = "#ffffcc";
        setTimeout(() => {
          targetTd.style.backgroundColor = "";
        }, 1500);
      } else {
        this.logger.warn(`ScrollHelper \u2192 no s'ha trobat la fila visual per ${materia.codi}`);
      }
    }
  };

  // build/version.js
  var version = "1.5.0";

  // src/PowerToysController.js
  var PowerToysController = class {
    /**
     * Constructor del controlador principal.
     * Inicialitza els components auxiliars i arrenca l'observador.
     */
    constructor() {
      this.logger = new PowerToysLogger(true);
      this.parser = new MateriaParser(this.logger);
      this.applier = new MateriaApplier(this.logger);
      this.scrollHelper = new ScrollHelper(this.logger);
      this.uiBuilder = new MateriaUIBuilder(this.logger, (materia, inputVal) => this.onApply(materia, inputVal), version);
      this.lastStudent = "";
      this.reinicialitzaTimeout = null;
      const mainContainer = document.querySelector("#mainView") || document.body;
      this.observer = new MutationObserver(() => this.reinicialitza());
      this.observer.observe(mainContainer, { childList: true, subtree: true });
      this.logger.log("PowerToysController \u2192 Observer activat");
    }
    /**
     * Callback quan es fa clic a "Aplica" a la interfície.
     * @param {{ codi: string, nom: string, RAs: string[] }} materia - La matèria seleccionada.
     * @param {string} inputVal - El valor introduït per l’usuari.
     * @returns {void}
     */
    onApply(materia, inputVal) {
      this.logger.log(`PowerToysController \u2192 onApply per ${materia.codi}: ${inputVal}`);
      const notes = this.applier.tradueixNotes(inputVal);
      if (notes && notes.length === materia.RAs.length) {
        this.applier.aplicaNotesARAs(materia.RAs, notes);
        this.scrollHelper.enfocaAssignatura(materia);
      } else {
        alert(`Error: les notes no s\xF3n v\xE0lides o no coincideixen amb el nombre de RAs (${materia.RAs.length}).`);
      }
    }
    /**
     * Reinicialitza el sistema quan es detecten canvis al DOM.
     * @returns {void}
     */
    reinicialitza() {
      this.logger.log("reinicialitza \u2192 inici");
      clearTimeout(this.reinicialitzaTimeout);
      this.reinicialitzaTimeout = setTimeout(() => {
        const form = document.querySelector('form[name="grupAlumne"]');
        const files = document.querySelectorAll("tr.alturallistat");
        if (!form || files.length === 0) {
          this.logger.log("reinicialitza \u2192 no hi ha form o files, esperant...");
          return;
        }
        const breadcrumb = document.querySelector(".breadcrumb li:last-child a");
        const studentName = breadcrumb ? breadcrumb.textContent.trim() : "";
        if (studentName === this.lastStudent) {
          this.logger.log("reinicialitza \u2192 mateix alumne, saltant");
          return;
        }
        this.lastStudent = studentName;
        this.logger.log(`reinicialitza \u2192 processant alumne: ${studentName}`);
        const materies = this.parser.parse(Array.from(files));
        const html = this.uiBuilder.createHTML(materies);
        this.uiBuilder.insertDiv(html, form);
      }, 100);
    }
  };

  // src/main.js
  (function() {
    "use strict";
    const controller = new PowerToysController();
    window.PowerToysController = controller;
  })();
})();
