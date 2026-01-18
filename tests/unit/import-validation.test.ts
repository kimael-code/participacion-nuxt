import { describe, expect, it } from 'vitest';
import { validateCsvRow } from '../../server/utils/csv-validator';

describe('CSV Validator', () => {
  it('should return null for valid row', () => {
    const validRow = {
      cedula: '12345678',
      firstName: 'John',
      lastName: 'Doe',
      administrativeUnit: 'IT',
      locationName: 'HQ',
      state: 'State',
      municipality: 'Muni',
      parish: 'Parish',
    };
    expect(validateCsvRow(validRow)).toBeNull();
  });

  it('should return error if missing required fields', () => {
    const invalidRow = {
      cedula: '12345678',
      // firstName missing
      lastName: 'Doe',
      administrativeUnit: 'IT',
      locationName: 'HQ',
      state: 'State',
      municipality: 'Muni',
      parish: 'Parish',
    };
    // @ts-expect-error testing runtime validation
    expect(validateCsvRow(invalidRow)).toBe('Faltan campos requeridos');
  });

  it('should validate email format', () => {
    const rowWithBadEmail = {
      cedula: '12345678',
      firstName: 'John',
      lastName: 'Doe',
      administrativeUnit: 'IT',
      locationName: 'HQ',
      state: 'State',
      municipality: 'Muni',
      parish: 'Parish',
      email: 'invalid-email',
    };
    expect(validateCsvRow(rowWithBadEmail)).toBe(
      'Formato de correo electrónico inválido',
    );
  });
});
