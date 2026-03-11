# Instruccions per a agents IA

## Descripció del projecte

Userscript (Tampermonkey) que millora la plataforma Esfer@ d'avaluació del Departament d'Educació de la Generalitat de Catalunya. Permet aplicar notes ràpidament fent copy-paste des d'un full de càlcul.

**No és una aplicació web convencional**: és un script injectat al DOM d'una pàgina Angular antiga. No hi ha framework, no hi ha backend propi, no hi ha API pròpia.

---

## Stack i eines

| Eina | Detall |
|---|---|
| Llenguatge | JavaScript ES modules (`"type": "module"`) |
| Node.js | ≥ 22 |
| Gestor de paquets | **pnpm** (pinned via `packageManager` a `package.json`) |
| Bundler | esbuild (`build/esbuild.config.js`) |
| Tests | Jest 30 amb `--experimental-vm-modules` |
| DOM testing | jsdom |
| CI | GitHub Actions (`.github/workflows/test.yml`) |

---

## Comandes principals

```bash
pnpm install          # instal·lar dependències
pnpm test             # executar tests
pnpm run build        # sincronitzar versió + generar dist/script.user.js
```

---

## Arquitectura

### Estructura de fitxers

- `src/` — codi font, una classe per fitxer.
- `tests/` — tests Jest, un fitxer per classe amb el patró `NomClasse.test.js`.
- `build/` — configuració esbuild, gestió de versió i header del userscript.
- `dist/` — sortida del build (**no editar manualment**).
- `docs/` — captures de pantalla i recursos visuals.

### Patrons del projecte

- **Cada fitxer `src/` exporta exactament una classe** amb `export class NomClasse`.
- **Injecció de dependències via constructor**: totes les classes reben un `logger` (i altres dependències) com a paràmetre. **No accedeixis a altres classes via `window` ni globals** — passa sempre callbacks o instàncies pel constructor.
- **No hi ha framework**: el DOM es manipula directament amb `document.querySelector`, `createElement`, etc.
- **El punt d'entrada** és `src/main.js`, que crea una IIFE i inicialitza `PowerToysController`.
- **La versió es gestiona a `build/version.js`** (font de veritat) i es sincronitza a `package.json` amb `build/sync-version.js`.

### Classes i responsabilitats

| Classe | Responsabilitat |
|---|---|
| `PowerToysController` | Coordinador principal. Observa canvis al DOM i orquestra la resta. |
| `MateriaParser` | Parseja files `<tr>` de la taula HTML per extreure matèries i RAs. |
| `MateriaUIBuilder` | Genera la interfície HTML (inputs, botons) per a cada matèria. |
| `MateriaApplier` | Tradueix notes numèriques a codis (`A10`, `NA`, `PDT`…) i les aplica als `<select>`. |
| `CSSApplier` | Injecta estils CSS i aplica classes visuals segons el valor dels selects. |
| `ScrollHelper` | Fa scroll i highlight visual cap a la matèria modificada. |
| `PowerToysLogger` | Logger configurable amb mode debug. |

---

## Versionat

- La **font de veritat** de la versió és `build/version.js` (ex: `export const version = '1.9.0';`).
- `build/sync-version.js` copia la versió de `build/version.js` a `package.json` automàticament.
- `build/esbuild.config.js` injecta la versió al header del userscript (`build/userScriptHeader.raw`, placeholder `{{VERSION}}`).
- El build (`pnpm run build`) executa `sync-version.js` + esbuild en seqüència.

**Per tant:**
- Per canviar la versió, modifica **només** `build/version.js`.
- No editis la versió a `package.json` directament — es sobreescriurà al build.
- No editis el header del userscript a `build/userScriptHeader.raw` per canviar la versió.
- No canviïs la versió sense que s'hagi demanat explícitament.

---

## Regles — NO TRENCAR

### 1. No instal·lis dependències noves sense justificació

Userscript lleuger. Cada dependència afegeix pes al bundle final. No afegeixis llibreries (ni runtime ni dev) sense raó clara.

### 2. No canviïs l'estructura del build

- `build/userScriptHeader.raw` conté metadades crítiques (`@match`, `@updateURL`, `@downloadURL`). **No el modifiquis**.
- El format de sortida és `iife` — no el canviïs.
- La versió es gestiona **exclusivament** a `build/version.js`. No la canviïs a `package.json` directament.

### 3. Sempre escriu tests

- Si crees o modifiques lògica a `src/`, afegeix o actualitza tests a `tests/`.
- Els tests han de funcionar amb `pnpm test`.
- Utilitza `jsdom` per simular el DOM quan calgui, tal com fa `MateriaParser.test.js`.

### 4. No modifiquis `dist/`

Es genera amb `pnpm run build`. No l'editis manualment mai.

### 5. Respecta l'idioma

- **Codi**: noms de variables, classes i funcions en **anglès o català** (segueix el que ja existeix a cada fitxer).
- **Comentaris i JSDoc**: en **català**.
- **Commits i documentació**: en **català**.

### 6. No afegeixis TypeScript

JavaScript pur amb JSDoc. No converteixis fitxers a `.ts` ni afegeixis `tsconfig.json`.

### 7. No canviïs la CI sense necessitat

`.github/workflows/test.yml` executa tests i build en PRs. No el modifiquis llevat que sigui estrictament necessari.

### 8. Compatibilitat amb el DOM d'Esfer@

L'script depèn d'elements concrets del DOM:
- Selectors: `tr.alturallistat`, `form[name="grupAlumne"]`, `.breadcrumb`, `fieldset.ng-scope`, etc.
- Valors de `<select>` amb prefix `string:` (ex: `string:A10`, `string:PDT`).
- **No inventis selectors ni estructures DOM**. Basa't en el que ja existeix al codi.

### 9. Un fitxer, una classe

No ajuntis múltiples classes en un sol fitxer. Classe nova → fitxer nou a `src/`.

### 10. Només pnpm

No facis servir `npm` ni `yarn`. El `packageManager` està fixat a `package.json`.

---

## Flux de treball

1. Fes els canvis a `src/`.
2. Escriu o actualitza tests a `tests/`.
3. Executa `pnpm test` — han de passar.
4. Executa `pnpm run build` — ha de generar `dist/script.user.js`.
5. No pugis canvis a `dist/` sense fer build primer.

---

## Prohibicions explícites

- No eliminis ni buidis fitxers existents sense confirmació.
- No canviïs el `@match` del userscript header.
- No afegeixis `node_modules/` ni fitxers generats al commit.
- No facis `pnpm install --no-frozen-lockfile` en CI.
- No inventis funcionalitats que no s'han demanat.
- No refactoritzis codi que funciona sense que s'hagi sol·licitat.
