package com.subasta.service;

import com.subasta.dto.BuyerRegistrationDto;
import com.subasta.dto.SellerRegistrationDto;
import com.subasta.entity.Comprador;
import com.subasta.entity.Documento;
import com.subasta.entity.Usuario;
import com.subasta.entity.Vendedor;
import com.subasta.exception.DuplicateResourceException;
import com.subasta.repository.CompradorRepository;
import com.subasta.repository.DocumentoRepository;
import com.subasta.repository.UsuarioRepository;
import com.subasta.repository.VendedorRepository;
import com.subasta.security.JwtService;
import io.jsonwebtoken.Claims;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
public class OnboardingService {

    private final UsuarioRepository usuarioRepository;
    private final CompradorRepository compradorRepository;
    private final VendedorRepository vendedorRepository;
    private final DocumentoRepository documentoRepository;
    private final FileStorageService fileStorageService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public OnboardingService(UsuarioRepository usuarioRepository,
                             CompradorRepository compradorRepository,
                             VendedorRepository vendedorRepository,
                             DocumentoRepository documentoRepository,
                             FileStorageService fileStorageService,
                             PasswordEncoder passwordEncoder,
                             JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.compradorRepository = compradorRepository;
        this.vendedorRepository = vendedorRepository;
        this.documentoRepository = documentoRepository;
        this.fileStorageService = fileStorageService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    private Usuario validateVerifiedEmailAndCreateUser(String rawEmail, String verifiedEmailToken, String rawPassword, String rawTelefono, String rol) {
        if (rawEmail == null || rawEmail.isBlank()) {
            throw new IllegalArgumentException("El correo electrónico es obligatorio.");
        }
        String email = rawEmail.trim().toLowerCase();

        if (verifiedEmailToken == null || verifiedEmailToken.isBlank()) {
            throw new IllegalArgumentException("Debes verificar tu correo electrónico antes de completar el registro.");
        }
        try {
            Claims claims = jwtService.parseToken(verifiedEmailToken);
            if (!"EMAIL_VERIFIED".equals(claims.get("type", String.class))
                    || !email.equalsIgnoreCase(claims.getSubject())) {
                throw new IllegalArgumentException("El token de verificación de correo no corresponde al correo ingresado.");
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("El token de verificación de correo es inválido o ha expirado.");
        }

        if (usuarioRepository.existsByEmail(email)
                || compradorRepository.findByEmail(email).isPresent()
                || vendedorRepository.findByEmail(email).isPresent()) {
            throw new DuplicateResourceException("Ya existe un usuario registrado con este correo electrónico.");
        }

        String telefono = rawTelefono != null ? rawTelefono.trim() : null;
        if (telefono != null && !telefono.isBlank() && (
                usuarioRepository.existsByTelefono(telefono)
                        || compradorRepository.existsByTelefono(telefono)
                        || vendedorRepository.existsByTelefono(telefono))) {
            throw new DuplicateResourceException("Ya existe un usuario registrado con este número de teléfono.");
        }

        String effectivePassword = rawPassword != null && !rawPassword.isBlank()
                ? rawPassword
                : UUID.randomUUID().toString().substring(0, 8);

        if (rawPassword != null && !rawPassword.isBlank()) {
            if (!rawPassword.matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_+=\\-\\[\\]{}|;:,.<>])[A-Za-z\\d@$!%*?&#^()_+=\\-\\[\\]{}|;:,.<>]{8,}$")) {
                throw new IllegalArgumentException("La contraseña debe tener al menos 8 caracteres, incluyendo mayúscula, minúscula, número y carácter especial.");
            }
        }

        Usuario nuevo = new Usuario();
        nuevo.setEmail(email);
        nuevo.setPassword(passwordEncoder.encode(effectivePassword));
        nuevo.setRol(rol);
        nuevo.setActivo(false);
        nuevo.setEstatus("ENVIADO");
        nuevo.setFechaCreacion(LocalDateTime.now());
        return nuevo;
    }

    @Transactional
    public String registerBuyer(BuyerRegistrationDto dto, Map<String, MultipartFile> files) {
        String telefono = dto.getTelefono() != null ? dto.getTelefono().trim() : null;
        Usuario nuevo = validateVerifiedEmailAndCreateUser(dto.getEmail(), dto.getVerifiedEmailToken(), dto.getPassword(), telefono, "COMPRADOR");
        nuevo.setTelefono(telefono);
        Usuario user = usuarioRepository.save(nuevo);

        long count = compradorRepository.count() + 1;
        String folio = String.format("CMP-%04d", count);

        Comprador comprador = new Comprador();
        comprador.setFolio(folio);
        comprador.setUsuarioId(user.getId());
        comprador.setEmail(user.getEmail());
        comprador.setTelefono(dto.getTelefono());
        comprador.setTipoPersona(dto.getTipoPersona());
        comprador.setNombres(dto.getNombres());
        comprador.setApellidoPaterno(dto.getApellidoPaterno());
        comprador.setApellidoMaterno(dto.getApellidoMaterno());
        comprador.setFechaNacimiento(dto.getFechaNacimiento());
        comprador.setCurp(dto.getCurp());
        comprador.setContactoEmergencia(dto.getContactoEmergencia());
        comprador.setRazonSocial(dto.getRazonSocial());
        comprador.setFechaConstitucion(dto.getFechaConstitucion());
        comprador.setRfcRepresentante(dto.getRfcRepresentante());
        comprador.setCorreoCorporativo(dto.getCorreoCorporativo());
        comprador.setContactoCompras(dto.getContactoCompras());
        comprador.setRfc(dto.getRfc());
        comprador.setCalle(dto.getCalle());
        comprador.setCodigoPostal(dto.getCodigoPostal());
        comprador.setColonia(dto.getColonia());
        comprador.setCiudad(dto.getCiudad());
        comprador.setEstado(dto.getEstado());
        comprador.setEstatus("ENVIADO");
        comprador.setFechaCreacion(LocalDateTime.now());
        comprador.setFechaActualizacion(LocalDateTime.now());


        Comprador guardado = compradorRepository.save(comprador);

        if (files != null) {
            files.forEach((docType, file) -> {
                if (file != null && !file.isEmpty()) {
                    String savedPath = fileStorageService.saveFile(file, "CMP_" + guardado.getId() + "_" + docType);
                    Documento doc = new Documento(
                            "COMPRADOR",
                            guardado.getId(),
                            docType,
                            file.getOriginalFilename(),
                            savedPath
                    );
                    documentoRepository.save(doc);
                }
            });
        }

        return folio;
    }

    @Transactional
    public String registerSeller(SellerRegistrationDto dto, Map<String, MultipartFile> files) {
        String telefono = dto.getTelefono() != null ? dto.getTelefono().trim() : null;
        Usuario nuevo = validateVerifiedEmailAndCreateUser(dto.getEmail(), dto.getVerifiedEmailToken(), dto.getPassword(), telefono, "VENDEDOR");
        nuevo.setTelefono(telefono);
        Usuario user = usuarioRepository.save(nuevo);

        long count = vendedorRepository.count() + 1;
        String folio = String.format("VND-%04d", count);

        Vendedor vendedor = new Vendedor();
        vendedor.setFolio(folio);
        vendedor.setUsuarioId(user.getId());
        vendedor.setEmail(user.getEmail());
        vendedor.setTelefono(dto.getTelefono());
        vendedor.setTipoPersona(dto.getTipoPersona());
        vendedor.setNombres(dto.getNombres());
        vendedor.setApellidoPaterno(dto.getApellidoPaterno());
        vendedor.setApellidoMaterno(dto.getApellidoMaterno());
        vendedor.setFechaNacimiento(dto.getFechaNacimiento());
        vendedor.setCurp(dto.getCurp());
        vendedor.setFechaInicioActividades(dto.getFechaInicioActividades());
        vendedor.setRegimenFiscal(dto.getRegimenFiscal());
        vendedor.setActividadEconomica(dto.getActividadEconomica());
        vendedor.setRazonSocial(dto.getRazonSocial());
        vendedor.setFechaConstitucion(dto.getFechaConstitucion());
        vendedor.setNumeroNotaria(dto.getNumeroNotaria());
        vendedor.setNumeroEscritura(dto.getNumeroEscritura());
        vendedor.setCorreoCorporativo(dto.getCorreoCorporativo());
        vendedor.setCorreoContador(dto.getCorreoContador());
        vendedor.setRepNombre(dto.getRepNombre());
        vendedor.setRepRfc(dto.getRepRfc());
        vendedor.setRfc(dto.getRfc());
        vendedor.setCalle(dto.getCalle());
        vendedor.setNumero(dto.getNumero());
        vendedor.setCodigoPostal(dto.getCodigoPostal());
        vendedor.setColonia(dto.getColonia());
        vendedor.setCiudad(dto.getCiudad());
        String municipio = (dto.getMunicipio() != null && !dto.getMunicipio().isBlank())
                ? dto.getMunicipio()
                : (dto.getCiudad() != null && !dto.getCiudad().isBlank() ? dto.getCiudad() : "Culiacán");
        vendedor.setMunicipio(municipio);
        vendedor.setEstado(dto.getEstado());
        vendedor.setPais(dto.getPais() != null ? dto.getPais() : "México");
        vendedor.setDomicilioOperacion(dto.getDomicilioOperacion());
        vendedor.setEstatus("ENVIADO");
        vendedor.setFechaCreacion(LocalDateTime.now());
        vendedor.setFechaActualizacion(LocalDateTime.now());

        Vendedor guardado = vendedorRepository.save(vendedor);

        if (files != null) {
            files.forEach((docType, file) -> {
                if (file != null && !file.isEmpty()) {
                    String savedPath = fileStorageService.saveFile(file, "VND_" + guardado.getId() + "_" + docType);
                    Documento doc = new Documento(
                            "VENDEDOR",
                            guardado.getId(),
                            docType,
                            file.getOriginalFilename(),
                            savedPath
                    );
                    documentoRepository.save(doc);
                }
            });
        }

        return folio;
    }
}
