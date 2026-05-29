/**
 * Gestiona l'overlay a pantalla completa del visualitzador.
 */
export class VisualitzadorModal {
    constructor(logger, renderer, pdfExporter) {
        this.logger = logger;
        this.renderer = renderer;
        this.pdfExporter = pdfExporter;
        this.students = [];
        this.currentIndex = 0;
        this.overlay = null;
        this.previouslyFocusedElement = null;
        this.handleKeyDown = (event) => {
            if (event.key === 'Tab') {
                this.trapFocus(event);
                return;
            }
            if (event.key === 'Escape') this.close();
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                this.selectIndex(this.currentIndex - 1);
            }
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                this.selectIndex(this.currentIndex + 1);
            }
        };
    }

    /**
     * Obre el modal i selecciona automàticament el primer alumne.
     */
    open(students) {
        this.students = students || [];
        this.currentIndex = 0;
        this.previouslyFocusedElement = document.activeElement;
        this.injectStyles();
        this.overlay = this.creaOverlay();
        document.body.appendChild(this.overlay);
        document.body.classList.add('ptv-modal-open');
        document.addEventListener('keydown', this.handleKeyDown);
        this.populateSelect();
        this.renderCurrentStudent();
        this.overlay.querySelector('#ptv-student-select').focus();
    }

    close() {
        if (!this.overlay) return;
        document.removeEventListener('keydown', this.handleKeyDown);
        document.body.classList.remove('ptv-modal-open');
        this.overlay.remove();
        this.overlay = null;
        if (this.previouslyFocusedElement?.focus) this.previouslyFocusedElement.focus();
        this.previouslyFocusedElement = null;
    }

    creaOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'ptv-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Visualitzador de notes dels alumnes');
        overlay.innerHTML = `
            <div class="ptv-top-bar">
                <div class="ptv-brand">Esfera <span>PowerToys</span></div>
                <div class="ptv-select-wrap">
                    <label for="ptv-student-select">Alumne</label>
                    <button type="button" class="ptv-nav-btn" data-action="previous" aria-label="Alumne anterior">← Anterior (←)</button>
                    <select class="ptv-student-select" id="ptv-student-select"></select>
                    <button type="button" class="ptv-nav-btn" data-action="next" aria-label="Alumne següent">Següent (→)</button>
                </div>
                <button type="button" class="ptv-close-btn" data-action="close" aria-label="Tanca el visualitzador">× Tanca</button>
            </div>
            <div class="ptv-preview-disclaimer" role="status" aria-live="polite">
                [lab] Funcionalitat en previsualització i funcionalitat limitada: pot no reflectir encara l'estada en empresa ni els RA opcionals.
            </div>
            <div class="ptv-student-view"></div>
        `;

        overlay.querySelector('[data-action="close"]').addEventListener('click', () => this.close());
        overlay.querySelector('[data-action="previous"]').addEventListener('click', () => this.selectIndex(this.currentIndex - 1));
        overlay.querySelector('[data-action="next"]').addEventListener('click', () => this.selectIndex(this.currentIndex + 1));
        overlay.querySelector('#ptv-student-select').addEventListener('change', (event) => this.selectIndex(Number(event.target.value)));
        overlay.querySelector('.ptv-student-view').addEventListener('click', (event) => this.handleStudentViewClick(event));

        return overlay;
    }

    trapFocus(event) {
        if (!this.overlay) return;
        const focusables = [
            '[data-action="previous"]',
            '#ptv-student-select',
            '[data-action="next"]',
            '[data-action="close"]',
        ]
            .map(selector => this.overlay.querySelector(selector))
            .filter(element => element && !element.disabled);
        if (focusables.length === 0) {
            event.preventDefault();
            return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        } else if (!this.overlay.contains(document.activeElement)) {
            event.preventDefault();
            first.focus();
        }
    }

    populateSelect() {
        const select = this.overlay.querySelector('#ptv-student-select');
        select.textContent = '';
        this.students.forEach((student, index) => {
            const option = document.createElement('option');
            option.value = String(index);
            option.textContent = student.nom;
            select.appendChild(option);
        });
    }

    selectIndex(index) {
        if (index < 0 || index >= this.students.length) return;
        this.currentIndex = index;
        this.renderCurrentStudent();
    }

    renderCurrentStudent() {
        if (!this.overlay) return;
        const view = this.overlay.querySelector('.ptv-student-view');
        view.textContent = '';

        if (this.students.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'ptv-empty-msg';
            empty.textContent = 'No hi ha dades d’alumnes per visualitzar.';
            view.appendChild(empty);
            this.updateControls();
            return;
        }

        view.appendChild(this.renderer.renderStudent(this.students[this.currentIndex]));
        view.scrollTop = 0;
        this.updateControls();
    }

    updateControls() {
        const select = this.overlay.querySelector('#ptv-student-select');
        const previous = this.overlay.querySelector('[data-action="previous"]');
        const next = this.overlay.querySelector('[data-action="next"]');
        select.value = String(this.currentIndex);
        previous.disabled = this.currentIndex <= 0;
        next.disabled = this.currentIndex >= this.students.length - 1;
    }

    async handleStudentViewClick(event) {
        const button = event.target.closest('[data-action="download-pdf"]');
        if (!button || button.disabled) return;

        const target = this.overlay.querySelector('#powertoys-visualitzador-pdf-target');
        const student = this.students[this.currentIndex];
        if (!target || !student) return;

        button.disabled = true;
        button.textContent = '⏳ Generant...';

        try {
            await this.pdfExporter.exporta(target, student.nom);
        } catch (error) {
            this.logger.error('VisualitzadorModal → Error generant PDF:', error);
            alert(`Error generant el PDF: ${error.message}`);
        } finally {
            button.disabled = false;
            button.textContent = '⬇ Descarregar PDF';
        }
    }

    injectStyles() {
        if (document.getElementById('ptv-styles')) return;
        const style = document.createElement('style');
        style.id = 'ptv-styles';
        style.textContent = `
            body.ptv-modal-open { overflow: hidden; }
            .ptv-overlay { --ptv-bg:#0f0f13; --ptv-surface:#18181f; --ptv-surface2:#22222c; --ptv-border:#4b4b5f; --ptv-text:#f5f5ff; --ptv-muted:#c2c2d6; --ptv-green:#8dffc4; --ptv-green-dim:#0f2519; --ptv-red:#ffb3b3; --ptv-red-dim:#2a0f12; --ptv-yellow:#ffe08a; --ptv-yellow-dim:#2a2208; --ptv-accent:#b8aeff; position:fixed; inset:0; z-index:2147483647; background:var(--ptv-bg); color:var(--ptv-text); font-family:monospace; display:flex; flex-direction:column; width:100vw; height:100vh; height:100dvh; overflow:hidden; }
            .ptv-overlay * { box-sizing:border-box; }
            .ptv-top-bar { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:16px 24px; border-bottom:1px solid var(--ptv-border); background:var(--ptv-surface); flex:0 0 auto; flex-wrap:wrap; }
            .ptv-brand { font-size:2.2rem; font-weight:700; color:var(--ptv-accent); } .ptv-brand span { color:var(--ptv-muted); font-weight:400; }
            .ptv-select-wrap { display:flex; align-items:center; gap:10px; flex:1; justify-content:center; min-width:280px; } .ptv-select-wrap label { color:var(--ptv-muted); text-transform:uppercase; font-size:1.44rem; letter-spacing:.08em; }
            #ptv-student-select.ptv-student-select { min-width:260px; max-width:460px; height:45px !important; min-height:45px; flex:1; background:var(--ptv-surface2); color:var(--ptv-text); border:1px solid var(--ptv-border); border-radius:8px; padding:9px 12px; font-size:1.4rem; line-height:1.2; }
            .ptv-close-btn, .ptv-nav-btn { background:transparent; color:var(--ptv-muted); border:1px solid var(--ptv-border); border-radius:8px; padding:9px 14px; cursor:pointer; font-size:1.4rem; } .ptv-close-btn:hover, .ptv-nav-btn:hover:not(:disabled) { color:var(--ptv-accent); border-color:var(--ptv-accent); } .ptv-nav-btn:disabled { opacity:.45; cursor:not-allowed; }
            .ptv-close-btn:focus-visible, .ptv-nav-btn:focus-visible, #ptv-student-select:focus-visible, .ptv-pdf-inline-btn:focus-visible { outline:3px solid var(--ptv-accent); outline-offset:3px; }
            .ptv-preview-disclaimer { flex:0 0 auto; margin:14px 24px 0; padding:12px 16px; border:1px solid var(--ptv-yellow); border-left:6px solid var(--ptv-yellow); border-radius:8px; background:var(--ptv-yellow-dim); color:var(--ptv-yellow); font-size:1.32rem; line-height:1.45; }
            .ptv-student-view { flex:1 1 auto; min-height:0; overflow:auto; padding:16px 24px 24px; } .ptv-empty-msg { padding:80px 40px; text-align:center; color:var(--ptv-muted); font-size:1.4rem; }
            .ptv-student-name { font-size:3.4rem; font-weight:900; line-height:1; margin-bottom:14px; } .ptv-last { color:var(--ptv-accent); }
            .ptv-main-grid { display:grid; grid-template-columns:minmax(0, 1fr) minmax(280px, 360px); gap:16px; align-items:start; min-width:0; }
            .ptv-table-scroll { min-width:0; overflow-x:auto; }
            .ptv-subjects-table { width:100%; border-collapse:separate; border-spacing:0; background:var(--ptv-surface); border:1px solid var(--ptv-border); border-radius:10px; overflow:hidden; }
            .ptv-subjects-table thead tr { background:var(--ptv-surface2); } .ptv-subjects-table th { font-size:1.2rem; text-transform:uppercase; letter-spacing:.08em; color:var(--ptv-muted); font-weight:700; padding:7px 10px; text-align:center; border-bottom:1px solid var(--ptv-border); white-space:nowrap; } .ptv-th-name { text-align:left !important; padding-left:14px !important; }
            .ptv-td-name { padding:8px 10px 8px 14px; white-space:normal; min-width:190px; max-width:260px; vertical-align:middle; } .ptv-subj-name-text { display:flex; flex-direction:column; gap:3px; font-weight:700; color:var(--ptv-text); line-height:1.18; overflow-wrap:anywhere; } .ptv-subj-code { font-size:1.18rem; color:var(--ptv-accent); letter-spacing:.03em; } .ptv-subj-label { font-size:1.4rem; }
            .ptv-td-ra { padding:5px 4px; text-align:center; vertical-align:middle; } .ptv-ra-pill { display:inline-flex; align-items:center; justify-content:center; width:56px; min-width:56px; height:48px; border-radius:6px; font-size:1.5rem; font-weight:900; } .ptv-ra-pill.pass { background:var(--ptv-green-dim); color:var(--ptv-green); border:1px solid var(--ptv-green); } .ptv-ra-pill.fail { background:var(--ptv-red-dim); color:var(--ptv-red); border:1px solid var(--ptv-red); } .ptv-ra-pill.pdt { background:var(--ptv-yellow-dim); color:var(--ptv-yellow); border:1px solid var(--ptv-yellow); } .ptv-ra-pill.empty { background:transparent; color:transparent; border:none; }
            .ptv-td-total { padding:5px 14px 5px 8px; text-align:center; vertical-align:middle; border-left:1px solid var(--ptv-border); } .ptv-total-pill { display:inline-flex; align-items:center; justify-content:center; width:64px; min-width:64px; height:56px; border-radius:8px; font-size:1.8rem; font-weight:900; } .ptv-total-pill.pass { background:var(--ptv-green-dim); color:var(--ptv-green); border:1px solid var(--ptv-green); } .ptv-total-pill.fail { background:var(--ptv-red-dim); color:var(--ptv-red); border:1px solid var(--ptv-red); } .ptv-total-pill.warn { background:var(--ptv-yellow-dim); color:var(--ptv-yellow); border:1px solid var(--ptv-yellow); } .ptv-total-pill.na { background:var(--ptv-surface2); color:var(--ptv-muted); border:1px dashed var(--ptv-border); font-size:1.3rem; }
            .ptv-right-col { display:flex; flex-direction:column; gap:12px; min-width:0; position:sticky; top:16px; } .ptv-summary-card, .ptv-recover-card { background:var(--ptv-surface); border:1px solid var(--ptv-border); border-radius:10px; padding:16px 14px; display:flex; flex-direction:column; gap:9px; min-width:0; overflow-wrap:anywhere; } .ptv-section-title { font-size:1.2rem; text-transform:uppercase; letter-spacing:.1em; color:var(--ptv-muted); padding-bottom:4px; border-bottom:1px solid var(--ptv-border); margin:0; } .ptv-section-title--spaced { margin-top:14px; padding-top:12px; border-top:1px solid var(--ptv-border); } .ptv-stat-row { display:flex; align-items:center; justify-content:space-between; gap:14px; } .ptv-s-label { font-size:1.44rem; color:var(--ptv-muted); } .ptv-s-num { font-size:2.7rem; font-weight:900; line-height:1; } .ptv-s-num.ok { color:var(--ptv-green); } .ptv-s-num.ko { color:var(--ptv-red); } .ptv-s-num.pdt { color:var(--ptv-yellow); } .ptv-s-num.info { color:var(--ptv-accent); }
            .ptv-recover-card { border-color:var(--ptv-red); } .ptv-recover-card h3 { font-size:1.2rem; font-weight:700; color:var(--ptv-red); text-transform:uppercase; letter-spacing:.08em; margin:0 0 1px; } .ptv-recover-list { display:flex; flex-direction:column; gap:5px; min-width:0; } .ptv-recover-chip { border:1px solid var(--ptv-red); color:var(--ptv-red); padding:4px 10px; border-radius:5px; font-size:1.36rem; line-height:1.4; overflow-wrap:anywhere; }
            .ptv-pdf-inline-btn { font-family:monospace; font-size:1.56rem; background:var(--ptv-accent); border:none; color:var(--ptv-bg); padding:11px 24px; border-radius:8px; cursor:pointer; font-weight:700; display:block; margin:14px 0 0 auto; } .ptv-pdf-inline-btn:disabled { opacity:.5; cursor:wait; }
            .ptv-pdf-mode { background:#0f0f13; padding:28px 32px 32px; width:900px; } .ptv-pdf-mode .ptv-main-grid { grid-template-columns:1fr; gap:16px; } .ptv-pdf-mode .ptv-right-col { position:static; display:grid; grid-template-columns:1fr 1fr; gap:14px; } .ptv-pdf-mode .ptv-td-name { white-space:normal; max-width:200px; } .ptv-pdf-mode .ptv-pdf-inline-btn { visibility:hidden; }
            @media (max-width:1500px) { .ptv-main-grid { grid-template-columns:1fr; } .ptv-right-col { position:static; display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:12px; } .ptv-pdf-inline-btn { align-self:start; margin:0; } }
            @media (max-width:900px) { .ptv-right-col { grid-template-columns:1fr; } .ptv-td-name { min-width:160px; max-width:220px; } }
            @media (max-width:700px) { .ptv-student-view { padding:12px 14px 20px; } .ptv-top-bar { padding:14px 16px; } .ptv-brand { font-size:1.8rem; } .ptv-select-wrap { justify-content:flex-start; flex-wrap:wrap; min-width:0; width:100%; } #ptv-student-select.ptv-student-select { min-width:0; max-width:none; width:100%; } .ptv-ra-pill { width:44px; min-width:44px; height:40px; font-size:1.2rem; } .ptv-total-pill { width:52px; min-width:52px; height:48px; font-size:1.5rem; } }
        `;
        document.head.appendChild(style);
    }
}
