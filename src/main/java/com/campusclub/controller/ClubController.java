package com.campusclub.controller;

import com.campusclub.entity.Club;
import com.campusclub.entity.Membership;
import com.campusclub.entity.User;
import com.campusclub.repository.ClubRepository;
import com.campusclub.repository.MembershipRepository;
import com.campusclub.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clubs")
public class ClubController {

    private final ClubRepository clubs;
    private final MembershipRepository members;
    private final UserRepository users;

    public ClubController(
            ClubRepository clubs,
            MembershipRepository members,
            UserRepository users
    ) {
        this.clubs = clubs;
        this.members = members;
        this.users = users;
    }

    // ---------------------------------------------------------
    // GET ALL CLUBS
    // ---------------------------------------------------------
    @GetMapping
    public List<Club> all() {
        return clubs.findAll();
    }

    // ---------------------------------------------------------
    // CREATE CLUB - ADMIN ONLY
    // ---------------------------------------------------------
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> create(@RequestBody Club club) {

        if (club.getName() == null || club.getName().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Club name is required"));
        }

        club.setId(null);

        Club saved = clubs.save(club);

        return ResponseEntity.ok(saved);
    }

    // ---------------------------------------------------------
    // DELETE CLUB - ADMIN ONLY
    // ---------------------------------------------------------
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {

        if (!clubs.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Club not found"));
        }

        clubs.deleteById(id);

        return ResponseEntity.ok(
                Map.of("message", "Club deleted successfully")
        );
    }

    // ---------------------------------------------------------
    // STUDENT JOIN CLUB
    // ---------------------------------------------------------
    @PostMapping("/{id}/join")
    public ResponseEntity<?> join(
            @PathVariable Long id,
            HttpSession session
    ) {

        Long userId = getUserId(session);

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please login first"));
        }

        if (!clubs.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Club not found"));
        }

        if (members.existsByClubIdAndUserId(id, userId)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Already a member of this club"));
        }

        Club club = clubs.findById(id).orElseThrow();
        User user = users.findById(userId).orElseThrow();

        Membership membership = new Membership();
        membership.setClub(club);
        membership.setUser(user);
        membership.setJoinedAt(LocalDate.now().toString());

        members.save(membership);

        return ResponseEntity.ok(
                Map.of("message", "Joined club successfully")
        );
    }

    // ---------------------------------------------------------
    // GET MY CLUBS
    // ---------------------------------------------------------
    @GetMapping("/mine")
    public List<Club> mine(HttpSession session) {

        Long userId = getUserId(session);

        if (userId == null) {
            return List.of();
        }

        return members.findByUserId(userId)
                .stream()
                .map(Membership::getClub)
                .toList();
    }

    // ---------------------------------------------------------
    // HELPER
    // ---------------------------------------------------------
    private Long getUserId(HttpSession session) {

        Object value = session.getAttribute("userId");

        if (value instanceof Long) {
            return (Long) value;
        }

        if (value instanceof Number) {
            return ((Number) value).longValue();
        }

        return null;
    }
}