/**
 * Exporta la vista actual del visualitzador a PDF.
 */
export class VisualitzadorPdfExporter {
    constructor(
        canvasFactory = (typeof window !== 'undefined' ? window.html2canvas : null),
        pdfFactory = (typeof window !== 'undefined' ? (window.jspdf?.jsPDF || window.jsPDF) : null)
    ) {
        this.canvasFactory = canvasFactory;
        this.pdfFactory = pdfFactory;
    }

    /**
     * Captura el node actual i el desa com a PDF paginat.
     */
    async exporta(target, studentName = 'alumne') {
        target.classList.add('ptv-pdf-mode');
        await this.esperaFonts();

        try {
            const canvas = await this.canvasFactory(target, {
                scale: 1.5,
                useCORS: true,
                backgroundColor: '#0f0f13',
                logging: false,
                scrollX: 0,
                scrollY: 0,
                y: 0,
                onclone: clonedDocument => {
                    clonedDocument.querySelectorAll('.ptv-ra-pill, .ptv-total-pill, .ptv-provisional-pill').forEach(pill => {
                        pill.style.setProperty('color', 'transparent', 'important');
                        pill.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
                    });
                },
            });
            this.dibuixaNotesAlCanvas(canvas, target);
            const imgData = canvas.toDataURL('image/jpeg', 0.92);
            const pdf = new this.pdfFactory({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const firstPageTopPadding = 8;
            const usableW = pageW - margin * 2;
            const usableH = pageH - margin * 2;
            const imgH = (canvas.height * usableW) / canvas.width;

            let yOffset = 0;
            let page = 0;
            while (yOffset < imgH) {
                if (page > 0) pdf.addPage();
                pdf.setFillColor(15, 15, 19);
                pdf.rect(0, 0, pageW, pageH, 'F');
                const y = margin + (page === 0 ? firstPageTopPadding : 0) - yOffset;
                pdf.addImage(imgData, 'JPEG', margin, y, usableW, imgH);
                yOffset += usableH - (page === 0 ? firstPageTopPadding : 0);
                page++;
            }

            pdf.save(`${this.normalitzaNomFitxer(studentName)}_notes.pdf`);
        } finally {
            target.classList.remove('ptv-pdf-mode');
        }
    }

    /**
     * Dibuixa les notes al centre de cada distintiu després de capturar-ne el fons.
     */
    dibuixaNotesAlCanvas(canvas, target) {
        const context = canvas.getContext('2d');
        const targetRect = target.getBoundingClientRect();
        if (!context || !targetRect.width || !targetRect.height) return;

        const scaleX = canvas.width / targetRect.width;
        const scaleY = canvas.height / targetRect.height;
        const selectors = '.ptv-ra-pill, .ptv-total-pill, .ptv-provisional-pill';

        target.querySelectorAll(selectors).forEach(pill => {
            const text = pill.textContent.trim();
            if (!text) return;

            const rect = pill.getBoundingClientRect();
            const style = window.getComputedStyle(pill);
            const fontSize = Number.parseFloat(style.fontSize) || 16;
            const centerX = (rect.left - targetRect.left + rect.width / 2) * scaleX;
            const centerY = (rect.top - targetRect.top + rect.height / 2) * scaleY;

            context.fillStyle = style.color;
            context.font = `${style.fontStyle} ${style.fontWeight} ${fontSize * scaleY}px ${style.fontFamily}`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(text, centerX, centerY, Math.max(1, (rect.width - 8) * scaleX));
        });
    }

    async esperaFonts() {
        if (document.fonts?.ready) await document.fonts.ready;
        await new Promise(resolve => setTimeout(resolve, 120));
    }

    normalitzaNomFitxer(name) {
        return String(name || 'alumne')
            .replace(/[^a-zA-ZÀ-ÿ0-9 _-]/g, '')
            .trim()
            .replace(/\s+/g, '_') || 'alumne';
    }
}
