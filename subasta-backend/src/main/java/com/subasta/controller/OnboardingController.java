package com.subasta.controller;

import com.subasta.dto.BuyerRegistrationDto;
import com.subasta.dto.SellerRegistrationDto;
import com.subasta.service.OnboardingService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/onboarding")
@CrossOrigin(origins = "*")
public class OnboardingController {

    private final OnboardingService onboardingService;

    public OnboardingController(OnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }

    @PostMapping(value = "/buyer", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<?> registerBuyer(
            @RequestPart("datos") BuyerRegistrationDto datos,
            @RequestParam(value = "cd-curp", required = false) MultipartFile curpFile,
            @RequestParam(value = "cd-rfc", required = false) MultipartFile rfcFile,
            @RequestParam(value = "cd-dom", required = false) MultipartFile domFile,
            @RequestParam(value = "cd-estado-cuenta", required = false) MultipartFile estadoCuentaFile,
            @RequestParam(value = "cd-ine", required = false) MultipartFile ineFile) {

        Map<String, MultipartFile> files = new HashMap<>();
        if (curpFile != null) files.put("CONSTANCIA_CURP", curpFile);
        if (rfcFile != null) files.put("CONSTANCIA_SITUACION_FISCAL", rfcFile);
        if (domFile != null) files.put("COMPROBANTE_DOMICILIO", domFile);
        if (estadoCuentaFile != null) files.put("ESTADO_CUENTA", estadoCuentaFile);
        if (ineFile != null) files.put("IDENTIFICACION_OFICIAL", ineFile);

        String folio = onboardingService.registerBuyer(datos, files);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "folio", folio,
                "mensaje", "Solicitud de comprador enviada exitosamente"
        ));
    }

    @PostMapping(value = "/seller", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<?> registerSeller(
            @RequestPart("datos") SellerRegistrationDto datos,
            @RequestParam(value = "d-ine", required = false) MultipartFile ineFile,
            @RequestParam(value = "d-curp", required = false) MultipartFile curpFile,
            @RequestParam(value = "d-situacion", required = false) MultipartFile situacionFile,
            @RequestParam(value = "d-dom", required = false) MultipartFile domFile,
            @RequestParam(value = "d-estado-cuenta", required = false) MultipartFile estadoCuentaFile,
            @RequestParam(value = "dm-acta", required = false) MultipartFile actaFile,
            @RequestParam(value = "dm-estatutos", required = false) MultipartFile estatutosFile,
            @RequestParam(value = "dm-ine-rep", required = false) MultipartFile ineRepFile,
            @RequestParam(value = "v-rep-poder", required = false) MultipartFile poderFile,
            @RequestParam(value = "v-aut-file", required = false) MultipartFile autFile) {

        Map<String, MultipartFile> files = new HashMap<>();
        if (ineFile != null) files.put("INE_IFE", ineFile);
        if (curpFile != null) files.put("CONSTANCIA_CURP", curpFile);
        if (situacionFile != null) files.put("CONSTANCIA_SITUACION_FISCAL", situacionFile);
        if (domFile != null) files.put("COMPROBANTE_DOMICILIO", domFile);
        if (estadoCuentaFile != null) files.put("ESTADO_CUENTA", estadoCuentaFile);
        if (actaFile != null) files.put("ACTA_CONSTITUTIVA", actaFile);
        if (estatutosFile != null) files.put("ESTATUTOS", estatutosFile);
        if (ineRepFile != null) files.put("IDENTIFICACION_REP", ineRepFile);
        if (poderFile != null) files.put("PODER_NOTARIAL", poderFile);
        if (autFile != null) files.put("AUTORIZACION_TERCERO", autFile);

        String folio = onboardingService.registerSeller(datos, files);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "folio", folio,
                "mensaje", "Solicitud de vendedor enviada exitosamente"
        ));
    }
}
