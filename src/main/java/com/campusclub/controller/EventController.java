package com.campusclub.controller;

import com.campusclub.entity.*;
import com.campusclub.repository.*;
import com.campusclub.service.NotificationService;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventRepository events;
    private final ClubRepository clubs;
    private final EventRegistrationRepository regs;
    private final UserRepository users;
    private final NotificationService notificationService;

    public EventController(
            EventRepository events,
            ClubRepository clubs,
            EventRegistrationRepository regs,
            UserRepository users,
            NotificationService notificationService) {

        this.events = events;
        this.clubs = clubs;
        this.regs = regs;
        this.users = users;
        this.notificationService = notificationService;
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
    ) {}

    public record EventUpdateRequest(
            String title,
            String description,
            String eventDate,
            String venue,
            Long clubId,
            boolean notifyStudents,
            boolean sendEmail
    ) {}

    // ------------------------------------------------
    // CREATE EVENT
    // ------------------------------------------------

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> create(
            @RequestBody EventRequest r) {

        Club club =
                clubs.findById(r.clubId()).orElse(null);

        if (club == null) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            "Club not found"
                    ));
        }

        Event event = new Event();

        event.setTitle(r.title());
        event.setDescription(r.description());
        event.setEventDate(r.eventDate());
        event.setVenue(r.venue());
        event.setClub(club);

        return ResponseEntity.ok(
                events.save(event)
        );
    }

    // ------------------------------------------------
    // UPDATE EVENT
    // ------------------------------------------------

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody EventUpdateRequest r) {

        Event event =
                events.findById(id).orElse(null);

        if (event == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "message",
                            "Event not found"
                    ));
        }

        StringBuilder changes =
                new StringBuilder();

        // --------------------------------------------
        // Check title
        // --------------------------------------------

        if (!Objects.equals(
                event.getTitle(),
                r.title())) {

            changes.append(
                    "Title changed from '"
                    + event.getTitle()
                    + "' to '"
                    + r.title()
                    + "'.\n"
            );
        }

        // --------------------------------------------
        // Check date
        // --------------------------------------------

        if (!Objects.equals(
                event.getEventDate(),
                r.eventDate())) {

            changes.append(
                    "Date changed from "
                    + event.getEventDate()
                    + " to "
                    + r.eventDate()
                    + ".\n"
            );
        }

        // --------------------------------------------
        // Check venue
        // --------------------------------------------

        if (!Objects.equals(
                event.getVenue(),
                r.venue())) {

            changes.append(
                    "Venue changed from '"
                    + event.getVenue()
                    + "' to '"
                    + r.venue()
                    + "'.\n"
            );
        }

        // --------------------------------------------
        // Check description
        // --------------------------------------------

        if (!Objects.equals(
                event.getDescription(),
                r.description())) {

            changes.append(
                    "Event description has been updated.\n"
            );
        }

        // --------------------------------------------
        // Update event
        // --------------------------------------------

        event.setTitle(r.title());
        event.setDescription(r.description());
        event.setEventDate(r.eventDate());
        event.setVenue(r.venue());

        if (r.clubId() != null) {

            Club club =
                    clubs.findById(r.clubId())
                            .orElse(null);

            if (club == null) {

                return ResponseEntity
                        .badRequest()
                        .body(Map.of(
                                "message",
                                "Club not found"
                        ));
            }

            event.setClub(club);
        }

        Event savedEvent =
                events.save(event);

        // --------------------------------------------
        // Send notifications
        // --------------------------------------------

        int notifiedStudents = 0;

        if (r.notifyStudents()
                && changes.length() > 0) {

            notifiedStudents =
                    notificationService
                            .notifyRegisteredStudents(
                                    savedEvent,
                                    changes.toString(),
                                    r.sendEmail()
                            );
        }

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Event updated successfully",
                        "notifiedStudents",
                        notifiedStudents
                )
        );
    }

    // ------------------------------------------------
    // DELETE EVENT
    // ------------------------------------------------

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(
            @PathVariable Long id) {

        events.deleteById(id);
    }

    // ------------------------------------------------
    // REGISTER FOR EVENT
    // ------------------------------------------------

    @PostMapping("/{id}/register")
    public ResponseEntity<?> register(
            @PathVariable Long id,
            HttpSession session) {

        Long userId =
                (Long) session.getAttribute("userId");

        if (userId == null) {
            return ResponseEntity
                    .status(401)
                    .build();
        }

        if (regs.existsByEventIdAndUserId(
                id,
                userId)) {

            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "message",
                            "Already registered"
                    ));
        }

        Event event =
                events.findById(id).orElseThrow();

        User user =
                users.findById(userId).orElseThrow();

        EventRegistration registration =
                new EventRegistration();

        registration.setEvent(event);
        registration.setUser(user);

        regs.save(registration);

        // --------------------------------------------
        // Registration notification + email
        // --------------------------------------------

        notificationService
                .sendRegistrationNotification(
                        user,
                        event
                );

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Registered for event"
                )
        );
    }

    // ------------------------------------------------
    // MY REGISTERED EVENTS
    // ------------------------------------------------

    @GetMapping("/mine")
    public List<EventRegistration> mine(
            HttpSession session) {

        Long userId =
                (Long) session.getAttribute("userId");

        if (userId == null) {
            return List.of();
        }

        return regs.findByUserId(userId);
    }

    // ------------------------------------------------
    // ADMIN REGISTRATIONS
    // ------------------------------------------------

    @GetMapping("/{id}/registrations")
    @PreAuthorize("hasRole('ADMIN')")
    public List<EventRegistration> registrations(
            @PathVariable Long id) {

        return regs.findByEventId(id);
    }

    // ------------------------------------------------
    // ATTENDANCE
    // ------------------------------------------------

    @PutMapping(
            "/registrations/{registrationId}/attendance"
    )
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> attendance(
            @PathVariable Long registrationId,
            @RequestParam boolean attended) {

        EventRegistration registration =
                regs.findById(registrationId)
                        .orElseThrow();

        registration.setAttended(attended);

        regs.save(registration);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Attendance updated"
                )
        );
    }
}