import { jsPDF } from "jspdf";
import { receiptLines, type OrderSnapshot } from "./guest-checkout";
import { storefront } from "../data/storefront.mjs";

export async function buildOrderPdf(order: OrderSnapshot) {
  // Guard before creating a document, including direct callers outside the UI.
  const lines = receiptLines(order);
  const lineHeight = 3.8;
  const pageHeight = Math.min(1200, Math.max(100, lines.length * lineHeight + 14));
  const pdf = new jsPDF({ unit: "mm", format: [80, pageHeight], compress: true });
  pdf.setFont("courier", "normal");
  pdf.setFontSize(9.5);
  pdf.setTextColor(0);
  pdf.setProperties({ title: `${storefront.brandName} DEMO - Comprobante no fiscal`, subject: "Pago de prueba simulado - sin cobro real" });
  let y = 8;
  for (const line of lines) {
    if (y > pageHeight - 8) {
      pdf.addPage([80, pageHeight]);
      y = 8;
      pdf.text(`${storefront.brandName} DEMO - NO FISCAL`, 5, y);
      y += lineHeight;
    }
    pdf.text(line, 5, y);
    y += lineHeight;
  }
  return pdf.output("blob");
}

export async function downloadOrderPdf(order: OrderSnapshot) {
  const blob = await buildOrderPdf(order);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${order.reference}.pdf`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}
