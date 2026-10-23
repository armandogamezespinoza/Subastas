package com.subasta.repository;

import com.subasta.entity.Documento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DocumentoRepository extends JpaRepository<Documento, Long> {
    List<Documento> findByTipoUsuarioAndRegistroId(String tipoUsuario, Long registroId);
}
