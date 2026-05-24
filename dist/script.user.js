// ==UserScript==
// @name         Esfer@ PowerToys
// @namespace    https://github.com/ctrl-alt-d/EsferaPowerToys
// @version      1.11.0
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
      return materies;
    }
    /**
     * Extreu tots els codis de les files.
     * @param {HTMLElement[]} files
     * @returns {string[]} Llista de codis.
     */
    _extractCodis(files) {
      return files.map((row) => row.querySelector("td:nth-child(1)")?.textContent.trim().replace(/\s/g, "")).filter((codi) => codi);
    }
    /**
     * Filtra els codis que són RAs.
     * @param {string[]} codis
     * @returns {Set<string>} Conjunt de codis RA.
     */
    _filterRAs(codis) {
      const raRegex = /^[A-z0-9]{2,4}_[A-Z0-9]+_[0-9]{0,2}RA[0-9]{0,2}$/;
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
        const row = files.find((r) => {
          const cell = r.querySelector("td:nth-child(1)");
          return cell && cell.textContent.trim().replace(/\s/g, "") === modulCodi;
        });
        const nom = row?.querySelector("td:nth-child(2)")?.textContent.trim() || "";
        const raList = Array.from(ras).filter((ra) => ra.startsWith(modulCodi + "_"));
        return { codi: modulCodi, nom, RAs: raList };
      });
    }
  };

  // src/MateriaUIBuilder.js
  var MateriaUIBuilder = class {
    /**
     * @param {PowerToysLogger} logger - Instància del logger.
     * @param {function} onApply - Callback per aplicar notes (materia, inputVal).
     * @param {function} onPosaPendents - Callback per posar pendents les RA buides (materia).
     * @param {import('./ContainerUIBuilder.js').ContainerUIBuilder} containerBuilder - Constructor base del contenidor.
     */
    constructor(logger, onApply, onPosaPendents, containerBuilder) {
      this.logger = logger;
      this.onApply = onApply;
      this.onPosaPendents = onPosaPendents;
      this.containerBuilder = containerBuilder;
    }
    createHTML(materies) {
      this.logger.log("MateriaUIBuilder \u2192 inici");
      const tableWrapper = document.createElement("div");
      tableWrapper.className = "powertoy-table-wrapper";
      tableWrapper.style.cssText = `
            max-width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
        `;
      const table = document.createElement("table");
      table.classList.add("powertoy-table");
      table.style.cssText = "width: 98%; border-collapse: collapse; min-width: 320px;";
      const fieldset = document.querySelector("div.main div.ng-scope fieldset.ng-scope");
      const isDisabled = fieldset && fieldset.disabled;
      if (!isDisabled) {
        console.log("materies" + materies);
        materies.forEach((m) => {
          this.logger.log(`MateriaUIBuilder \u2192 afegint fila per: ${m.codi}`);
          const row = document.createElement("tr");
          const tdNom = document.createElement("td");
          tdNom.textContent = `${m.codi} \u2014 ${m.nom}`;
          Object.assign(tdNom.style, {
            borderBottom: "1px solid #ddd",
            whiteSpace: "nowrap",
            padding: "8px 4px",
            textAlign: "left"
          });
          row.appendChild(tdNom);
          const tdInput = document.createElement("td");
          tdInput.style.minWidth = "180px";
          const input = document.createElement("input");
          input.type = "text";
          input.style.width = "100%";
          input.style.boxSizing = "border-box";
          tdInput.appendChild(input);
          const tdButton = document.createElement("td");
          tdButton.style.minWidth = "140px";
          const btn = document.createElement("button");
          btn.textContent = "Aplica";
          btn.className = "btn btn-primary";
          btn.style.width = "max-content";
          btn.addEventListener("click", () => {
            const inputVal = input.value.trim();
            this.logger.log(`MateriaUIBuilder \u2192 clic Aplica per ${m.codi}, valor: ${inputVal}`);
            this.onApply(m, inputVal);
          });
          tdButton.appendChild(btn);
          row.appendChild(tdInput);
          row.appendChild(tdButton);
          table.appendChild(row);
          const btnPendent = document.createElement("button");
          btnPendent.textContent = "Posar pendent";
          btnPendent.className = "btn btn-warning btn-sm";
          btnPendent.style.marginLeft = "4px";
          btnPendent.style.width = "max-content;";
          btnPendent.addEventListener("click", () => {
            this.onPosaPendents(m);
          });
          tdButton.appendChild(btnPendent);
        });
      }
      tableWrapper.appendChild(table);
      this.logger.log("MateriaUIBuilder \u2192 component creat");
      return this.containerBuilder.createContainer(tableWrapper, "powertoy-div");
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
        if (vNet.startsWith("PENDENT") || vNet === "NP") return "PDT";
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
        if (select.disabled) {
          this.logger.warn(`MateriaApplier \u2192 select desactivat per RA: ${raCodi}`);
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
  var version = "1.11.0";

  // src/CSSApplier.js
  var CSSApplier = class {
    constructor(logger) {
      this.logger = logger;
      this.injectStyles();
    }
    injectStyles() {
      if (document.getElementById("powertoy-styles")) return;
      const style = document.createElement("style");
      style.id = "powertoy-styles";
      style.textContent = `
            .powertoy-pass { background-color: #d4edda !important; }
            .powertoy-fail { background-color: #f8d7da !important; }
            .powertoy-pendent { background-color: #d1ecf1 !important; }
            .powertoy-proces { background-color: #fff3cd !important; }
            .powertoy-pq { background-color: #d1ecf1 !important; }
            .powertoy-pass select,
            .powertoy-fail select,
            .powertoy-pendent select,
            .powertoy-proces select,
            .powertoy-pq select {
                background-color: inherit !important;
            }

            /* 1. For\xE7a l'al\xE7ada del fieldset relativa a l'al\xE7ada real de la finestra */
            fieldset.col-md-12.bordure {
                padding: 0 !important;
                height: calc(100vh - 250px) !important;
                max-height: calc(100vh - 190px) !important;
                overflow-y: auto !important;
                display: block !important;
                box-sizing: border-box !important;
            }

            /* 2. Elimina l'al\xE7ada fixa injectada per JS i deixa que ocupi tot l'espai disponible */
            fieldset.col-md-12.bordure .container-auto-resize {
                height: auto !important;
                max-height: none !important;
                flex: 1 !important;
                min-height: 0 !important;
                overflow: visible !important;
            }

            /* 3. Assegura que la taula no generi desbordaments horitzontals que trenquin el layout */
            fieldset.col-md-12.bordure table.grades-table {
                min-width: 0 !important;
                table-layout: fixed !important;
            }
        `;
      document.head.appendChild(style);
      this.logger.log("CSSApplier \u2192 estils injectats");
    }
    aplicaEstils() {
      const selects = document.querySelectorAll("tr.alturallistat select");
      selects.forEach((select) => {
        const tr = select.closest("tr");
        if (!tr) return;
        tr.classList.remove("powertoy-pass", "powertoy-fail", "powertoy-pendent", "powertoy-proces");
        if (!select.value) {
          this.logger.log("CSSApplier \u2192 buit, no es pinta");
          return;
        }
        const value = select.value.replace("string:", "").toUpperCase();
        if (value === "PDT" || value === "PQ") {
          tr.classList.add("powertoy-pendent");
        } else if (value === "EP") {
          tr.classList.add("powertoy-proces");
        } else if (value === "NA") {
          tr.classList.add("powertoy-fail");
        } else if (/A(10|[5-9])/.test(value)) {
          tr.classList.add("powertoy-pass");
        } else {
          this.logger.warn(`CSSApplier \u2192 valor desconegut: ${value}`);
        }
      });
    }
  };

  // src/CSVManager.js
  var CSVManager = class {
    /**
     * @param {import('./PowerToysLogger.js').PowerToysLogger} logger
     */
    constructor(logger) {
      this.logger = logger;
    }
    /**
     * Inicia i coordina el procés de descàrrega
     * @returns {Promise<void>}
     */
    async proc\u00E9sDesc\u00E0rregaCSV(evaluation = 1) {
      this.logger.log("CSVManager \u2192 proc\xE9sDesc\xE0rregaCSV inici");
      const idGrup = this.extractIdGrup();
      if (idGrup === null) {
        this.logger.error("CSVManager \u2192 No s'ha pogut extreure idGrup");
        return;
      }
      var element = document.documentElement;
      var injector = window.angular ? window.angular.element(element).injector() : null;
      if (!injector) {
        this.logger.error(
          "CSVManager \u2192 No s'ha pogut obtenir l'injector. Potser Angular no est\xE0 bootstrapat encara."
        );
        return;
      }
      var factory = injector.get("newFinalAvaluacioGrupAlumneFactory");
      var matricules = await this.extractIdMatricula(factory, idGrup);
      if (!matricules || matricules.length === 0) {
        this.logger.error("CSVManager \u2192 No hi ha matricules per recuperar");
        return;
      }
      const nomGrup = matricules[0].nomGrup;
      try {
        const tasks = matricules.map(
          (alumne, idx) => () => new Promise(async (resolve) => {
            const idMat = alumne.idMatricula;
            if (!idMat || !idGrup) {
              this.logger.warn(`CSVManager \u2192 Alumne ${alumne.nomComplet} sense IDs \u2192 saltant`);
              return resolve({ skipped: true, nom: alumne.nomComplet });
            }
            try {
              this.logger.log(`CSVManager \u2192 \u23F3 [${idx + 1}/${matricules.length}] Carregant ${alumne.nomComplet}...`);
              const dadesAlumne = await this.fetchAvaluacioData(factory, idMat, idGrup);
              if (!dadesAlumne || !dadesAlumne.lContinguts) {
                this.logger.warn(`CSVManager \u2192 No s'han rebut dades per ${alumne.nomComplet}`);
                return resolve({ skipped: true, nom: alumne.nomComplet });
              }
              resolve({
                success: true,
                idAlumne: alumne.identificadorAlumne,
                idMatricula: idMat,
                nom: alumne.nomComplet,
                notes: dadesAlumne.lContinguts,
                avaluacions: dadesAlumne.lAvaluacions
              });
            } catch (err) {
              this.logger.error(`CSVManager \u2192 Error amb ${alumne.nomComplet}:`, err);
              resolve({ error: true, nom: alumne.nomComplet, err });
            }
          })
        );
        const config = {
          concurrency: 1,
          // maxim peticions alhora
          limit: Infinity,
          // Màxim de peticions per interval
          interval: 500
          // Interval entre peticions en ms (1000 = 1 segon)
        };
        const notesAlumnes = await executeQueue(tasks, config);
        this.descarregaCSV(notesAlumnes, evaluation, nomGrup);
      } catch (error) {
        this.logger.error("Error cr\xEDtic al CSVManager:", error);
      }
    }
    /**
     * Genera i descarrega un CSV amb totes les notes del grup
     * @param {Array<Object>} dadesAlumnes
     */
    descarregaCSV(dadesAlumnes, evaluation, nomGrup) {
      const csvEscape = (val) => {
        const str = String(val ?? "");
        return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str.replace(/"/g, '""')}"` : str;
      };
      const getNotesAvaluacioSeleccionada = (alumne) => {
        let idAvaluacio = null;
        const targetCodi = `FINAL_${evaluation}`;
        if (alumne.avaluacions && Array.isArray(alumne.avaluacions)) {
          const ava = alumne.avaluacions.find((a) => a.codiExternAva === targetCodi);
          if (ava) {
            idAvaluacio = ava.id;
          }
        }
        if (idAvaluacio && alumne.notes[idAvaluacio]) {
          return alumne.notes[idAvaluacio];
        }
        const notesValues = Object.values(alumne.notes);
        return notesValues.at(-2) || notesValues.at(-1) || [];
      };
      const alumnesValids = dadesAlumnes.filter((a) => a && a.notes);
      const moduls = /* @__PURE__ */ new Map();
      alumnesValids.forEach((alumne) => {
        const notes = getNotesAvaluacioSeleccionada(alumne);
        if (!notes || !Array.isArray(notes)) return;
        notes.forEach((mod) => {
          if (!mod || !mod.codiExternContingut) return;
          if (!moduls.has(mod.codiExternContingut)) {
            moduls.set(mod.codiExternContingut, {
              nom: mod.nom || mod.codiExternContingut || "Sense nom",
              jerarquia: mod.jerarquia || "0"
            });
          }
        });
      });
      const modulsArray = Array.from(moduls.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      const header1 = ["", ""];
      const header2 = ["idAlumne", "nom"];
      modulsArray.forEach(([codi, info]) => {
        if (info.jerarquia == "2") {
          header1.push(csvEscape(info.nom));
          header2.push(csvEscape(codi));
        } else {
          header1.push("");
          header2.push(csvEscape(codi));
        }
      });
      const files = alumnesValids.map((alumne) => {
        const notes = getNotesAvaluacioSeleccionada(alumne);
        const fila = [csvEscape(alumne.idAlumne), csvEscape(alumne.nom)];
        modulsArray.forEach(([codi]) => {
          let modData = null;
          if (Array.isArray(notes)) {
            modData = notes.find((m) => m.codiExternContingut == codi);
          }
          try {
            if (modData && modData.qualitativa) {
              if (/^A\d{1,2}$/.test(modData.qualitativa)) {
                fila.push(csvEscape(modData.qualitativa.replace(/\D/g, "")));
              } else {
                fila.push(csvEscape(modData.qualitativa));
              }
            } else if (modData && modData.jerarquia == 2 && modData.quantitativa) {
              fila.push(modData.quantitativa);
            } else {
              fila.push("");
            }
          } catch {
            fila.push("");
          }
        });
        return fila;
      });
      const csvContent = [
        header1.join(","),
        header2.join(","),
        ...files.map((f) => f.join(","))
      ].join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Esfera_Notes_av_${evaluation}_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}_${nomGrup}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      this.logger.log("CSVManager \u2192 CSV descarregat correctament");
    }
    /**
     * @param {Object} factory
     * @param {number} idGrup
     * @returns {Promise<Array|null>}
     */
    extractIdMatricula(factory, idGrup) {
      this.logger.log("CSVManager \u2192 inici idMatricula");
      var injector = window.angular ? window.angular.element(document.documentElement).injector() : null;
      if (!injector) {
        this.logger.error("CSVManager \u2192 Injector Angular no disponible");
        return Promise.resolve(null);
      }
      var factoryGrup = injector.get("finalavaluaciogrupalumneFactory");
      return factoryGrup.getGrupClasseById(idGrup).then((resGrup) => {
        var fkGrup = resGrup.data.fkGrup;
        return factory.getAlumnesGrupById(fkGrup);
      }).then((resAlumnes) => {
        var matricules = resAlumnes.data.matriculesGrupDTOList;
        return matricules;
      }).catch((err) => {
        this.logger.error("CSVManager \u2192 Error obtenint el grup:", err);
        return null;
      });
    }
    /**
     * @returns {number|null}
     */
    extractIdGrup() {
      const url_grup = new URL(window.location.href).href;
      const grup = url_grup.replace(/\/+$/, "").split("/").pop().match(/\d+/);
      return grup ? parseInt(grup[0], 10) : null;
    }
    /**
     * @param {Object} factory
     * @param {string|number} idMat
     * @param {number} idGrup
     * @returns {Promise<object>}
     */
    async fetchAvaluacioData(factory, idMat, idGrup) {
      return factory.obtenirDadesGrupIAlumneFinal(idMat, idGrup).then(function(res) {
        var dadesAlumne = res.data.avaluacioGrupIAlumneWrapper;
        return dadesAlumne;
      }).catch((err) => {
        this.logger.error("CSVManager \u2192 ERROR EN LA PETICI\xD3:", err);
      });
    }
  };
  async function executeQueue(tasks, {
    concurrency = Infinity,
    limit = Infinity,
    interval = 0
  } = {}) {
    const results = new Array(tasks.length);
    const queue = tasks.map((task, index) => ({ task, index }));
    let activeCount = 0;
    let launchedInInterval = 0;
    let lastIntervalStart = Date.now();
    return new Promise((resolve) => {
      const next = async () => {
        if (queue.length === 0 && activeCount === 0) {
          return resolve(results);
        }
        const now = Date.now();
        if (interval > 0 && now - lastIntervalStart >= interval) {
          launchedInInterval = 0;
          lastIntervalStart = now;
        }
        while (queue.length > 0) {
          if (activeCount >= concurrency) break;
          if (interval > 0 && launchedInInterval >= limit) {
            const delay = interval - (Date.now() - lastIntervalStart);
            setTimeout(next, Math.max(0, delay));
            return;
          }
          const { task, index } = queue.shift();
          activeCount++;
          launchedInInterval++;
          (async (i) => {
            try {
              results[i] = await task();
            } catch (err) {
              results[i] = err;
            } finally {
              activeCount--;
              next();
            }
          })(index);
        }
      };
      next();
    });
  }

  // src/CSVUIBuilder.js
  var MAX_AVALUACIONS = 3;
  var CSVUIBuilder = class {
    /**
     * @param {import('./PowerToysLogger.js').PowerToysLogger} logger
     * @param {function} onDownload Callback activat a l'apretar el botó de CSV
     * @param {import('./ContainerUIBuilder.js').ContainerUIBuilder} containerBuilder - Constructor base del contenidor.
     */
    constructor(logger, onDownload, containerBuilder) {
      this.logger = logger;
      this.onDownload = onDownload;
      this.containerBuilder = containerBuilder;
    }
    /**
     * Insereix automàticament el panell informatiu o actualitza la vista si s'està carregant la taula admesa.
     */
    injectHeaderButtonIfNeeded() {
      const table = document.querySelector(
        'table[data-st-table="matriculaAlumneAva"]'
      );
      if (!table) return;
      if (table.previousElementSibling?.id === "powertoys-info-box") {
        return;
      }
      const contentDiv = document.createElement("div");
      let optionsHTML = "";
      for (let i = 1; i <= MAX_AVALUACIONS; i++) {
        optionsHTML += `<option value="${i}">Avaluaci\xF3 ${i}</option>`;
      }
      contentDiv.innerHTML = `
            <div>
                <strong>PowerToys - Exportaci\xF3 CSV</strong><br>
                <span style="font-size:0.9em">Selecciona l'avaluaci\xF3 per descarregar les notes:</span>
            <br>
            <select id="powertoys-evaluation-select" style="
                margin-top: 10px;
                padding: 5px;
                border-radius: 4px;
                border: 1px solid #ccc;
                font-family: sans-serif;
            ">
                ${optionsHTML}
            </select>
            <button id="btn-descargar-csv" style="
                background-color: #22c55e;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                align-self: flex-start;
                margin-top: 10px;
                transition: background 0.2s;
            ">Descargar CSV</button>
            </div>
        `;
      const container = this.containerBuilder.createContainer(contentDiv, "powertoys-info-box");
      this.containerBuilder.insertDiv(container, table);
      const btnCSV = document.getElementById("btn-descargar-csv");
      const selectAvaluacio = document.getElementById("powertoys-evaluation-select");
      if (btnCSV) {
        btnCSV.addEventListener("click", () => {
          const evaluation = selectAvaluacio ? parseInt(selectAvaluacio.value, 10) : 1;
          this.onDownload(evaluation);
        });
      }
      this.logger.log("CSVUIBuilder \u2192 div inserit correctament");
    }
  };

  // src/ContainerUIBuilder.js
  var ContainerUIBuilder = class {
    /**
     * @param {import('./PowerToysLogger.js').PowerToysLogger} logger
     * @param {string} version - Versió de l'script per mostrar al peu.
     */
    constructor(logger, version2 = "") {
      this.logger = logger;
      this.version = version2;
    }
    /**
     * Crea un contenidor HTML estàndard i hi insereix l'element de contingut personalitzat.
     * @param {HTMLElement} contentElement - Element HTML a mostrar dins del contenidor.
     * @param {string} id - ID únic del contenidor (per defecte: 'powertoy-div').
     * @returns {HTMLElement} - El contenidor creat.
     */
    createContainer(contentElement, id = "powertoy-div") {
      this.logger.log(`ContainerUIBuilder \u2192 creant contenidor: ${id}`);
      const container = document.createElement("div");
      container.id = id;
      container.classList.add("powertoy-container");
      Object.assign(container.style, {
        marginBottom: "20px",
        padding: "30px 10px 10px 10px",
        border: "1px solid #ccc",
        backgroundColor: "#f9f9f9",
        position: "relative",
        overflow: "auto",
        "max-height": "20em"
      });
      const toggleBtn = document.createElement("button");
      toggleBtn.id = `${id}-toggle-btn`;
      toggleBtn.textContent = "\u2212";
      toggleBtn.type = "button";
      toggleBtn.className = "btn btn-secondary btn-sm";
      toggleBtn.setAttribute("aria-label", "Minimitza PowerToys");
      toggleBtn.setAttribute("aria-expanded", "true");
      toggleBtn.title = "Minimitza PowerToys";
      Object.assign(toggleBtn.style, {
        position: "absolute",
        top: "5px",
        right: "5px",
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: "1"
      });
      const contentWrapper = document.createElement("div");
      contentWrapper.className = "powertoy-content-wrapper";
      contentWrapper.appendChild(contentElement);
      const actualitzaEstatToggle = (expanded) => {
        toggleBtn.textContent = expanded ? "\u2212" : "+";
        toggleBtn.setAttribute("aria-expanded", String(expanded));
        toggleBtn.setAttribute("aria-label", expanded ? "Minimitza PowerToys" : "Expandeix PowerToys");
        toggleBtn.title = expanded ? "Minimitza PowerToys" : "Expandeix PowerToys";
      };
      toggleBtn.addEventListener("click", () => {
        const isHidden = contentWrapper.style.display === "none";
        if (isHidden) {
          contentWrapper.style.display = "";
          actualitzaEstatToggle(true);
        } else {
          contentWrapper.style.display = "none";
          actualitzaEstatToggle(false);
        }
      });
      container.appendChild(toggleBtn);
      container.appendChild(contentWrapper);
      const versionDiv = document.createElement("div");
      versionDiv.innerHTML = `<a href="https://github.com/ctrl-alt-d/EsferaPowerToys" target="_blank" style="text-decoration:none;">Esfer@ Power Toys</a> v. ${this.version}`;
      versionDiv.className = "powertoy-version";
      Object.assign(versionDiv.style, {
        textAlign: "right",
        fontSize: "0.8em",
        marginTop: "8px",
        color: "#666"
      });
      container.appendChild(versionDiv);
      return container;
    }
    /**
     * Insereix un contenidor davant d'un altre element de la interfície.
     * Si ja existeix un element amb el mateix ID, l'elimina.
     * @param {HTMLElement} div - El contenidor creat.
     * @param {HTMLElement} abansDe - Element previ on s'ha d'inserir el contenidor.
     */
    insertDiv(div, abansDe) {
      this.logger.log(`ContainerUIBuilder \u2192 intentant inserir div amb ID ${div.id}`);
      const existent = document.getElementById(div.id);
      if (existent) {
        this.logger.log(`ContainerUIBuilder \u2192 eliminant existent ${div.id}`);
        existent.remove();
      }
      abansDe.parentElement.insertBefore(div, abansDe);
      this.logger.log("ContainerUIBuilder \u2192 div inserit");
      window.dispatchEvent(new Event("resize"));
    }
  };

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
      this.containerBuilder = new ContainerUIBuilder(this.logger, version);
      this.uiBuilder = new MateriaUIBuilder(
        this.logger,
        (materia, inputVal) => this.onApply(materia, inputVal),
        (materia) => this.posaPendentsRA(materia),
        this.containerBuilder
      );
      this.cssApplier = new CSSApplier(this.logger);
      this.csvManager = new CSVManager(this.logger);
      this.csvUIBuilder = new CSVUIBuilder(this.logger, (evaluation) => this.csvManager.proc\u00E9sDesc\u00E0rregaCSV(evaluation), this.containerBuilder);
      this.lastStudent = "";
      this._formTimeout = null;
      const mainContainer = document.querySelector("#mainView") || document.body;
      this.observer = new MutationObserver(() => this.reinicialitza());
      this.observer.observe(mainContainer, { childList: true, subtree: true });
      document.body.addEventListener("change", (e) => {
        if (e.target.tagName === "SELECT") {
          this.cssApplier.aplicaEstils();
        }
      });
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
      this.cssApplier.aplicaEstils();
      this.csvUIBuilder.injectHeaderButtonIfNeeded();
      clearTimeout(this._formTimeout);
      this._formTimeout = setTimeout(() => {
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
        this.containerBuilder.insertDiv(html, form);
      }, 100);
    }
    /**
     * Posa totes les RA buides a pendent.
     * @param {{ codi: string, nom: string, RAs: string[] }} materia - La matèria seleccionada.
     */
    posaPendentsRA(materia) {
      this.logger.log(`PDT al m\xF2dul ${materia.codi}`);
      const rows = document.querySelectorAll("tr.alturallistat");
      rows.forEach((row) => {
        const tdCodi = row.querySelector("td:first-child");
        if (!tdCodi) return;
        const codi = tdCodi.textContent.trim();
        if (!codi.startsWith(materia.codi)) return;
        const select = row.querySelector("select");
        if (!select || select.disabled || select.value) return;
        const opcions = [...select.options].map((o) => o.value);
        if (opcions.includes("string:PDT")) {
          select.value = "string:PDT";
        } else if (opcions.includes("string:PQ")) {
          select.value = "string:PQ";
        }
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
      this.cssApplier.aplicaEstils();
    }
  };

  // src/main.js
  (function() {
    "use strict";
    const controller = new PowerToysController();
    window.PowerToysController = controller;
  })();
})();
