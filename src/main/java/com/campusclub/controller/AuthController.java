```java
package com.campusclub.controller;

import com.campusclub.entity.Role;
import com.campusclub.entity.User;
import com.campusclub.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository users;
    private final PasswordEncoder encoder;

    private final SecurityContextRepository securityContextRepository =
            new HttpSessionSecurityContextRepository();

    public AuthController(
            UserRepository users,
            PasswordEncoder encoder
    ) {
        this.users = users;
        this.encoder = encoder;
    }

    public record RegisterRequest(

            @NotBlank(message = "Name is required")
            String name,

            @Email(message = "Enter a valid email address")
            @NotBlank(message = "Email is required")
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 6, message = "Password must be at least 6 characters")
            String password,

            String studentId,

            String department
    ) {
    }

    public record LoginRequest(

            @Email(message = "Enter a valid email address")
            @NotBlank(message = "Email is required")
            String email,

            @NotBlank(message = "Password is required")
            String password
    ) {
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @Valid @RequestBody RegisterRequest request
    ) {

        String email = request.email().trim().toLowerCase();

        if (users.findByEmail(email).isPresent()) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            "Email already registered"
                    ));
        }

        User user = new User();

        user.setName(request.name().trim());
        user.setEmail(email);

        user.setPassword(
                encoder.encode(request.password())
        );

        user.setStudentId(
                request.studentId() == null ||
                request.studentId().trim().isEmpty()
                        ? null
                        : request.studentId().trim()
        );

        user.setDepartment(
                request.department() == null ||
                request.department().trim().isEmpty()
                        ? null
                        : request.department().trim()
        );

        user.setRole(Role.STUDENT);

        users.save(user);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Registration successful. Please login."
                )
        );
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {

        String email = request.email().trim().toLowerCase();

        User user = users.findByEmail(email).orElse(null);

        if (user == null ||
                !encoder.matches(
                        request.password(),
                        user.getPassword()
                )) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "message",
                            "Invalid email or password"
                    ));
        }

        String authority =
                "ROLE_" + user.getRole().name();

        Authentication authentication =
                new UsernamePasswordAuthenticationToken(
                        user.getEmail(),
                        null,
                        List.of(
                                new SimpleGrantedAuthority(authority)
                        )
                );

        SecurityContext context =
                SecurityContextHolder.createEmptyContext();

        context.setAuthentication(authentication);

        SecurityContextHolder.setContext(context);

        securityContextRepository.saveContext(
                context,
                httpRequest,
                httpResponse
        );

        HttpSession session = httpRequest.getSession(true);

        session.setAttribute(
                "userId",
                user.getId()
        );

        return ResponseEntity.ok(
                Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "role", user.getRole().name()
                )
        );
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            HttpServletRequest request
    ) {

        SecurityContextHolder.clearContext();

        HttpSession session = request.getSession(false);

        if (session != null) {
            session.invalidate();
        }

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Logged out successfully"
                )
        );
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(
            HttpSession session
    ) {

        Object id = session.getAttribute("userId");

        if (id == null) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "message",
                            "Not logged in"
                    ));
        }

        User user = users.findById((Long) id).orElse(null);

        if (user == null) {

            session.invalidate();

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "message",
                            "Not logged in"
                    ));
        }

        return ResponseEntity.ok(
                Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "role", user.getRole().name(),
                        "studentId",
                        user.getStudentId() == null
                                ? ""
                                : user.getStudentId(),
                        "department",
                        user.getDepartment() == null
                                ? ""
                                : user.getDepartment()
                )
        );
    }
}
```
