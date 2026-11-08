package com.subasta.repository;

import com.subasta.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    Optional<Usuario> findByTelefono(String telefono);
    Optional<Usuario> findByEmailOrTelefono(String email, String telefono);
    boolean existsByEmail(String email);
}
