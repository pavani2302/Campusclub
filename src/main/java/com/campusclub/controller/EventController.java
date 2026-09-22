package com.campusclub.controller;

import com.campusclub.entity.Club;
import com.campusclub.entity.Event;
import com.campusclub.entity.EventRegistration;
import com.campusclub.entity.User;
import com.campusclub.repository.ClubRepository;
import com.campusclub.repository.EventRegistrationRepository;
import com.campusclub.repository.EventRepository;
import com.campusclub.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventRepository events;
    private final ClubRepository clubs;
    private final EventRegistrationRepository regs;
    private final UserRepository users;

    public EventController(
            EventRepository events,
            ClubRepository clubs,
            EventRegistrationRepository regs,
            UserRepository users
    ) {
        this.events = events;
        this.clubs = clubs;
        this.regs = regs;
        this.users = users;
    }

    // ---------------------------------------------------------
    // GET ALL EVENTS
    // ---------------------------------------------------------
    @GetMapping
    public List<Event> all() {
        return events.findAllByOrderByEventDateAsc();
    }

    // ---------------------------------------------------------
    // EVENT REQUEST
    // ---------------------------------------------------------
    public record EventRequest(
            String title,
            String description,
            String eventDate,
            String venue,
            Long clubId
    ) {
    }

    // ---------------------------------------------------------
    // CREATE EVENT - ADMIN ONLY
    // ---------------------------------------------------------
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> create(
            @RequestBody EventRequest request
    ) {

        if (request.title() == null || request.title().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Event title is required"));
        }

        if (request.clubId() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Please select a club"));
        }

        Club club = clubs.findById(request.clubId()).orElse(null);

        if (club == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Club not found"));
        }

        Event event = new Event();

        event.setTitle(request.title().trim());
        event.setDescription(
                request.description() == null
                        ? ""
                        : request.description().trim()
        );
        event.setEventDate(request.eventDate());
        event.setVenue(request.venue());
        event.setClub(club);

        Event saved = events.save(event);

        return ResponseEntity.ok(saved);
    }

    // ---------------------------------------------------------
    // DELETE EVENT - ADMIN ONLY
    // ---------------------------------------------------------
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(
            @PathVariable Long id
    ) {

        if (!events.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Event not found"));
        }

        events.deleteById(id);

        return ResponseEntity.ok(
                Map.of("message", "Event deleted successfully")
        );
    }

    // ---------------------------------------------------------
    // STUDENT REGISTER FOR EVENT
    // ---------------------------------------------------------
    @PostMapping("/{id}/register")
    public ResponseEntity<?> register(
            @PathVariable Long id,
            HttpSession session
    ) {

        Long userId = getUserId(session);

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please login first"));
        }

        if (!events.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Event not found"));
        }

        if (regs.existsByEventIdAndUserId(id, userId)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Already registered for this event"));
        }

        Event event = events.findById(id).orElseThrow();
        User user = users.findById(userId).orElseThrow();

        EventRegistration registration = new EventRegistration();

        registration.setEvent(event);
        registration.setUser(user);

        // false = absent until admin marks Present
        registration.setAttended(false);

        regs.save(registration);

        return ResponseEntity.ok(
                Map.of("message", "Registered for event successfully")
        );
    }

    // ---------------------------------------------------------
    // MY EVENT REGISTRATIONS
    // ---------------------------------------------------------
    @GetMapping("/mine")
    public List<EventRegistration> mine(
            HttpSession session
    ) {

        Long userId = getUserId(session);

        if (userId == null) {
            return List.of();
        }

        return regs.findByUserId(userId);
    }

    // ---------------------------------------------------------
    // ADMIN - VIEW EVENT REGISTRATIONS
    // ---------------------------------------------------------
    @GetMapping("/{id}/registrations")
    @PreAuthorize("hasRole('ADMIN')")
    public List<EventRegistration> registrations(
            @PathVariable Long id
    ) {

        return regs.findByEventId(id);
    }

    // ---------------------------------------------------------
    // ADMIN - MARK ATTENDANCE
    // ---------------------------------------------------------
    @PutMapping("/registrations/{registrationId}/attendance")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> attendance(
            @PathVariable Long registrationId,
            @RequestParam boolean attended
    ) {

        EventRegistration registration =
                regs.findById(registrationId).orElse(null);

        if (registration == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Registration not found"));
        }

        registration.setAttended(attended);

        regs.save(registration);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        attended
                                ? "Student marked Present"
                                : "Student marked Absent"
                )
        );
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