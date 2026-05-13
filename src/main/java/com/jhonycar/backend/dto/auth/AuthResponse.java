package com.jhonycar.backend.dto.auth;

import com.jhonycar.backend.entity.enums.Role;

public record AuthResponse(
        String token,
        String type,
        long expiresIn,
        String username,
        Role role
) {
}
