package com.subasta.service;

import com.subasta.dto.BuyerRegistrationDto;
import com.subasta.dto.SellerRegistrationDto;
import com.subasta.entity.Comprador;
import com.subasta.entity.Documento;
import com.subasta.entity.Usuario;
import com.subasta.entity.Vendedor;
import com.subasta.repository.CompradorRepository;
import com.subasta.repository.DocumentoRepository;
import com.subasta.repository.UsuarioRepository;
import com.subasta.repository.VendedorRepository;
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

    public OnboardingService(UsuarioRepository usuarioRepository,
                             CompradorRepository compradorRepository,
                             VendedorRepository vendedorRepository,
                             DocumentoRepository documentoRepository,
                             FileStorageService fileStorageService,
                             PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.compradorRepository = compradorRepository;
        this.vendedorRepository = vendedorRepository;
        this.documentoRepository = documentoRepository;
        this.fileStorageService = fileStorageService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public String registerBuyer(BuyerRegistrationDto dto, Map<String, MultipartFile> files) {
        Usuario user = usuarioRepository.findByEmail(dto.getEmail())
                .orElseGet(() -> {
                    String rawPassword = dto.getPassword() != null && !dto.getPassword().isBlank() 
                            ? dto.getPassword() 
                            : UUID.randomUUID().toString().substring(0, 8);
                    
                    Usuario nuevo = new Usuario();
                    nuevo.setEmail(dto.getEmail());
                    nuevo.setPassword(passwordEncoder.encode(rawPassword));
                    nuevo.setRol("COMPRADOR");
                    nuevo.setActivo(true);
                    nuevo.setFechaCreacion(LocalDateTime.now());
                    return usuarioRepository.save(nuevo);
                });

        long count = compradorRepository.count() + 1;
        String folio = String.format("CMP-%04d", count);

        Comprador comprador = new Comprador();
        comprador.setFolio(folio);
        comprador.setUsuarioId(user.getId());
        comprador.setEmail(dto.getEmail());
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
        comprador.setFechaCreacion(LocalDateTime.now());

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
        Usuario user = usuarioRepository.findByEmail(dto.getEmail())
                .orElseGet(() -> {
                    String rawPassword = dto.getPassword() != null && !dto.getPassword().isBlank() 
                            ? dto.getPassword() 
                            : UUID.randomUUID().toString().substring(0, 8);
                    
                    Usuario nuevo = new Usuario();
                    nuevo.setEmail(dto.getEmail());
                    nuevo.setPassword(passwordEncoder.encode(rawPassword));
                    nuevo.setRol("VENDEDOR");
                    nuevo.setActivo(true);
                    nuevo.setFechaCreacion(LocalDateTime.now());
                    return usuarioRepository.save(nuevo);
                });

        long count = vendedorRepository.count() + 1;
        String folio = String.format("VND-%04d", count);

        Vendedor vendedor = new Vendedor();
        vendedor.setFolio(folio);
        vendedor.setUsuarioId(user.getId());
        vendedor.setEmail(dto.getEmail());
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
        vendedor.setMunicipio(dto.getMunicipio());
        vendedor.setEstado(dto.getEstado());
        vendedor.setPais(dto.getPais() != null ? dto.getPais() : "México");
        vendedor.setDomicilioOperacion(dto.getDomicilioOperacion());
        vendedor.setEstatus("ENVIADO");
        vendedor.setFechaCreacion(LocalDateTime.now());

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
