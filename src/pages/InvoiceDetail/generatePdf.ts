import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generateInvoicePdf = async (
  element: HTMLElement,
  fileName: string,
) => {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');

  const margin = 10;
  const pageWidth = 210;
  const pageHeight = 297;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;
  const imgHeight = (canvas.height * contentWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(
    imgData,
    'PNG',
    margin,
    position,
    contentWidth,
    imgHeight,
    '',
    'FAST',
  );
  heightLeft -= contentHeight;

  while (heightLeft > 0) {
    position = margin - (imgHeight - heightLeft);
    pdf.addPage();
    pdf.addImage(
      imgData,
      'PNG',
      margin,
      position,
      contentWidth,
      imgHeight,
      '',
      'FAST',
    );
    heightLeft -= contentHeight;
  }

  pdf.save(fileName);
};
