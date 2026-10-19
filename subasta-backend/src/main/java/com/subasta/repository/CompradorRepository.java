package com.subasta.repository;

import com.subasta.entity.Comprador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CompradorRepository extends JpaRepository<Comprador, Long> {
    Optional<Comprador> findByEmail(String email);
    Optional<Comprador> findByUsuarioId(Long usuarioId);
    Optional<Comprador> findByFolio(String folio);
    boolean existsByCurp(String curp);
    boolean existsByRfc(String rfc);
    long count();
}
