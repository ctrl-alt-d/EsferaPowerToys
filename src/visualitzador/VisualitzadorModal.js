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
        this.handleKeyDown = (event) => {
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
        this.injectStyles();
        this.overlay = this.creaOverlay();
        document.body.appendChild(this.overlay);
        document.body.classList.add('ptv-modal-open');
        document.addEventListener('keydown', this.handleKeyDown);
        this.populateSelect();
        this.renderCurrentStudent();
    }

    close() {
        if (!this.overlay) return;
        document.removeEventListener('keydown', this.handleKeyDown);
        document.body.classList.remove('ptv-modal-open');
        this.overlay.remove();
        this.overlay = null;
    }

    creaOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'ptv-overlay';
        overlay.innerHTML = `
            <div class="ptv-top-bar">
                <div class="ptv-brand">Esfera <span>PowerToys</span></div>
                <div class="ptv-select-wrap">
                    <label for="ptv-student-select">Alumne</label>
                    <button type="button" class="ptv-nav-btn" data-action="previous">← Anterior (←)</button>
                    <select class="ptv-student-select" id="ptv-student-select"></select>
                    <button type="button" class="ptv-nav-btn" data-action="next">Següent (→)</button>
                </div>
                <button type="button" class="ptv-close-btn" data-action="close">× Tanca</button>
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
            .ptv-overlay { --ptv-bg:#0f0f13; --ptv-surface:#18181f; --ptv-surface2:#22222c; --ptv-border:#4b4b5f; --ptv-text:#f5f5ff; --ptv-muted:#c2c2d6; --ptv-green:#8dffc4; --ptv-green-dim:#0f2519; --ptv-red:#ffb3b3; --ptv-red-dim:#2a0f12; --ptv-yellow:#ffe08a; --ptv-yellow-dim:#2a2208; --ptv-accent:#b8aeff; position: fixed; inset: 0; z-index: 2147483647; background: var(--ptv-bg); color: var(--ptv-text); font-family: monospace; overflow: auto; }
            .ptv-top-bar { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:16px 24px; border-bottom:1px solid var(--ptv-border); background:var(--ptv-surface); position:sticky; top:0; z-index:2; flex-wrap:wrap; }
            .ptv-brand { font-size:2.2rem; font-weight:700; color:var(--ptv-accent); } .ptv-brand span { color:var(--ptv-muted); font-weight:400; }
            .ptv-select-wrap { display:flex; align-items:center; gap:10px; flex:1; justify-content:center; min-width:280px; } .ptv-select-wrap label { color:var(--ptv-muted); text-transform:uppercase; font-size:1.44rem; letter-spacing:.08em; }
            .ptv-student-select { min-width:260px; max-width:460px; flex:1; background:var(--ptv-surface2); color:var(--ptv-text); border:1px solid var(--ptv-border); border-radius:8px; padding:9px 12px; font-size:1.4rem; }
            .ptv-close-btn, .ptv-nav-btn { background:transparent; color:var(--ptv-muted); border:1px solid var(--ptv-border); border-radius:8px; padding:9px 14px; cursor:pointer; font-size:1.4rem; } .ptv-close-btn:hover, .ptv-nav-btn:hover:not(:disabled) { color:var(--ptv-accent); border-color:var(--ptv-accent); } .ptv-nav-btn:disabled { opacity:.45; cursor:not-allowed; }
            .ptv-student-view { padding:16px 24px 24px; } .ptv-empty-msg { padding:80px 40px; text-align:center; color:var(--ptv-muted); font-size:1.4rem; }
            .ptv-student-name { font-size:3.4rem; font-weight:900; line-height:1; margin-bottom:14px; } .ptv-last { color:var(--ptv-accent); }
            .ptv-main-grid { display:grid; grid-template-columns:8fr 4fr; gap:14px; align-items:start; }
            .ptv-subjects-table { width:100%; border-collapse:separate; border-spacing:0; background:var(--ptv-surface); border:1px solid var(--ptv-border); border-radius:10px; overflow:hidden; }
            .ptv-subjects-table thead tr { background:var(--ptv-surface2); } .ptv-subjects-table th { font-size:1.2rem; text-transform:uppercase; letter-spacing:.08em; color:var(--ptv-muted); font-weight:700; padding:7px 10px; text-align:center; border-bottom:1px solid var(--ptv-border); white-space:nowrap; } .ptv-th-name { text-align:left !important; padding-left:14px !important; }
            .ptv-td-name { padding:0 10px 0 14px; white-space:nowrap; } .ptv-subj-name-text { font-size:1.4rem; font-weight:700; color:var(--ptv-text); }
            .ptv-td-ra { padding:5px 4px; text-align:center; vertical-align:middle; } .ptv-ra-pill { display:inline-flex; align-items:center; justify-content:center; width:56px; min-width:56px; height:48px; border-radius:6px; font-size:1.5rem; font-weight:900; } .ptv-ra-pill.pass { background:var(--ptv-green-dim); color:var(--ptv-green); border:1px solid var(--ptv-green); } .ptv-ra-pill.fail { background:var(--ptv-red-dim); color:var(--ptv-red); border:1px solid var(--ptv-red); } .ptv-ra-pill.pdt { background:var(--ptv-yellow-dim); color:var(--ptv-yellow); border:1px solid var(--ptv-yellow); } .ptv-ra-pill.empty { background:transparent; color:transparent; border:none; }
            .ptv-td-total { padding:5px 14px 5px 8px; text-align:center; vertical-align:middle; border-left:1px solid var(--ptv-border); } .ptv-total-pill { display:inline-flex; align-items:center; justify-content:center; width:64px; min-width:64px; height:56px; border-radius:8px; font-size:1.8rem; font-weight:900; } .ptv-total-pill.pass { background:var(--ptv-green-dim); color:var(--ptv-green); border:1px solid var(--ptv-green); } .ptv-total-pill.fail { background:var(--ptv-red-dim); color:var(--ptv-red); border:1px solid var(--ptv-red); } .ptv-total-pill.warn { background:var(--ptv-yellow-dim); color:var(--ptv-yellow); border:1px solid var(--ptv-yellow); } .ptv-total-pill.na { background:var(--ptv-surface2); color:var(--ptv-muted); border:1px dashed var(--ptv-border); font-size:1.3rem; }
            .ptv-right-col { display:flex; flex-direction:column; gap:12px; position:sticky; top:76px; } .ptv-summary-card, .ptv-recover-card { background:var(--ptv-surface); border:1px solid var(--ptv-border); border-radius:10px; padding:16px 14px; display:flex; flex-direction:column; gap:9px; } .ptv-section-title { font-size:1.2rem; text-transform:uppercase; letter-spacing:.1em; color:var(--ptv-muted); padding-bottom:4px; border-bottom:1px solid var(--ptv-border); } .ptv-stat-row { display:flex; align-items:center; justify-content:space-between; gap:14px; } .ptv-s-label { font-size:1.44rem; color:var(--ptv-muted); } .ptv-s-num { font-size:2.7rem; font-weight:900; line-height:1; } .ptv-s-num.ok { color:var(--ptv-green); } .ptv-s-num.ko { color:var(--ptv-red); } .ptv-s-num.pdt { color:var(--ptv-yellow); } .ptv-s-num.info { color:var(--ptv-accent); }
            .ptv-recover-card { border-color:var(--ptv-red); } .ptv-recover-card h3 { font-size:1.2rem; font-weight:700; color:var(--ptv-red); text-transform:uppercase; letter-spacing:.08em; margin:0 0 1px; } .ptv-recover-list { display:flex; flex-direction:column; gap:5px; } .ptv-recover-chip { border:1px solid var(--ptv-red); color:var(--ptv-red); padding:4px 10px; border-radius:5px; font-size:1.36rem; line-height:1.4; }
            .ptv-pdf-inline-btn { font-family:monospace; font-size:1.56rem; background:var(--ptv-accent); border:none; color:var(--ptv-bg); padding:11px 24px; border-radius:8px; cursor:pointer; font-weight:700; display:block; margin:14px 0 0 auto; } .ptv-pdf-inline-btn:disabled { opacity:.5; cursor:wait; }
            .ptv-pdf-mode { background:#0f0f13; padding:28px 32px 32px; width:900px; } .ptv-pdf-mode .ptv-main-grid { grid-template-columns:1fr; gap:16px; } .ptv-pdf-mode .ptv-right-col { position:static; display:grid; grid-template-columns:1fr 1fr; gap:14px; } .ptv-pdf-mode .ptv-td-name { white-space:normal; max-width:200px; } .ptv-pdf-mode .ptv-pdf-inline-btn { visibility:hidden; }
            @media (max-width:1300px) { .ptv-main-grid { grid-template-columns:1fr; } .ptv-right-col { position:static; display:grid; grid-template-columns:1fr 1fr; gap:12px; } } @media (max-width:700px) { .ptv-student-view { padding:12px 14px 20px; } .ptv-top-bar { padding:14px 16px; } .ptv-select-wrap { justify-content:flex-start; flex-wrap:wrap; } .ptv-student-select { min-width:210px; } .ptv-right-col { grid-template-columns:1fr; } .ptv-ra-pill { width:44px; min-width:44px; height:40px; font-size:1.2rem; } .ptv-total-pill { width:52px; min-width:52px; height:48px; font-size:1.5rem; } }
        `;
        document.head.appendChild(style);
    }
}
