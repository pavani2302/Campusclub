package com.campusclub.controller;

import com.campusclub.entity.Club;
import com.campusclub.entity.Event;
import com.campusclub.entity.EventRegistration;
import com.campusclub.entity.Membership;
import com.campusclub.entity.Role;
import com.campusclub.entity.User;

import com.campusclub.repository.ClubRepository;
import com.campusclub.repository.EventRegistrationRepository;
import com.campusclub.repository.EventRepository;
import com.campusclub.repository.MembershipRepository;
import com.campusclub.repository.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository users;
    private final ClubRepository clubs;
    private final EventRepository events;
    private final MembershipRepository memberships;
    private final EventRegistrationRepository registrations;

    public AdminController(
            UserRepository users,
            ClubRepository clubs,
            EventRepository events,
            MembershipRepository memberships,
            EventRegistrationRepository registrations
    ) {
        this.users = users;
        this.clubs = clubs;
        this.events = events;
        this.memberships = memberships;
        this.registrations = registrations;
    }

    // =========================================================
    // ADMIN STATISTICS
    // =========================================================

    @GetMapping("/stats")
    public Map<String, Long> stats() {

        long present =
                registrations.findAll()
                        .stream()
                        .filter(EventRegistration::isAttended)
                        .count();

        long absent =
                registrations.findAll()
                        .stream()
                        .filter(registration -> !registration.isAttended())
                        .count();

        return Map.of(
                "students",
                users.countByRole(Role.STUDENT),

                "clubs",
                clubs.count(),

                "events",
                events.count(),

                "memberships",
                memberships.count(),

                "registrations",
                registrations.count(),

                "present",
                present,

                "absent",
                absent
        );
    }

    // =========================================================
    // ALL STUDENTS
    // =========================================================

    @GetMapping("/users")
    public List<Map<String, Object>> users() {

        List<Map<String, Object>> result =
                new ArrayList<>();

        for (User user : users.findAll()) {

            Map<String, Object> item =
                    new LinkedHashMap<>();

            item.put("id", user.getId());
            item.put("name", user.getName());
            item.put("email", user.getEmail());
            item.put(
                    "studentId",
                    user.getStudentId() == null
                            ? ""
                            : user.getStudentId()
            );
            item.put(
                    "department",
                    user.getDepartment() == null
                            ? ""
                            : user.getDepartment()
            );
            item.put(
                    "role",
                    user.getRole().name()
            );

            result.add(item);
        }

        return result;
    }

    // =========================================================
    // CLUB MEMBERS
    // =========================================================

    @GetMapping("/club-members")
    public List<Map<String, Object>> clubMembers() {

        List<Map<String, Object>> result =
                new ArrayList<>();

        for (Membership membership :
                memberships.findAll()) {

            User user =
                    membership.getUser();

            Club club =
                    membership.getClub();

            Map<String, Object> item =
                    new LinkedHashMap<>();

            item.put(
                    "membershipId",
                    membership.getId()
            );

            item.put(
                    "clubId",
                    club.getId()
            );

            item.put(
                    "clubName",
                    club.getName()
            );

            item.put(
                    "category",
                    club.getCategory()
            );

            item.put(
                    "userId",
                    user.getId()
            );

            item.put(
                    "studentName",
                    user.getName()
            );

            item.put(
                    "email",
                    user.getEmail()
            );

            item.put(
                    "studentId",
                    user.getStudentId() == null
                            ? ""
                            : user.getStudentId()
            );

            item.put(
                    "department",
                    user.getDepartment() == null
                            ? ""
                            : user.getDepartment()
            );

            item.put(
                    "joinedAt",
                    membership.getJoinedAt()
            );

            result.add(item);
        }

        return result;
    }

    // =========================================================
    // ALL EVENT REGISTRATIONS
    // =========================================================

    @GetMapping("/event-registrations")
    public List<Map<String, Object>> eventRegistrations() {

        List<Map<String, Object>> result =
                new ArrayList<>();

        for (EventRegistration registration :
                registrations.findAll()) {

            result.add(
                    registrationMap(registration)
            );
        }

        return result;
    }

    // =========================================================
    // REGISTRATIONS FOR ONE EVENT
    // =========================================================

    @GetMapping("/events/{eventId}/registrations")
    public List<Map<String, Object>> eventRegistrations(
            @PathVariable Long eventId
    ) {

        List<Map<String, Object>> result =
                new ArrayList<>();

        for (EventRegistration registration :
                registrations.findByEventId(eventId)) {

            result.add(
                    registrationMap(registration)
            );
        }

        return result;
    }

    // =========================================================
    // MARK ATTENDANCE
    // =========================================================

    @PutMapping("/attendance/{registrationId}")
    public ResponseEntity<?> updateAttendance(
            @PathVariable Long registrationId,
            @RequestBody Map<String, Object> request
    ) {

        Optional<EventRegistration> optional =
                registrations.findById(registrationId);

        if (optional.isEmpty()) {

            return ResponseEntity
                    .notFound()
                    .build();
        }

        Object value =
                request.get("attended");

        if (!(value instanceof Boolean)) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    "attended must be true or false"
                            )
                    );
        }

        boolean attended =
                (Boolean) value;

        EventRegistration registration =
                optional.get();

        registration.setAttended(attended);

        registrations.save(registration);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        attended
                                ? "Attendance marked Present"
                                : "Attendance marked Absent",
                        "registrationId",
                        registration.getId(),
                        "attended",
                        registration.isAttended()
                )
        );
    }

    // =========================================================
    // REGISTRATION DTO
    // =========================================================

    private Map<String, Object> registrationMap(
            EventRegistration registration
    ) {

        Event event =
                registration.getEvent();

        User user =
                registration.getUser();

        Map<String, Object> item =
                new LinkedHashMap<>();

        item.put(
                "registrationId",
                registration.getId()
        );

        item.put(
                "eventId",
                event.getId()
        );

        item.put(
                "eventTitle",
                event.getTitle()
        );

        item.put(
                "eventDate",
                event.getEventDate()
        );

        item.put(
                "venue",
                event.getVenue()
        );

        item.put(
                "clubName",
                event.getClub() == null
                        ? ""
                        : event.getClub().getName()
        );

        item.put(
                "userId",
                user.getId()
        );

        item.put(
                "studentName",
                user.getName()
        );

        item.put(
                "email",
                user.getEmail()
        );

        item.put(
                "studentId",
                user.getStudentId() == null
                        ? ""
                        : user.getStudentId()
        );

        item.put(
                "department",
                user.getDepartment() == null
                        ? ""
                        : user.getDepartment()
        );

        item.put(
                "attended",
                registration.isAttended()
        );

        return item;
    }
}
