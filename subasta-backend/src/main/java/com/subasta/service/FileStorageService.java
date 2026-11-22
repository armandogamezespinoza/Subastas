package com.subasta.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path uploadPath;
    private final FileValidationService fileValidationService;

    public FileStorageService(@Value("${app.upload.dir:./uploads}") String uploadDir,
                              FileValidationService fileValidationService) {
        this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.fileValidationService = fileValidationService;
        try {
            Files.createDirectories(this.uploadPath);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }
    }

    public Path getUploadPath() {
        return this.uploadPath;
    }

    /**
     * Resuelve de forma segura la ruta de un archivo almacenado, protegiendo contra Path Traversal.
     * Solo permite acceder a archivos dentro del directorio configurado uploadPath.
     */
    public Path resolveFile(String storedPath) {
        if (storedPath == null || storedPath.isBlank()) {
            return null;
        }
        try {
            // 1. Verificar si la ruta absoluta normalize() pertenece a uploadPath
            Path candidate = Paths.get(storedPath).toAbsolutePath().normalize();
            if (candidate.startsWith(this.uploadPath) && Files.isRegularFile(candidate)) {
                return candidate;
            }

            // 2. Si no es ruta absoluta válida en uploadPath, buscar únicamente por el nombre base (filename)
            // de modo que secuencias como '../' o '/etc/' no puedan escapar de uploadPath.
            Path filenameOnly = Paths.get(storedPath).getFileName();
            if (filenameOnly != null) {
                Path inUploadDir = this.uploadPath.resolve(filenameOnly).toAbsolutePath().normalize();
                if (inUploadDir.startsWith(this.uploadPath) && Files.isRegularFile(inUploadDir)) {
                    return inUploadDir;
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    /**
     * Valida mediante magic bytes (Tika) y extensión, y almacena el archivo con un UUID aleatorio.
     */
    public String saveFile(MultipartFile file, String prefix) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        // Inspección y validación obligatoria contra archivos maliciosos y tipos no permitidos
        fileValidationService.validate(file);

        try {
            String sanitizedPrefix = (prefix != null ? prefix.replaceAll("[^a-zA-Z0-9_-]", "") : "doc");
            String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.pdf";
            String fileExtension = fileValidationService.sanitizeExtension(originalFilename);

            String savedFileName = sanitizedPrefix + "_" + UUID.randomUUID() + fileExtension;
            Path targetLocation = this.uploadPath.resolve(savedFileName).normalize();

            // Garantizar que targetLocation no escapa de uploadPath
            if (!targetLocation.startsWith(this.uploadPath)) {
                throw new SecurityException("Intento de path traversal detectado en nombre de archivo");
            }

            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return targetLocation.toString();
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }
}
