import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

/** Largura da página do PDF, em pontos (pt). */
const PDF_LARGURA_PT = 1800;

/** Lê as dimensões reais da imagem capturada. */
function dimensaoImagem(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => reject(new Error('Não foi possível ler as dimensões do bilhete.'));
    img.src = dataUrl;
  });
}

/**
 * Exporta o elemento do bilhete ( Bilhete.tsx ) para PNG ou PDF.
 * O elemento deve ter o tamanho final visível — a captura usa pixelRatio 2.
 */
export async function exportarBilhete(
  element: HTMLElement,
  formato: 'pdf' | 'png',
  fileBase: string
): Promise<void> {
  await document.fonts.ready;
  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    backgroundColor: '#0B0B0A',
    cacheBust: true,
    // O html-to-image copia para o clone as margens já resolvidas (ex.: mx-auto,
    // mt-7). Como o clone é enquadrado exatamente no tamanho do próprio elemento,
    // essas margens deslocavam o bilhete para dentro do quadro e cortavam-no.
    // Anulamos as margens apenas no clone — as do elemento original ficam intactas.
    style: { margin: '0px' },
  });

  if (formato === 'png') {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${fileBase}.png`;
    link.click();
    return;
  }

  // Página PDF com a proporção exata da imagem capturada (sem cortes nem distorção)
  const { w, h } = await dimensaoImagem(dataUrl);
  const altura = Math.round(((PDF_LARGURA_PT * h) / w) * 100) / 100;
  const pdf = new jsPDF({
    orientation: 'l',
    unit: 'pt',
    format: [PDF_LARGURA_PT, altura],
    compress: true,
  });
  pdf.addImage(dataUrl, 'PNG', 0, 0, PDF_LARGURA_PT, altura);
  pdf.save(`${fileBase}.pdf`);
}
