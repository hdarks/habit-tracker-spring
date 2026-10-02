package com.hdarks.habittracker.service;

import com.hdarks.habittracker.dto.auth.AuthResponse;
import com.hdarks.habittracker.dto.auth.LoginRequest;
import com.hdarks.habittracker.dto.auth.RegisterRequest;
import com.hdarks.habittracker.entity.User;
import com.hdarks.habittracker.exception.DuplicateResourceException;
import com.hdarks.habittracker.exception.ResourceNotFoundException;
import com.hdarks.habittracker.repository.UserRepository;
import com.hdarks.habittracker.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("User already exists");
        }
        User user = User.builder().name(request.getName()).email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.USER).build();
        User savedUser = userRepository.save(user);
        UserDetails userDetails = userDetailsService.loadUserByUsername(savedUser.getEmail());
        String token = jwtService.generateToken(userDetails);
        return AuthResponse.builder().id(savedUser.getId()).name(savedUser.getName()).email(savedUser.getEmail())
                .role(savedUser.getRole().name()).token(token).createdAt(savedUser.getCreatedAt()).build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        User user = userRepository.findByEmail(request.getEmail()).orElseThrow(() ->
                new ResourceNotFoundException("Invalid credentials"));
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtService.generateToken(userDetails);
        return AuthResponse.builder().id(user.getId()).name(user.getName()).email(user.getEmail())
                .role(user.getRole().name()).token(token).createdAt(user.getCreatedAt()).build();
    }
}
