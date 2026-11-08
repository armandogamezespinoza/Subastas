package com.subasta.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        String token = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        } else if (request.getParameter("token") != null && !request.getParameter("token").isBlank()) {
            token = request.getParameter("token");
        }

        if (token != null) {
            try {
                Claims claims = jwtService.parseToken(token);
                String email = claims.getSubject();
                String type = claims.get("type", String.class);

                if ("ACCESS_TOKEN".equals(type)) {
                    String rol = claims.get("rol", String.class);
                    if (rol != null && ("ADMIN".equalsIgnoreCase(rol) || "ADMINISTRATOR".equalsIgnoreCase(rol))) {
                        rol = "ADMINISTRADOR";
                    }
                    var authorities = new java.util.ArrayList<SimpleGrantedAuthority>();
                    if (rol != null) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + rol.toUpperCase()));
                        if ("ADMINISTRADOR".equalsIgnoreCase(rol)) {
                            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                        }
                    }
                    var auth = new UsernamePasswordAuthenticationToken(
                            email,
                            null,
                            authorities
                    );
                    SecurityContextHolder.getContext().setAuthentication(auth);
                } else if ("EMAIL_VERIFIED".equals(type)) {
                    request.setAttribute("verifiedEmail", email);
                }
            } catch (Exception e) {
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }
}
