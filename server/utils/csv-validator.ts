export interface CsvRow {
  cedula: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  administrativeUnit: string;
  locationName: string;
  locationType?: string;
  locationAddress?: string;
  locationLat?: string;
  locationLng?: string;
  locationCapacity?: string;
  locationNotes?: string;
  state: string;
  municipality: string;
  parish: string;
  [key: string]: any;
}

export function validateCsvRow(row: CsvRow): string | null {
  if (
    !row.cedula ||
    !row.firstName ||
    !row.lastName ||
    !row.administrativeUnit ||
    !row.locationName ||
    !row.state ||
    !row.municipality ||
    !row.parish
  ) {
    return 'Faltan campos requeridos';
  }

  // Basic email validation if present
  if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    return 'Formato de correo electrónico inválido';
  }

  return null; // No errors
}
