package com.jhonycar.backend.service;

import com.jhonycar.backend.dto.auth.AuthResponse;
import com.jhonycar.backend.dto.auth.LoginRequest;
import com.jhonycar.backend.entity.AppUser;
import com.jhonycar.backend.exception.BadRequestException;
import com.jhonycar.backend.exception.ResourceNotFoundException;
import com.jhonycar.backend.repository.AppUserRepository;
import com.jhonycar.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final AppUserRepository appUserRepository;
    private final JwtService jwtService;

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password())
            );
        } catch (BadCredentialsException ex) {
            throw new BadRequestException("Usuario ou senha invalidos");
        }

        AppUser user = appUserRepository.findByUsername(request.username())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario nao encontrado"));

        User principal = new User(
                user.getUsername(),
                user.getPassword(),
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );

        String token = jwtService.generateToken(principal);
        return new AuthResponse(token, "Bearer", jwtService.getJwtExpirationMs() / 1000, user.getUsername(), user.getRole());
    }
}
