import { VisualitzadorModelBuilder } from './VisualitzadorModelBuilder.js';

/**
 * Renderitza la vista d'un alumne del visualitzador.
 */
export class VisualitzadorRenderer {
    constructor(valueHelper = new VisualitzadorModelBuilder()) {
        this.valueHelper = valueHelper;
    }

    /**
     * Crea el node que es capturarà també per al PDF.
     */
    renderStudent(student) {
        const target = document.createElement('div');
        target.id = 'powertoys-visualitzador-pdf-target';

        const title = document.createElement('div');
        title.className = 'ptv-student-name';
        this.aplicaNom(title, student.nom);
        target.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'ptv-main-grid';
        const tableWrap = document.createElement('div');
        tableWrap.className = 'ptv-table-scroll';
        tableWrap.appendChild(this.creaTaula(student));
        grid.appendChild(tableWrap);
        grid.appendChild(this.creaColumnaResum(student));
        target.appendChild(grid);

        return target;
    }

    aplicaNom(container, nom) {
        const [cognoms, prenom] = String(nom || '').split(',').map(s => s.trim());
        const last = document.createElement('span');
        last.className = 'ptv-last';
        last.textContent = prenom ? cognoms : nom;
        container.appendChild(last);
        if (prenom) container.append(`, ${prenom}`);
    }

    creaTaula(student) {
        const table = document.createElement('table');
        table.className = 'ptv-subjects-table';
        const subjects = student.subjects || [];
        const hasEM = subjects.some(s => s.ras.some(ra => ra.key === '01EM'));
        const maxRegularRAs = Math.max(...subjects.map(subject => subject.ras.filter(ra => ra.key !== '01EM').length), 0);

        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');
        const nameHeader = document.createElement('th');
        nameHeader.className = 'ptv-th-name';
        nameHeader.textContent = 'Mòdul';
        headRow.appendChild(nameHeader);

        if (hasEM) {
            const emHeader = document.createElement('th');
            emHeader.textContent = 'EM';
            headRow.appendChild(emHeader);
        }

        for (let i = 0; i < maxRegularRAs; i++) {
            const th = document.createElement('th');
            th.textContent = `RA${String(i + 1).padStart(2, '0')}`;
            headRow.appendChild(th);
        }

        const totalHeader = document.createElement('th');
        totalHeader.textContent = 'Total';
        headRow.appendChild(totalHeader);
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        subjects.forEach(subject => tbody.appendChild(this.creaFilaAssignatura(subject, maxRegularRAs, hasEM)));
        table.appendChild(tbody);

        return table;
    }

    creaPill(ra) {
        const pill = document.createElement('span');
        if (ra) {
            pill.className = `ptv-ra-pill ${this.valueHelper.scoreClass(ra.raw)}`;
            pill.title = `${ra.key}: ${this.valueHelper.displayVal(ra.raw)}`;
            pill.textContent = this.valueHelper.displayVal(ra.raw);
        } else {
            pill.className = 'ptv-ra-pill empty';
            pill.textContent = '·';
        }
        return pill;
    }

    creaFilaAssignatura(subject, maxRegularRAs, hasEM) {
        const tr = document.createElement('tr');
        const name = document.createElement('td');
        name.className = 'ptv-td-name';
        const nameText = document.createElement('span');
        nameText.className = 'ptv-subj-name-text';
        const codeText = document.createElement('span');
        codeText.className = 'ptv-subj-code';
        codeText.textContent = subject.code;
        const labelText = document.createElement('span');
        labelText.className = 'ptv-subj-label';
        labelText.textContent = this.normalitzaNomAssignatura(subject.name, subject.code);
        nameText.append(codeText, labelText);
        name.appendChild(nameText);
        tr.appendChild(name);

        const regularRAs = subject.ras.filter(ra => ra.key !== '01EM');

        if (hasEM) {
            const td = document.createElement('td');
            td.className = 'ptv-td-ra';
            const emRA = subject.ras.find(ra => ra.key === '01EM');
            td.appendChild(this.creaPill(emRA));
            tr.appendChild(td);
        }

        for (let i = 0; i < maxRegularRAs; i++) {
            const td = document.createElement('td');
            td.className = 'ptv-td-ra';
            td.appendChild(this.creaPill(regularRAs[i]));
            tr.appendChild(td);
        }

        const total = document.createElement('td');
        total.className = 'ptv-td-total';
        const totalPill = document.createElement('div');
        totalPill.className = `ptv-total-pill ${this.valueHelper.finalClass(subject.final)}`;
        console.log(subject.final);
        totalPill.textContent = this.valueHelper.displayVal(subject.final);
        total.appendChild(totalPill);
        tr.appendChild(total);

        return tr;
    }

    /**
     * Elimina el codi final del nom perquè es pugui mostrar en una línia separada.
     */
    normalitzaNomAssignatura(name, code) {
        return String(name || code || '').replace(new RegExp(`\\s*¬\\(${this.escapaRegex(code)}\\)\\s*$`), '').trim();
    }

    escapaRegex(value) {
        return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    creaColumnaResum(student) {
        const stats = this.calculaResum(student);
        const rightCol = document.createElement('div');
        rightCol.className = 'ptv-right-col';

        const summary = document.createElement('section');
        summary.className = 'ptv-summary-card';
        summary.setAttribute('aria-labelledby', 'ptv-summary-ra-title');
        this.afegeixTitolSecció(summary, "Resultats d'Aprenentatge", 'ptv-summary-ra-title');
        this.afegeixStat(summary, 'Aprovats', stats.approvedRA, 'ok');
        this.afegeixStat(summary, 'Suspesos / NA', stats.failedRA, 'ko');
        this.afegeixStat(summary, 'Pendents', stats.pdtRA, 'pdt');
        this.afegeixStat(summary, 'Total avaluats', stats.totalRA, 'info');
        this.afegeixTitolSecció(summary, 'Mòduls', 'ptv-summary-modules-title', 'ptv-section-title--spaced');
        this.afegeixStat(summary, 'Aprovats', stats.matApproved, 'ok');
        this.afegeixStat(summary, 'A recuperar', stats.matFailed, 'ko');
        if (stats.matPdt > 0) this.afegeixStat(summary, 'Pendents', stats.matPdt, 'pdt');
        rightCol.appendChild(summary);

        if (stats.matRecover.length > 0) {
            rightCol.appendChild(this.creaRecuperacions(stats.matRecover));
        }

        const pdfButton = document.createElement('button');
        pdfButton.type = 'button';
        pdfButton.className = 'ptv-pdf-inline-btn';
        pdfButton.dataset.action = 'download-pdf';
        pdfButton.textContent = '⬇ Descarregar PDF';
        rightCol.appendChild(pdfButton);

        return rightCol;
    }

    calculaResum(student) {
        const stats = { totalRA: 0, approvedRA: 0, failedRA: 0, pdtRA: 0, matApproved: 0, matFailed: 0, matPdt: 0, matRecover: [] };

        (student.subjects || []).forEach(subject => {
            const finalClass = this.valueHelper.finalClass(subject.final);
            if (finalClass === 'pass') stats.matApproved++;
            else if (finalClass === 'fail') {
                stats.matFailed++;
                stats.matRecover.push(subject.name);
            } else if (finalClass === 'warn') stats.matPdt++;

            subject.ras.forEach(ra => {
                stats.totalRA++;
                const scoreClass = this.valueHelper.scoreClass(ra.raw);
                if (scoreClass === 'pass') stats.approvedRA++;
                else if (scoreClass === 'fail') stats.failedRA++;
                else if (scoreClass === 'pdt') stats.pdtRA++;
            });
        });

        return stats;
    }

    afegeixTitolSecció(container, text, id = '', extraClass = '') {
        const title = document.createElement('h2');
        title.className = ['ptv-section-title', extraClass].filter(Boolean).join(' ');
        if (id) title.id = id;
        title.textContent = text;
        container.appendChild(title);
    }

    afegeixStat(container, label, value, cls) {
        const row = document.createElement('div');
        row.className = 'ptv-stat-row';
        const labelSpan = document.createElement('span');
        labelSpan.className = 'ptv-s-label';
        labelSpan.textContent = label;
        const valueSpan = document.createElement('span');
        valueSpan.className = `ptv-s-num ${cls}`;
        valueSpan.textContent = String(value);
        row.append(labelSpan, valueSpan);
        container.appendChild(row);
    }

    creaRecuperacions(assignatures) {
        const card = document.createElement('div');
        card.className = 'ptv-recover-card';
        const title = document.createElement('h3');
        title.textContent = '⚠ A recuperar';
        const list = document.createElement('div');
        list.className = 'ptv-recover-list';
        assignatures.forEach(assignatura => {
            const chip = document.createElement('span');
            chip.className = 'ptv-recover-chip';
            chip.textContent = assignatura;
            list.appendChild(chip);
        });
        card.append(title, list);
        return card;
    }
}
