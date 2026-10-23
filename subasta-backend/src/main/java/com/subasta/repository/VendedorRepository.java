package com.subasta.repository;

import com.subasta.entity.Vendedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface VendedorRepository extends JpaRepository<Vendedor, Long> {
    Optional<Vendedor> findByEmail(String email);
    Optional<Vendedor> findByUsuarioId(Long usuarioId);
    Optional<Vendedor> findByFolio(String folio);
    boolean existsByCurp(String curp);
    boolean existsByRfc(String rfc);
    long count();
}
