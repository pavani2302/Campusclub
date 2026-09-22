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

    @GetMapping
    public List<Event> all() {
        return events.findAllByOrderByEventDateAsc();
    }

    public record EventRequest(
            String title,
            String description,
            String eventDate,
            String venue,
            Long clubId
    ) {
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> create(
            @RequestBody EventRequest request
    ) {

        Club club =
                clubs.findById(request.clubId()).orElse(null);

        if (club == null) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            "Club not found"
                    ));
        }

        Event event = new Event();

        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setEventDate(request.eventDate());
        event.setVenue(request.venue());
        event.setClub(club);

        return ResponseEntity.ok(
                events.save(event)
        );
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        events.deleteById(id);
    }

    @PostMapping("/{id}/register")
    public ResponseEntity<?> register(
            @PathVariable Long id,
            HttpSession session
    ) {

        Long userId =
                (Long) session.getAttribute("userId");

        if (userId == null) {
            return ResponseEntity
                    .status(401)
                    .body(Map.of(
                            "message",
                            "Please login first"
                    ));
        }

        if (regs.existsByEventIdAndUserId(id, userId)) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            "Already registered"
                    ));
        }

        Event event =
                events.findById(id).orElse(null);

        if (event == null) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            "Event not found"
                    ));
        }

        User user =
                users.findById(userId).orElse(null);

        if (user == null) {
            return ResponseEntity
                    .status(401)
                    .body(Map.of(
                            "message",
                            "User not found"
                    ));
        }

        EventRegistration registration =
                new EventRegistration();

        registration.setEvent(event);
        registration.setUser(user);

        /*
         * Attendance starts as NOT MARKED.
         */
        registration.setAttended(false);
        registration.setAttendanceMarked(false);

        regs.save(registration);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Registered for event successfully"
                )
        );
    }

    @GetMapping("/mine")
    public List<EventRegistration> mine(
            HttpSession session
    ) {

        Long userId =
                (Long) session.getAttribute("userId");

        if (userId == null) {
            return List.of();
        }

        return regs.findByUserId(userId);
    }

    @GetMapping("/{id}/registrations")
    @PreAuthorize("hasRole('ADMIN')")
    public List<EventRegistration> registrations(
            @PathVariable Long id
    ) {

        return regs.findByEventId(id);
    }

    /*
     * Existing endpoint kept for compatibility.
     *
     * Example:
     * PUT /api/events/1/registrations/2/attendance?attended=true
     */
    @PutMapping("/registrations/{registrationId}/attendance")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> attendance(
            @PathVariable Long registrationId,
            @RequestParam boolean attended
    ) {

        EventRegistration registration =
                regs.findById(registrationId).orElse(null);

        if (registration == null) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            "Registration not found"
                    ));
        }

        registration.setAttended(attended);
        registration.setAttendanceMarked(true);

        regs.save(registration);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        attended
                                ? "Attendance marked Present"
                                : "Attendance marked Absent"
                )
        );
    }
}