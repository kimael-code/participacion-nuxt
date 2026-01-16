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

    // -- Header --
    doc.setFontSize(18);
    doc.text(companyName.toUpperCase(), 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Reporte de Participación - ${eventName}`, 14, 30);

    // Sub-header details
    doc.setFontSize(10);
    doc.text(`Fecha de Emisión: ${reportDate}`, 14, 40);

    let filterText = `Filtro Estatus: ${filters.status.toUpperCase()}`;
    if (filters.unitName) {
      filterText += ` | Unidad: ${filters.unitName}`;
    }
    doc.text(filterText, 14, 45);

    // -- Stats --
    const total = data.length;
    doc.text(`Total Registros: ${total}`, 14, 52);

    // -- Table --
    const tableBody = data.map((item) => {
      let statusLabel = 'Pendiente';
      if (item.status === 'participated') statusLabel = 'ASISTiÓ';
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
      startY: 60,
      head: [['Cédula', 'Nombre', 'Unidad', 'Estatus', 'Motivo', 'Hora']],
      body: tableBody,
      headStyles: {
        fillColor: [41, 128, 185], // Brand colorish
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

    doc.save(`reporte_${eventName.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
  };

  return {
    generateReport,
  };
};
