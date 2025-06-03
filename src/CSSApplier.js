export class CSSApplier {
    constructor(logger) {
        this.logger = logger;
        this.injectStyles();
    }

    injectStyles() {
        if (document.getElementById('powertoy-styles')) return;

        const style = document.createElement('style');
        style.id = 'powertoy-styles';
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
        `;

        document.head.appendChild(style);
        this.logger.log('CSSApplier → estils injectats');
    }

    aplicaEstils() {
        const selects = document.querySelectorAll('tr.alturallistat select');

        selects.forEach(select => {
            const tr = select.closest('tr');
            if (!tr) return;

            // Neteja classes anteriors
            tr.classList.remove('powertoy-pass', 'powertoy-fail', 'powertoy-pendent', 'powertoy-proces');

            if (select.disabled || !select.value) {
                this.logger.log('CSSApplier → select desactivat o buit, no es pinta');
                return;
            }

            const value = select.value.replace('string:', '').toUpperCase();

            if (value === 'PDT' || value === 'PQ') {
                tr.classList.add('powertoy-pendent');
            } else if (value === 'EP') {
                tr.classList.add('powertoy-proces');
            } else if (value === 'NA') {
                tr.classList.add('powertoy-fail');
            } else if (/A(10|[5-9])/.test(value)) {
                tr.classList.add('powertoy-pass');
            } else {
                this.logger.warn(`CSSApplier → valor desconegut: ${value}`);
            }
        });
    }
}
