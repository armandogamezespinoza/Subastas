package com.subasta.service;

import com.subasta.exception.UnsupportedMediaTypeException;
import org.apache.tika.Tika;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.Set;

@Service
public class FileValidationService {

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/png"
    );

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".pdf",
            ".jpg",
            ".jpeg",
            ".png"
    );

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

    private final Tika tika = new Tika();

    public void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return;
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("El archivo excede el tamaño máximo permitido de 10 MB.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException("El nombre del archivo no puede estar vacío.");
        }

        // 1. Validar extensión de archivo
        String extension = getFileExtension(originalFilename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new UnsupportedMediaTypeException("Extensión no permitida: '" + extension + "'. Solo se permiten archivos .pdf, .jpg, .jpeg y .png.");
        }

        // 2. Inspección profunda de Magic Bytes mediante Apache Tika
        try (InputStream is = file.getInputStream()) {
            String detectedMimeType = tika.detect(is);
            if (!ALLOWED_MIME_TYPES.contains(detectedMimeType)) {
                throw new UnsupportedMediaTypeException("Contenido de archivo no permitido. Tipo MIME detectado: '" + detectedMimeType + "'. Solo se aceptan PDF, JPEG y PNG.");
            }
        } catch (UnsupportedMediaTypeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Error al inspeccionar el archivo", e);
        }
    }

    public String sanitizeExtension(String originalFilename) {
        String ext = getFileExtension(originalFilename).toLowerCase();
        return ALLOWED_EXTENSIONS.contains(ext) ? ext : ".pdf";
    }

    private String getFileExtension(String filename) {
        if (filename == null) return "";
        int dotIdx = filename.lastIndexOf('.');
        if (dotIdx >= 0) {
            return filename.substring(dotIdx);
        }
        return "";
    }
}

