package com.jhonycar.backend.config;

import com.jhonycar.backend.entity.AppUser;
import com.jhonycar.backend.entity.enums.Role;
import com.jhonycar.backend.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        createUserIfNotExists("Administrador", "admin", "admin123", Role.ADMIN);
        createUserIfNotExists("Funcionario", "funcionario", "func123", Role.FUNCIONARIO);
    }

    private void createUserIfNotExists(String nome, String username, String rawPassword, Role role) {
        appUserRepository.findByUsername(username).ifPresentOrElse(
                user -> {
                },
                () -> appUserRepository.save(AppUser.builder()
                        .nome(nome)
                        .username(username)
                        .password(passwordEncoder.encode(rawPassword))
                        .role(role)
                        .build())
        );
    }
}
