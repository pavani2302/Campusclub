package com.campusclub.controller;

import com.campusclub.entity.*; import com.campusclub.repository.UserRepository;
import jakarta.servlet.http.HttpSession; import jakarta.validation.Valid; import jakarta.validation.constraints.*;
import org.springframework.http.*; import org.springframework.security.crypto.password.PasswordEncoder; import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController @RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository users; private final PasswordEncoder encoder;
    public AuthController(UserRepository users, PasswordEncoder encoder){this.users=users;this.encoder=encoder;}
    public record RegisterRequest(@NotBlank String name,@Email @NotBlank String email,@NotBlank String password,String studentId,String department){}
    public record LoginRequest(@Email @NotBlank String email,@NotBlank String password){}
    @PostMapping("/register") public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest r){
        if(users.findByEmail(r.email()).isPresent()) return ResponseEntity.badRequest().body(Map.of("message","Email already registered"));
        User u=new User(); u.setName(r.name()); u.setEmail(r.email().toLowerCase()); u.setPassword(encoder.encode(r.password())); u.setStudentId(r.studentId()); u.setDepartment(r.department()); u.setRole(Role.STUDENT); users.save(u);
        return ResponseEntity.ok(Map.of("message","Registration successful. Please login."));
    }
    @PostMapping("/login") public ResponseEntity<?> login(@Valid @RequestBody LoginRequest r,HttpSession session){
        User u=users.findByEmail(r.email().toLowerCase()).orElse(null);
        if(u==null || !encoder.matches(r.password(),u.getPassword())) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message","Invalid email or password"));
        session.setAttribute("userId",u.getId()); return ResponseEntity.ok(Map.of("id",u.getId(),"name",u.getName(),"email",u.getEmail(),"role",u.getRole().name()));
    }
    @PostMapping("/logout") public ResponseEntity<?> logout(HttpSession session){session.invalidate();return ResponseEntity.ok(Map.of("message","Logged out"));}
    @GetMapping("/me") public ResponseEntity<?> me(HttpSession session){
        Object id=session.getAttribute("userId"); if(id==null) return ResponseEntity.status(401).body(Map.of("message","Not logged in"));
        User u=users.findById((Long)id).orElse(null); if(u==null)return ResponseEntity.status(401).body(Map.of("message","Not logged in"));
        return ResponseEntity.ok(Map.of("id",u.getId(),"name",u.getName(),"email",u.getEmail(),"role",u.getRole().name(),"studentId",u.getStudentId()==null?"":u.getStudentId(),"department",u.getDepartment()==null?"":u.getDepartment()));
    }
}
