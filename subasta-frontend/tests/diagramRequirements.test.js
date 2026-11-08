import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('Diagram Requirements Specification (UX/UI & Business Rules)', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
    dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/' });
    document = dom.window.document;
    window = dom.window;
    global.window = window;
    global.document = document;
  });

  // 1. Interfaz Principal (Landing Page)
  describe('1. Interfaz Principal (Landing Page)', () => {
    it('should have brand "Subasta" in the top header with clean production UI', () => {
      const topSection = document.querySelector('.topbar, .landing-header, header');
      expect(topSection).not.toBeNull();
      // Header must contain the brand name — no draft labels or sketch notes
      expect(topSection.textContent).toContain('Subasta');
      // Must NOT contain sketch/diagram annotations in visible UI
      const visibleAnnotations = topSection.querySelector('[data-diagram-ref]');
      // diagram-ref elements must be screen-reader-only (not visible in production UI)
      if (visibleAnnotations) {
        const style = visibleAnnotations.className || '';
        expect(style).toContain('sr-only');
      }
    });

    it('should have "Subasta" near the main navigation area', () => {
      const brandOrTitle = document.querySelector('.brand, .topbar, header');
      expect(brandOrTitle.textContent).toContain('Subasta');
    });

    it('should have centered slogan with font-size 44.06 and exact text', () => {
      const slogan = document.querySelector('#heroSlogan, .hero-copy h1, .hero-slogan');
      expect(slogan).not.toBeNull();
      const normalizedText = slogan.textContent.replace(/\s+/g, ' ').trim();
      expect(normalizedText).toContain('Las buenas oportunidades Comienzan aquí');
      // Verify font size configuration
      const style = slogan.getAttribute('style') || '';
      const classes = slogan.className || '';
      expect(style.includes('44.06') || classes.includes('text-[44.06px]')).toBe(true);
    });

    it('should have an outlined block on the right with "Subastas Activas" feed without admin widgets', () => {
      const outlinedBox = document.querySelector('#activeAuctionsBox');
      expect(outlinedBox).not.toBeNull();
      expect(outlinedBox.textContent).toContain('Subastas Activas');
      const boxStyle = (outlinedBox.getAttribute('style') || '') + ' ' + (outlinedBox.className || '');
      expect(boxStyle).toMatch(/border|border-card|outlined/);
      const heroVisual = document.querySelector('.hero-visual');
      expect(heroVisual.querySelector('.bar-chart')).toBeNull();
      expect(heroVisual.textContent).not.toContain('Solicitudes recibidas');
    });

    it('should have "Crear Cuenta" and "Iniciar Sesión" buttons', () => {
      const createBtn = document.querySelector('#heroCreateAccountBtn, [data-hero-create]');
      const loginBtn = document.querySelector('#heroLoginBtn, [data-hero-login]');
      expect(createBtn).not.toBeNull();
      expect(loginBtn).not.toBeNull();
      expect(createBtn.textContent.trim()).toContain('Crear Cuenta');
      expect(loginBtn.textContent.trim()).toContain('Iniciar Sesión');
    });

    it('should have "Crear Cuenta" highlighted without developer note box in UI', () => {
      const createBtn = document.querySelector('#heroCreateAccountBtn');
      expect(createBtn).not.toBeNull();
      expect(createBtn.textContent.trim()).toContain('Crear Cuenta');
      const note = document.querySelector('#createAccountHighlightNote');
      expect(note).toBeNull();
    });
  });

  // 2. Navegación General y Roles
  describe('2. Navegación General y Roles', () => {
    it('should describe the 3 options menu with exact structure', () => {
      const navMenuDesc = document.querySelector('#menuStructureDesc, .drawer-description');
      expect(navMenuDesc).not.toBeNull();
      expect(navMenuDesc.textContent).toContain('Panel');
      expect(navMenuDesc.textContent).toContain('Registro');
      expect(navMenuDesc.textContent).toContain('Solicitudes');
    });

    it('should define the three roles in separate texts: Aprobador, Comprador, Vendedor', () => {
      const rolesContainer = document.querySelector('#systemRolesList, .system-roles-bar');
      expect(rolesContainer).not.toBeNull();
      expect(rolesContainer.textContent).toContain('Aprobador');
      expect(rolesContainer.textContent).toContain('Comprador');
      expect(rolesContainer.textContent).toContain('Vendedor');
    });

    it('should have "Menú hamburguesa " element and expanded options', () => {
      const hamburger = document.querySelector('#menuToggle');
      expect(hamburger).not.toBeNull();
      const hamburgerLabel = hamburger.getAttribute('aria-label') || hamburger.getAttribute('title') || hamburger.textContent;
      expect(hamburgerLabel).toContain('Menú hamburguesa');

      const drawer = document.querySelector('#navDrawer');
      expect(drawer).not.toBeNull();
      const drawerText = drawer.textContent.replace(/\s+/g, ' ');
      expect(drawerText).toContain('Centro de control');
      expect(drawerText).toContain('Solicitudes');
      expect(drawerText).toContain('Prox');
    });
  });

  // 3. Flujo de Perfil y Sesión
  describe('3. Flujo de Perfil y Sesión', () => {
    it('should have circular icon and note with logout JWT rule', () => {
      const avatarBtn = document.querySelector('#openAuth, .avatar');
      expect(avatarBtn).not.toBeNull();

      const profileRule = document.querySelector('#profileSessionRule, .profile-session-rule');
      expect(profileRule).not.toBeNull();
      const text = profileRule.textContent.replace(/\s+/g, ' ').trim();
      expect(text).toContain('Se abre un card con la info del usuario');
      expect(text).toContain('cerrar sesión eliminando el JWT que ya tenía');
    });
  });

  // 4. Flujos de Autenticación
  describe('4. Flujos de Autenticación (Formularios)', () => {
    it('should have required registration fields and instruction', () => {
      const onboardingView = document.querySelector('#onboardingView');
      expect(onboardingView).not.toBeNull();

      expect(onboardingView.querySelector('[name="email"]')).not.toBeNull();
      expect(onboardingView.querySelector('[name="password"]')).not.toBeNull();
      expect(onboardingView.querySelector('[name="telefono"]')).not.toBeNull();

      const instruction = onboardingView.querySelector('#onboardingDocInstruction, .onboarding-instruction');
      expect(instruction).not.toBeNull();
      expect(instruction.textContent.replace(/\s+/g, ' ')).toContain('Mismos campos hasta ahora, con la documentación obligatoria');

      const rule = onboardingView.querySelector('#emailValidationRule, .email-validation-rule');
      expect(rule).not.toBeNull();
      expect(rule.textContent.replace(/\s+/g, ' ')).toContain('Se requiere validar el correo antes de crear la cuenta');

      const toLogin = onboardingView.querySelector('#onboardingToLoginBtn, .to-login-link');
      expect(toLogin).not.toBeNull();
      expect(toLogin.textContent.replace(/\s+/g, ' ')).toContain('Opcion para ir a iniciar sesión si ya se tiene cuenta');
    });

    it('should have login fields: Correo - Telefono, Contraseña, and bidirectional links', () => {
      const loginView = document.querySelector('#loginView');
      expect(loginView).not.toBeNull();

      const identifierInput = loginView.querySelector('#loginIdentifier, #loginEmail');
      expect(identifierInput).not.toBeNull();
      const labelText = identifierInput.closest('label')?.textContent || '';
      expect(labelText).toContain('Correo - Telefono');

      const passInput = loginView.querySelector('#loginPassword, input[name="loginPassword"]');
      expect(passInput).not.toBeNull();

      const toRegister = loginView.querySelector('#loginToRegisterBtn');
      expect(toRegister).not.toBeNull();
      expect(toRegister.textContent.replace(/\s+/g, ' ')).toContain('En caso de no tener cuenta, poder ir al menú de crear cuenta');
    });

    it('should have registration success message screen with exact wording', () => {
      const successScreen = document.querySelector('#registrationSuccessMessage, .registration-success-card');
      expect(successScreen).not.toBeNull();
      const text = successScreen.textContent.replace(/\s+/g, ' ').trim();
      expect(text).toContain('Felicidades creaste la cuenta correctamente');
      expect(text).toContain('Para activarla, sigue los pasos que se mandaron a tu correo');
    });
  });

  // 5. Centro de Control de Solicitudes
  describe('5. Centro de Control de Solicitudes (Panel del Aprobador/Administrador)', () => {
    it('should have title "Centro de control solicitudes" and button "Refrescar"', () => {
      const reviewView = document.querySelector('#reviewView');
      expect(reviewView).not.toBeNull();

      const title = reviewView.querySelector('#reviewSectionTitle, h2');
      expect(title.textContent.replace(/\s+/g, ' ').trim()).toContain('Centro de control solicitudes');

      const refreshBtn = reviewView.querySelector('#refreshRequests');
      expect(refreshBtn).not.toBeNull();
      expect(refreshBtn.textContent.trim()).toContain('Refrescar');
    });

    it('should have vertical list of 4 states: En revisión, Recibido, Aprobado, Negado', () => {
      const statesList = document.querySelector('#reviewStatesList, .review-states-vertical');
      expect(statesList).not.toBeNull();
      const statesText = statesList.textContent.replace(/\s+/g, ' ');
      expect(statesText).toContain('En revisión');
      expect(statesText).toContain('Recibido');
      expect(statesText).toContain('Aprobado');
      expect(statesText).toContain('Negado');
    });

    it('should have selection card instruction pointing to card', () => {
      const cardInstruction = document.querySelector('#reviewSelectionInstruction, .review-card-instruction');
      expect(cardInstruction).not.toBeNull();
      expect(cardInstruction.textContent.replace(/\s+/g, ' ')).toContain('Al seleccionar alguna debe aparecer un card como el siguiente');
    });
  });

  // 6. Detalle del Card de Solicitud (Documentación y Estatus)
  describe('6. Detalle del Card de Solicitud (Documentación y Estatus)', () => {
    it('card should have multiple RFC rows, Pago row, preview and download actions, and status dropdown rule', async () => {
      const { renderDetail } = await import('../js/app.js');

      const mockDetail = {
        id: 1,
        folio: 'SOL-0001',
        tipo: 'COMPRADOR',
        estatus: 'NO_RECIBIDO',
        datos: {
          nombres: 'Roberto',
          apellidoPaterno: 'González',
          email: 'roberto@subasta.mx',
          telefono: '6671234567',
          rfc: 'GOGR850101XYZ',
          tipoPersona: 'FISICA',
          codigoPostal: '80000',
          calle: 'Av Principal 123',
          colonia: 'Centro',
          ciudad: 'Culiacán',
          estado: 'Sinaloa'
        },
        documentos: [
          { id: 1, tipoDocumento: 'RFC', nombreArchivo: 'RFC_Identificacion.pdf', previewUrl: '/doc/1', downloadUrl: '/down/1' },
          { id: 2, tipoDocumento: 'RFC', nombreArchivo: 'RFC_Fiscal.pdf', previewUrl: '/doc/2', downloadUrl: '/down/2' },
          { id: 3, tipoDocumento: 'Pago', nombreArchivo: 'Pago_Garantia.pdf', previewUrl: '/doc/3', downloadUrl: '/down/3' }
        ]
      };

      renderDetail(mockDetail, 'COMPRADOR', 1, document);

      const detailContent = document.querySelector('#detailContent');
      expect(detailContent).not.toBeNull();

      // Check document rows
      expect(detailContent.textContent).toContain('RFC');
      expect(detailContent.textContent).toContain('Pago');

      // Minimalist Actions: Eye and download buttons
      expect(detailContent.querySelector('.doc-preview-trigger, [data-preview-url]')).not.toBeNull();
      expect(detailContent.querySelector('a[download], [data-download-url]')).not.toBeNull();

      // Dropdown description & business rule
      const dropdownHelp = detailContent.querySelector('#dropdownStatusHelp, .status-dropdown-help');
      expect(dropdownHelp).not.toBeNull();
      expect(dropdownHelp.textContent.replace(/\s+/g, ' ')).toContain('Menú desplegable para cambiar el estatus de la solicitud');
      expect(dropdownHelp.textContent.replace(/\s+/g, ' ')).toContain('Menú desplegable por default aparece como no recibido, se puede cambiar a recibido para activar la cuenta');

      // Dropdown should contain "No recibido" as default
      const select = detailContent.querySelector('#newStatus');
      expect(select).not.toBeNull();
      const optionTexts = Array.from(select.options).map(o => o.text);
      expect(optionTexts).toContain('No recibido');
      expect(optionTexts).toContain('Recibido');
      expect(optionTexts).toContain('En revisión');
      expect(optionTexts).toContain('Aprobado');
      expect(optionTexts).toContain('Negado');
      expect(select.value).toBe('NO_RECIBIDO');
    });
  });
});
