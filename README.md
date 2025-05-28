# Esfer@ PowerToys

Millores personalitzades per a la plataforma Esfer@ d'avaluació del Departament d'Educació de la Generalitat de Catalunya.

Aquest script permet aplicar ràpidament notes fent copy-paste des del teu full de càlcul.

---

## 🔧 Requisits

Per instal·lar aquest script necessites:

- 🔌 [Tampermonkey](https://www.tampermonkey.net/) — una extensió per a navegadors que permet executar scripts d'usuari.
- 🌐 Un navegador compatible (Chrome, Firefox, Edge...).

---

## 🚀 Instal·lació

1. Instal·la **Tampermonkey** des de la seva web oficial:  
   👉 [https://www.tampermonkey.net/](https://www.tampermonkey.net/)

2. Fes clic aquí per instal·lar l'script:  
   👉 [`Esfer@ PowerToys`](https://raw.githubusercontent.com/ctrl-alt-d/EsferaPowerToys/refs/heads/main/dist/script.user.js)

   Tampermonkey t'obrirà una pestanya amb el codi i un botó per **"Install"**.

3. Un cop instal·lat, quan entris a qualificacions finals per grup i alumne/a et permetrà fer copy-paste de les notes des d'un full de càlcul.

   L'script s'activarà automàticament.

---

## Funcionalitats actuals

- ✅ Aplicació massiva de notes qualitatives a cada matèria.
- ✅ Traducció automàtica de notes numèriques a valors com `A10`, `A7`, `PDT`, etc.
- ✅ Scroll automàtic a l'assignatura per veure els canvis.
- ✅ Interfície afegida al principi de la pàgina amb inputs i botons útils.

---

![Captura de pantalla](./docs/video.gif)

🎨 El gif animat cortesia d' [@ermengolbota](https://github.com/ermengolbota).


---

## Contribucions

Estàs convidat/da a col·laborar!

- Tens idees de millores?
- Has trobat algun error?
- Vols afegir suport a altres parts de l’Esfer@?

Fes un fork del repositori, obre una pull request, o obre una issue. Totes les contribucions són benvingudes!

📌 Repositori:  
[https://github.com/ctrl-alt-d/EsferaPowerToys](https://github.com/ctrl-alt-d/EsferaPowerToys)

---

## Llicència MIT — Sense responsabilitats

Aquest projecte està distribuït sota la llicència [MIT](./LICENSE).

**Això vol dir:**

- Pots utilitzar, modificar i redistribuir lliurement el codi.
- El codi s'ofereix **tal com és**, **sense garanties de cap mena**.
- L’autor **no es fa responsable** de cap dany, error o conseqüència derivada del seu ús.

Fes-lo servir sota la teva responsabilitat i sentit comú.

---

## 📝 ToDo

- 🧹 Afegir tests per a cada classe.

---


## 👩‍💻 Developers

Si vols compilar el projecte tu mateix:

1. Clona el repositori:
   ```bash
   git clone https://github.com/ctrl-alt-d/EsferaPowerToys.git
   cd EsferaPowerToys
   ```

2. Installa les dependències:
   ```bash
   npm install
   ```

3. Compila l'script:
   ```bash
   npm run build
   ```

   Això generarà el fitxer:
   ```
   dist/script.user.js
   ```

4. Incrementa la versió modificant el fitxer:
   ```
   build/version.js
   ```

