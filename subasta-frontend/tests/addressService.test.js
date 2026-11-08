import { describe, it, expect } from 'vitest';
import {
  getEstados,
  getMunicipios,
  getCodigosPostales,
  getColonias,
  getCalles,
  isValidMunicipio,
  isValidCodigoPostal,
  isValidColonia
} from '../js/services/addressService.js';

describe('Address Service (SEPOMEX Mexico Data & Cascading)', () => {
  it('should return all 32 Mexican states', () => {
    const estados = getEstados();
    expect(estados).toBeDefined();
    expect(estados.length).toBe(32);
    expect(estados).toContain('Sinaloa');
    expect(estados).toContain('Ciudad de México');
    expect(estados).toContain('Jalisco');
    expect(estados).toContain('Nuevo León');
  });

  it('should return municipalities for a selected state', () => {
    const municipiosSinaloa = getMunicipios('Sinaloa');
    expect(municipiosSinaloa).toBeDefined();
    expect(municipiosSinaloa.length).toBeGreaterThan(0);
    expect(municipiosSinaloa).toContain('Culiacán');
    expect(municipiosSinaloa).toContain('Mazatlán');
    expect(municipiosSinaloa).toContain('Ahome');

    const municipiosJalisco = getMunicipios('Jalisco');
    expect(municipiosJalisco).toContain('Guadalajara');
    expect(municipiosJalisco).toContain('Zapopan');
  });

  it('should return empty array for an invalid or empty state', () => {
    expect(getMunicipios('')).toEqual([]);
    expect(getMunicipios('EstadoInexistente')).toEqual([]);
  });

  it('should filter postal codes by query within a state and municipality', () => {
    // When typing postal code in Culiacán, Sinaloa
    const matches = getCodigosPostales('Sinaloa', 'Culiacán', '80');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every(cp => cp.codigoPostal.startsWith('80'))).toBe(true);
    expect(matches.some(cp => cp.codigoPostal === '80000')).toBe(true);
  });

  it('should return matching colonias as user types or based on postal code', () => {
    const coloniasByCp = getColonias('Sinaloa', 'Culiacán', '80000', '');
    expect(coloniasByCp.length).toBeGreaterThan(0);
    expect(coloniasByCp.some(col => col.toLowerCase().includes('centro'))).toBe(true);

    const coloniasByQuery = getColonias('Sinaloa', 'Culiacán', '', 'cent');
    expect(coloniasByQuery.length).toBeGreaterThan(0);
    expect(coloniasByQuery.some(col => col.toLowerCase().includes('centro'))).toBe(true);
  });

  it('should return matching street names as user types', () => {
    const calles = getCalles('Sinaloa', 'Culiacán', 'Centro', 'Alv');
    expect(calles.length).toBeGreaterThan(0);
    expect(calles.some(calle => calle.toLowerCase().includes('alvaro') || calle.toLowerCase().includes('álvaro'))).toBe(true);
  });

  it('should validate whether municipality, postal code and colonia are real', () => {
    expect(isValidMunicipio('Sinaloa', 'Culiacán')).toBe(true);
    expect(isValidMunicipio('Sinaloa', 'Guadalajara')).toBe(false);

    expect(isValidCodigoPostal('Sinaloa', 'Culiacán', '80000')).toBe(true);
    expect(isValidCodigoPostal('Sinaloa', 'Culiacán', '99999')).toBe(false);

    expect(isValidColonia('Sinaloa', 'Culiacán', '80000', 'Centro')).toBe(true);
    expect(isValidColonia('Sinaloa', 'Culiacán', '80000', 'ColoniaInexistenteFalsa')).toBe(false);
  });
});
