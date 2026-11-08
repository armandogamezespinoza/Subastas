/**
 * Address Service: Mexican postal and geographic cascading data & lookup service
 * (Estados, Municipios, Códigos Postales, Colonias y Calles)
 */

export const ESTADOS_MEXICO = [
  'Aguascalientes',
  'Baja California',
  'Baja California Sur',
  'Campeche',
  'Chiapas',
  'Chihuahua',
  'Ciudad de México',
  'Coahuila',
  'Colima',
  'Durango',
  'Guanajuato',
  'Guerrero',
  'Hidalgo',
  'Jalisco',
  'México',
  'Michoacán',
  'Morelos',
  'Nayarit',
  'Nuevo León',
  'Oaxaca',
  'Puebla',
  'Querétaro',
  'Quintana Roo',
  'San Luis Potosí',
  'Sinaloa',
  'Sonora',
  'Tabasco',
  'Tamaulipas',
  'Tlaxcala',
  'Veracruz',
  'Yucatán',
  'Zacatecas'
];

export const MUNICIPIOS_POR_ESTADO = {
  'Sinaloa': [
    'Ahome', 'Angostura', 'Badiraguato', 'Choix', 'Concordia', 'Cosalá',
    'Culiacán', 'El Fuerte', 'Elota', 'Escuinapa', 'Guasave', 'Mazatlán',
    'Mocorito', 'Navolato', 'Rosario', 'Salvador Alvarado', 'San Ignacio', 'Sinaloa'
  ],
  'Ciudad de México': [
    'Álvaro Obregón', 'Azcapotzalco', 'Benito Juárez', 'Coyoacán', 'Cuajimalpa de Morelos',
    'Cuauhtémoc', 'Gustavo A. Madero', 'Iztacalco', 'Iztapalapa', 'Magdalena Contreras',
    'Miguel Hidalgo', 'Milpa Alta', 'Tláhuac', 'Tlalpan', 'Venustiano Carranza', 'Xochimilco'
  ],
  'Jalisco': [
    'Guadalajara', 'Zapopan', 'San Pedro Tlaquepaque', 'Tonalá', 'Tlajomulco de Zúñiga',
    'Puerto Vallarta', 'Lagos de Moreno', 'Tepatitlán de Morelos', 'El Salto', 'Zapotlán el Grande'
  ],
  'Nuevo León': [
    'Monterrey', 'San Pedro Garza García', 'San Nicolás de los Garza', 'Guadalupe',
    'Apodaca', 'General Escobedo', 'Santa Catarina', 'Juárez', 'Cadereyta Jiménez'
  ],
  'México': [
    'Toluca', 'Ecatepec de Morelos', 'Naucalpan de Juárez', 'Tlalnepantla de Baz',
    'Nezahualcóyotl', 'Chimalhuacán', 'Cuautitlán Izcalli', 'Metepec', 'Huixquilucan'
  ],
  'Aguascalientes': ['Aguascalientes', 'Asientos', 'Calvillo', 'Jesús María', 'Rincón de Romos'],
  'Baja California': ['Mexicali', 'Tijuana', 'Ensenada', 'Tecate', 'Playas de Rosarito', 'San Quintín'],
  'Baja California Sur': ['La Paz', 'Los Cabos', 'Comondú', 'Loreto', 'Mulegé'],
  'Campeche': ['Campeche', 'Carmen', 'Champotón', 'Calkiní', 'Escárcega'],
  'Chiapas': ['Tuxtla Gutiérrez', 'Tapachula', 'San Cristóbal de las Casas', 'Comitán', 'Palenque'],
  'Chihuahua': ['Chihuahua', 'Juárez', 'Cuauhtémoc', 'Delicias', 'Parral', 'Nuevo Casas Grandes'],
  'Coahuila': ['Saltillo', 'Torreón', 'Monclova', 'Piedras Negras', 'Acuña'],
  'Colima': ['Colima', 'Manzanillo', 'Tecomán', 'Villa de Álvarez', 'Armería'],
  'Durango': ['Durango', 'Gómez Palacio', 'Lerdo', 'Santiago Papasquiaro'],
  'Guanajuato': ['León', 'Irapuato', 'Celaya', 'Salamanca', 'Guanajuato', 'San Miguel de Allende'],
  'Guerrero': ['Acapulco de Juárez', 'Chilpancingo de los Bravo', 'Zihuatanejo de Azueta', 'Iguala de la Independencia'],
  'Hidalgo': ['Pachuca de Soto', 'Mineral de la Reforma', 'Tulancingo de Bravo', 'Tula de Allende'],
  'Michoacán': ['Morelia', 'Uruapan', 'Zamora', 'Lázaro Cárdenas', 'Pátzcuaro'],
  'Morelos': ['Cuernavaca', 'Jiutepec', 'Cuautla', 'Temixco', 'Yautepec'],
  'Nayarit': ['Tepic', 'Bahía de Banderas', 'Compostela', 'Santiago Ixcuintla'],
  'Oaxaca': ['Oaxaca de Juárez', 'San Juan Bautista Tuxtepec', 'Salina Cruz', 'Juchitán de Zaragoza'],
  'Puebla': ['Puebla', 'Tehuacán', 'San Andrés Cholula', 'San Pedro Cholula', 'Atlixco'],
  'Querétaro': ['Querétaro', 'San Juan del Río', 'Corregidora', 'El Marqués', 'Tequisquiapan'],
  'Quintana Roo': ['Benito Juárez', 'Solidaridad', 'Othón P. Blanco', 'Cozumel', 'Tulum'],
  'San Luis Potosí': ['San Luis Potosí', 'Soledad de Graciano Sánchez', 'Ciudad Valles', 'Matehuala'],
  'Sonora': ['Hermosillo', 'Cajeme', 'Nogales', 'San Luis Río Colorado', 'Guaymas'],
  'Tabasco': ['Centro', 'Cárdenas', 'Comalcalco', 'Huimanguillo', 'Macuspana'],
  'Tamaulipas': ['Reynosa', 'Matamoros', 'Nuevo Laredo', 'Tampico', 'Ciudad Victoria'],
  'Tlaxcala': ['Tlaxcala', 'Apizaco', 'Chiautempan', 'Huamantla'],
  'Veracruz': ['Veracruz', 'Xalapa', 'Coatzacoalcos', 'Córdoba', 'Poza Rica de Hidalgo', 'Boca del Río'],
  'Yucatán': ['Mérida', 'Kanasín', 'Valladolid', 'Tizimín', 'Progreso'],
  'Zacatecas': ['Zacatecas', 'Guadalupe', 'Fresnillo', 'Jerez', 'Sombrerete']
};

export const CODIGOS_POSTALES_DATA = [
  // Sinaloa - Culiacán
  { estado: 'Sinaloa', municipio: 'Culiacán', codigoPostal: '80000', colonias: ['Centro', 'Primer Cuadro', 'Almada'], calles: ['Álvaro Obregón', 'Antonio Rosales', 'Ángel Flores', 'Ignacio Zaragoza', 'Ruperto L. Paliza', 'Francisco I. Madero'] },
  { estado: 'Sinaloa', municipio: 'Culiacán', codigoPostal: '80020', colonias: ['Gabriel Leyva', 'Industrial Bravo', 'Miguel Alemán'], calles: ['Calzada Heroico Colegio Militar', 'Río Culiacán', 'Juan José Ríos', 'Nicolás Bravo'] },
  { estado: 'Sinaloa', municipio: 'Culiacán', codigoPostal: '80040', colonias: ['Las Quintas', 'La Campiña', 'Isla Musala'], calles: ['Boulevard Sinaloa', 'Boulevard El Dorado', 'Dr. Mora', 'Isla del Carmen', 'Presa Valsequillo'] },
  { estado: 'Sinaloa', municipio: 'Culiacán', codigoPostal: '80100', colonias: ['Guadalupe', 'Lomas del Boulevard', 'Montebello'], calles: ['Río Mocorito', 'Río Humaya', 'Avenida Álvaro Obregón Sur', 'Cerro del Hombre'] },
  { estado: 'Sinaloa', municipio: 'Culiacán', codigoPostal: '80120', colonias: ['Infonavit Humaya', 'Vicente Lombardo Toledano', 'Fovissste Humaya'], calles: ['Boulevard Félix Castro', 'Boulevard Enrique Cabrera', 'Obrero Mundial'] },
  { estado: 'Sinaloa', municipio: 'Culiacán', codigoPostal: '80200', colonias: ['Tres Ríos', 'Desarrollo Urbano Tres Ríos'], calles: ['Boulevard Pedro Infante', 'Boulevard José Diego Valadés', 'Rotarismo', 'Enrique Sánchez Alonso'] },

  // Sinaloa - Mazatlán
  { estado: 'Sinaloa', municipio: 'Mazatlán', codigoPostal: '82000', colonias: ['Centro Histórico', 'Olas Altas', 'Playa Sur'], calles: ['Paseo Olas Altas', 'Ángel Flores', 'Carnaval', 'Belisario Domínguez', 'Niños Héroes'] },
  { estado: 'Sinaloa', municipio: 'Mazatlán', codigoPostal: '82100', colonias: ['Zona Dorada', 'Lomas de Mazatlán', 'Gaviotas'], calles: ['Avenida Camaron Sabalo', 'Avenida Playa Gaviotas', 'Avenida Rafael Buelna'] },
  { estado: 'Sinaloa', municipio: 'Mazatlán', codigoPostal: '82110', colonias: ['Marina Mazatlán', 'El Sabalo', 'Alamar'], calles: ['Boulevard Marina Mazatlán', 'Paseo de la Marina', 'Avenida del Delfín'] },

  // Sinaloa - Ahome
  { estado: 'Sinaloa', municipio: 'Ahome', codigoPostal: '81200', colonias: ['Centro', 'Scally', 'Fatima'], calles: ['Gabriel Leyva', 'Álvaro Obregón', 'Independencia', 'Heriberto Valdez'] },
  { estado: 'Sinaloa', municipio: 'Ahome', codigoPostal: '81210', colonias: ['Jiquilpan', 'Las Fuentes', 'Altamirano'], calles: ['Boulevard Antonio Rosales', 'Boulevard Jiquilpan', 'Justo Sierra'] },

  // CDMX - Cuauhtémoc
  { estado: 'Ciudad de México', municipio: 'Cuauhtémoc', codigoPostal: '06000', colonias: ['Centro', 'Centro Histórico'], calles: ['Avenida Juárez', 'Paseo de la Reforma', 'Madero', '5 de Mayo', 'Bolívar', 'República de Uruguay'] },
  { estado: 'Ciudad de México', municipio: 'Cuauhtémoc', codigoPostal: '06700', colonias: ['Roma Norte', 'Roma Sur'], calles: ['Álvaro Obregón', 'Insurgentes Sur', 'Orizaba', 'Colima', 'Tabasco', 'Jalapa'] },
  { estado: 'Ciudad de México', municipio: 'Cuauhtémoc', codigoPostal: '06100', colonias: ['Condesa', 'Hipódromo', 'Hipódromo Condesa'], calles: ['Amsterdam', 'Tamaulipas', 'Mazatlán', 'Michoacán', 'Alfonso Reyes'] },

  // CDMX - Benito Juárez
  { estado: 'Ciudad de México', municipio: 'Benito Juárez', codigoPostal: '03100', colonias: ['Del Valle Norte', 'Del Valle Centro', 'Del Valle Sur'], calles: ['Insurgentes Sur', 'Félix Cuevas', 'Gabriel Mancera', 'Universidad', 'División del Norte'] },
  { estado: 'Ciudad de México', municipio: 'Benito Juárez', codigoPostal: '03810', colonias: ['Nápoles', 'San Pedro de los Pinos'], calles: ['Avenida Patriotismo', 'Dakota', 'Pensilvania', 'Montecito', 'Viaducto Río Becerra'] },

  // CDMX - Miguel Hidalgo
  { estado: 'Ciudad de México', municipio: 'Miguel Hidalgo', codigoPostal: '11560', colonias: ['Polanco', 'Polanco Reforma', 'Granada'], calles: ['Campos Elíseos', 'Horacio', 'Homero', 'Moliere', 'Masaryk', 'Ejército Nacional'] },

  // Jalisco - Guadalajara
  { estado: 'Jalisco', municipio: 'Guadalajara', codigoPostal: '44100', colonias: ['Centro', 'Mexicaltzingo', 'Barranquitas'], calles: ['Avenida Juárez', 'Avenida Hidalgo', 'Paseo Alcalde', 'Calzada Independencia', 'Pedro Moreno'] },
  { estado: 'Jalisco', municipio: 'Guadalajara', codigoPostal: '44160', colonias: ['Americana', 'Lafayette', 'Moderna'], calles: ['Avenida Chapultepec', 'Avenida Niños Héroes', 'Libertad', 'López Cotilla', 'Morelos'] },

  // Jalisco - Zapopan
  { estado: 'Jalisco', municipio: 'Zapopan', codigoPostal: '45100', colonias: ['Centro Zapopan', 'Constitución', 'Tepeyac'], calles: ['Avenida Hidalgo', 'Avenida Laureles', 'Avenida Américas', 'Prolongación 20 de Noviembre'] },
  { estado: 'Jalisco', municipio: 'Zapopan', codigoPostal: '45116', colonias: ['Puerta de Hierro', 'Colinas de San Javier', 'Residencial Juan Manuel'], calles: ['Paseo Royal Country', 'Avenida Patria', 'Boulevard Puerta de Hierro', 'Paseo Andares'] },

  // Nuevo León - Monterrey
  { estado: 'Nuevo León', municipio: 'Monterrey', codigoPostal: '64000', colonias: ['Centro Monterrey', 'Barrio Antiguo'], calles: ['Avenida Constitución', 'Padre Mier', 'Morelos', 'Zaragoza', 'Zuazua', 'Melchor Ocampo'] },
  { estado: 'Nuevo León', municipio: 'Monterrey', codigoPostal: '64060', colonias: ['Obispado', 'Maria Luisa', 'Mirador'], calles: ['Avenida Hidalgo', 'Avenida Constitución', 'Muguerza', 'Belisario Domínguez'] },

  // Nuevo León - San Pedro Garza García
  { estado: 'Nuevo León', municipio: 'San Pedro Garza García', codigoPostal: '66220', colonias: ['Valle Oriente', 'Residencial San Agustín'], calles: ['Avenida Lázaro Cárdenas', 'Avenida Real San Agustín', 'Diego Rivera', 'Batallón de San Patricio'] },
  { estado: 'Nuevo León', municipio: 'San Pedro Garza García', codigoPostal: '66260', colonias: ['Del Valle', 'Fuentes del Valle'], calles: ['Calzada del Valle', 'Calzada San Pedro', 'Río Mississippi', 'Río Rosas'] }
];

// Helper to normalize strings for search (accents-insensitive)
export function normalizeStr(str) {
  if (!str) return '';
  return str.toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function getEstados() {
  return [...ESTADOS_MEXICO];
}

export function getMunicipios(estado) {
  if (!estado) return [];
  const found = Object.keys(MUNICIPIOS_POR_ESTADO).find(
    e => normalizeStr(e) === normalizeStr(estado)
  );
  return found ? [...MUNICIPIOS_POR_ESTADO[found]] : [];
}

export function getCodigosPostales(estado, municipio, query = '') {
  if (!estado || !municipio) return [];
  const normEstado = normalizeStr(estado);
  const normMun = normalizeStr(municipio);
  const normQuery = normalizeStr(query);

  const matched = CODIGOS_POSTALES_DATA.filter(item => {
    return normalizeStr(item.estado) === normEstado &&
           normalizeStr(item.municipio) === normMun &&
           (!normQuery || item.codigoPostal.startsWith(normQuery));
  });

  // If specific records not in database, generate representative postal code range for valid municipality
  if (matched.length === 0 && isValidMunicipio(estado, municipio)) {
    // Generate fallback base CP for municipalities not explicitly detailed
    return [];
  }

  return matched.map(item => ({
    codigoPostal: item.codigoPostal,
    colonias: item.colonias
  }));
}

export function getColonias(estado, municipio, codigoPostal = '', query = '') {
  if (!estado || !municipio) return [];
  const normEstado = normalizeStr(estado);
  const normMun = normalizeStr(municipio);
  const normCp = normalizeStr(codigoPostal);
  const normQuery = normalizeStr(query);

  const entries = CODIGOS_POSTALES_DATA.filter(item => {
    const matchLoc = normalizeStr(item.estado) === normEstado && normalizeStr(item.municipio) === normMun;
    if (!matchLoc) return false;
    if (normCp && item.codigoPostal !== normCp) return false;
    return true;
  });

  const coloniasSet = new Set();
  for (const entry of entries) {
    for (const col of entry.colonias) {
      if (!normQuery || normalizeStr(col).includes(normQuery)) {
        coloniasSet.add(col);
      }
    }
  }

  return Array.from(coloniasSet);
}

export function getCalles(estado, municipio, colonia = '', query = '') {
  if (!estado || !municipio) return [];
  const normEstado = normalizeStr(estado);
  const normMun = normalizeStr(municipio);
  const normCol = normalizeStr(colonia);
  const normQuery = normalizeStr(query);

  const entries = CODIGOS_POSTALES_DATA.filter(item => {
    const matchLoc = normalizeStr(item.estado) === normEstado && normalizeStr(item.municipio) === normMun;
    if (!matchLoc) return false;
    if (normCol && !item.colonias.some(c => normalizeStr(c) === normCol)) return false;
    return true;
  });

  const callesSet = new Set();
  for (const entry of entries) {
    for (const calle of entry.calles || []) {
      if (!normQuery || normalizeStr(calle).includes(normQuery)) {
        callesSet.add(calle);
      }
    }
  }

  return Array.from(callesSet);
}

export function isValidMunicipio(estado, municipio) {
  if (!estado || !municipio) return false;
  const list = getMunicipios(estado);
  return list.some(m => normalizeStr(m) === normalizeStr(municipio));
}

export function isValidCodigoPostal(estado, municipio, cp) {
  if (!estado || !municipio || !cp) return false;
  const list = getCodigosPostales(estado, municipio, '');
  if (list.length > 0) {
    return list.some(item => item.codigoPostal === cp);
  }
  // Generic validation for Mexican 5-digit CP if municipality is valid but not in sample catalog
  return isValidMunicipio(estado, municipio) && /^\d{5}$/.test(cp);
}

export function isValidColonia(estado, municipio, cp, colonia) {
  if (!estado || !municipio || !colonia) return false;
  const list = getColonias(estado, municipio, cp, '');
  if (list.length > 0) {
    return list.some(c => normalizeStr(c) === normalizeStr(colonia));
  }
  return colonia.trim().length >= 2;
}

export function initAddressCascade(doc = (typeof document !== 'undefined' ? document : null)) {
  if (!doc) return;
  const estadoSelect = doc.querySelector('#estadoSelect');
  const ciudadSelect = doc.querySelector('#ciudadSelect');
  const cpInput = doc.querySelector('#codigoPostalInput');
  const cpList = doc.querySelector('#cpList');
  const colInput = doc.querySelector('#coloniaInput');
  const colList = doc.querySelector('#coloniaList');
  const calleInput = doc.querySelector('#calleInput');
  const calleList = doc.querySelector('#calleList');

  if (!estadoSelect || !ciudadSelect) return;

  // 1. Populate Estados
  const estados = getEstados();
  const currentEstado = estadoSelect.value;
  estadoSelect.innerHTML = '<option value="">Selecciona un estado...</option>' +
    estados.map(edo => `<option value="${edo}" ${edo === currentEstado ? 'selected' : ''}>${edo}</option>`).join('');

  // 2. Cascade Ciudad / Municipio
  function handleEstadoChange() {
    const estado = estadoSelect.value;
    if (!estado) {
      ciudadSelect.innerHTML = '<option value="">Selecciona primero un estado...</option>';
      ciudadSelect.disabled = true;
      if (cpInput) { cpInput.value = ''; cpInput.disabled = true; }
      if (cpList) cpList.innerHTML = '';
      if (colInput) { colInput.value = ''; colInput.disabled = true; }
      if (colList) colList.innerHTML = '';
      if (calleInput) { calleInput.value = ''; calleInput.disabled = true; }
      if (calleList) calleList.innerHTML = '';
      return;
    }

    const municipios = getMunicipios(estado);
    ciudadSelect.innerHTML = '<option value="">Selecciona un municipio...</option>' +
      municipios.map(m => `<option value="${m}">${m}</option>`).join('');
    ciudadSelect.disabled = false;

    if (cpInput) { cpInput.value = ''; cpInput.disabled = true; }
    if (cpList) cpList.innerHTML = '';
    if (colInput) { colInput.value = ''; colInput.disabled = true; }
    if (colList) colList.innerHTML = '';
    if (calleInput) { calleInput.value = ''; calleInput.disabled = true; }
    if (calleList) calleList.innerHTML = '';
  }

  // 3. Cascade Código Postal
  function handleCiudadChange() {
    const estado = estadoSelect.value;
    const ciudad = ciudadSelect.value;
    if (!estado || !ciudad) {
      if (cpInput) { cpInput.value = ''; cpInput.disabled = true; }
      if (cpList) cpList.innerHTML = '';
      if (colInput) { colInput.value = ''; colInput.disabled = true; }
      if (colList) colList.innerHTML = '';
      if (calleInput) { calleInput.value = ''; calleInput.disabled = true; }
      if (calleList) calleList.innerHTML = '';
      return;
    }

    if (cpInput) cpInput.disabled = false;
    updateCpSuggestions();
    if (colInput) { colInput.value = ''; colInput.disabled = true; }
    if (colList) colList.innerHTML = '';
    if (calleInput) { calleInput.value = ''; calleInput.disabled = true; }
    if (calleList) calleList.innerHTML = '';
  }

  function updateCpSuggestions() {
    if (!cpList || !cpInput) return;
    const estado = estadoSelect.value;
    const ciudad = ciudadSelect.value;
    const query = cpInput.value.trim();
    const cps = getCodigosPostales(estado, ciudad, query);
    cpList.innerHTML = cps.map(item => `<option value="${item.codigoPostal}">CP ${item.codigoPostal} (${item.colonias.slice(0, 2).join(', ')})</option>`).join('');
  }

  // 4. Cascade Colonias
  function handleCpInput() {
    updateCpSuggestions();
    const estado = estadoSelect.value;
    const ciudad = ciudadSelect.value;
    const cp = cpInput ? cpInput.value.trim() : '';

    if (colInput) {
      colInput.disabled = false;
    }
    updateColoniaSuggestions();
  }

  function updateColoniaSuggestions() {
    if (!colList || !colInput) return;
    const estado = estadoSelect.value;
    const ciudad = ciudadSelect.value;
    const cp = cpInput ? cpInput.value.trim() : '';
    const query = colInput.value.trim();
    const colonias = getColonias(estado, ciudad, cp, query);
    colList.innerHTML = colonias.map(col => `<option value="${col}">${col}</option>`).join('');
  }

  // 5. Cascade Calles
  function handleColoniaInput() {
    updateColoniaSuggestions();
    if (calleInput) {
      calleInput.disabled = false;
    }
    updateCalleSuggestions();
  }

  function updateCalleSuggestions() {
    if (!calleList || !calleInput) return;
    const estado = estadoSelect.value;
    const ciudad = ciudadSelect.value;
    const colonia = colInput ? colInput.value.trim() : '';
    const query = calleInput.value.trim();
    const calles = getCalles(estado, ciudad, colonia, query);
    calleList.innerHTML = calles.map(calle => `<option value="${calle}">${calle}</option>`).join('');
  }

  estadoSelect.addEventListener('change', handleEstadoChange);
  ciudadSelect.addEventListener('change', handleCiudadChange);
  if (cpInput) {
    cpInput.addEventListener('input', handleCpInput);
    cpInput.addEventListener('change', handleCpInput);
  }
  if (colInput) {
    colInput.addEventListener('input', handleColoniaInput);
    colInput.addEventListener('change', handleColoniaInput);
  }
  if (calleInput) {
    calleInput.addEventListener('input', updateCalleSuggestions);
  }
}

