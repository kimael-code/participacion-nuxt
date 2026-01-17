import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportData {
  cedula: string;
  firstName: string;
  lastName: string;
  unitName: string | null;
  status: 'participated' | 'not_participated' | 'pending';
  reason: string | null;
  registeredAt: string | null;
}

export const usePDFGenerator = () => {
  const store = useCompanyStore();
  const { selectedCompany } = storeToRefs(store);

  const generateReport = (
    data: ReportData[],
    eventName: string,
    filters: { status: string; unitName?: string },
  ) => {
    const doc = new jsPDF();
    const companyName =
      selectedCompany.value?.name || 'Sistema de Participación';
    const reportDate = new Date().toLocaleDateString();
    const companyLogo = selectedCompany.value?.logo;

    let startY = 20;

    // -- Logo (if available) --
    if (companyLogo) {
      try {
        // Add logo image (30x15mm at position 14, 10)
        doc.addImage(companyLogo, 'PNG', 14, 10, 30, 15);
        startY = 30; // Adjust text position
      } catch (error) {
        console.warn('Could not add logo to PDF:', error);
      }
    }

    // -- Header --
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(companyName.toUpperCase(), companyLogo ? 50 : 14, startY);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(
      `Reporte de Participación - ${eventName}`,
      companyLogo ? 50 : 14,
      startY + 10,
    );

    // Sub-header details
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Fecha de Emisión: ${reportDate}`, 14, startY + 20);

    let filterText = `Filtro Estatus: ${filters.status.toUpperCase()}`;
    if (filters.unitName) {
      filterText += ` | Unidad: ${filters.unitName}`;
    }
    doc.text(filterText, 14, startY + 25);

    // -- Stats --
    const total = data.length;
    const participated = data.filter((d) => d.status === 'participated').length;
    const notParticipated = data.filter(
      (d) => d.status === 'not_participated',
    ).length;
    const pending = data.filter((d) => d.status === 'pending').length;

    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(
      `Total: ${total} | Asistieron: ${participated} | No Asistieron: ${notParticipated} | Pendientes: ${pending}`,
      14,
      startY + 32,
    );

    // -- Table --
    const tableBody = data.map((item) => {
      let statusLabel = 'Pendiente';
      if (item.status === 'participated') statusLabel = 'ASISTIÓ';
      if (item.status === 'not_participated') statusLabel = 'NO ASISTIÓ';

      const time = item.registeredAt
        ? new Date(item.registeredAt).toLocaleTimeString()
        : '-';

      return [
        item.cedula,
        `${item.firstName} ${item.lastName}`,
        item.unitName || 'Sin Unidad',
        statusLabel,
        item.reason || '-',
        time,
      ];
    });

    autoTable(doc, {
      startY: startY + 40,
      head: [['Cédula', 'Nombre', 'Unidad', 'Estatus', 'Motivo', 'Hora']],
      body: tableBody,
      headStyles: {
        fillColor: [41, 128, 185], // Blue
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      // Color rows based on status
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          const status = data.cell.text[0];
          if (status === 'ASISTIÓ') {
            data.cell.styles.textColor = [34, 139, 34]; // Green
            data.cell.styles.fontStyle = 'bold';
          } else if (status === 'NO ASISTIÓ') {
            data.cell.styles.textColor = [220, 53, 69]; // Red
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [108, 117, 125]; // Gray
          }
        }
      },
    });

    // -- Footer (Page Numbers) --
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width - 20,
        doc.internal.pageSize.height - 10,
        { align: 'right' },
      );
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `reporte_${eventName.replace(/\s+/g, '_')}_${timestamp}.pdf`;
    doc.save(filename);
  };

  return {
    generateReport,
  };
};
