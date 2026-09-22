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

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository users;
    private final ClubRepository clubs;
    private final EventRepository events;
    private final MembershipRepository members;
    private final EventRegistrationRepository regs;

    public AdminController(
            UserRepository users,
            ClubRepository clubs,
            EventRepository events,
            MembershipRepository members,
            EventRegistrationRepository regs
    ) {
        this.users = users;
        this.clubs = clubs;
        this.events = events;
        this.members = members;
        this.regs = regs;
    }


    // ========================================================
    // ADMIN STATISTICS
    // ========================================================

    @GetMapping("/stats")
    public Map<String, Long> stats() {

        long totalRegistrations =
                regs.count();

        long present =
                regs.findAll()
                        .stream()
                        .filter(EventRegistration::isAttended)
                        .count();

        long absent =
                totalRegistrations - present;

        return Map.of(
                "students",
                users.countByRole(Role.STUDENT),

                "clubs",
                clubs.count(),

                "events",
                events.count(),

                "memberships",
                members.count(),

                "registrations",
                totalRegistrations,

                "present",
                present,

                "absent",
                absent
        );
    }


    // ========================================================
    // ALL USERS - SAFE DATA ONLY
    // ========================================================

    @GetMapping("/users")
    public List<Map<String, Object>> users() {

        List<Map<String, Object>> result =
                new ArrayList<>();

        for (User user : users.findAll()) {

            result.add(userMap(user));
        }

        return result;
    }


    // ========================================================
    // CLUB MEMBERS
    // ========================================================

    @GetMapping("/club-members")
    public List<Map<String, Object>> clubMembers() {

        List<Map<String, Object>> result =
                new ArrayList<>();

        for (Membership membership : members.findAll()) {

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
                    "joinedAt",
                    membership.getJoinedAt()
            );

            item.put(
                    "user",
                    userMap(user)
            );

            Map<String, Object> clubData =
                    new LinkedHashMap<>();

            clubData.put(
                    "id",
                    club.getId()
            );

            clubData.put(
                    "name",
                    club.getName()
            );

            clubData.put(
                    "category",
                    club.getCategory()
            );

            item.put(
                    "club",
                    clubData
            );

            result.add(item);
        }

        return result;
    }


    // ========================================================
    // EVENT REGISTRATIONS
    // ========================================================

    @GetMapping("/event-registrations")
    public List<Map<String, Object>> eventRegistrations() {

        List<Map<String, Object>> result =
                new ArrayList<>();

        for (EventRegistration registration :
                regs.findAll()) {

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
                    "attended",
                    registration.isAttended()
            );

            item.put(
                    "user",
                    userMap(user)
            );


            Map<String, Object> eventData =
                    new LinkedHashMap<>();

            eventData.put(
                    "id",
                    event.getId()
            );

            eventData.put(
                    "title",
                    event.getTitle()
            );

            eventData.put(
                    "eventDate",
                    event.getEventDate()
            );

            eventData.put(
                    "venue",
                    event.getVenue()
            );

            item.put(
                    "event",
                    eventData
            );


            if (event.getClub() != null) {

                Map<String, Object> clubData =
                        new LinkedHashMap<>();

                clubData.put(
                        "id",
                        event.getClub().getId()
                );

                clubData.put(
                        "name",
                        event.getClub().getName()
                );

                item.put(
                        "club",
                        clubData
                );

            } else {

                item.put(
                        "club",
                        Map.of(
                                "name",
                                "Campus"
                        )
                );
            }


            result.add(item);
        }

        return result;
    }


    // ========================================================
    // EVENT ATTENDANCE
    // ========================================================

    @GetMapping("/events/{eventId}/attendance")
    public ResponseEntity<?> attendance(
            @PathVariable Long eventId
    ) {

        Event event =
                events.findById(eventId)
                        .orElse(null);

        if (event == null) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(
                            Map.of(
                                    "message",
                                    "Event not found"
                            )
                    );
        }


        List<Map<String, Object>> result =
                new ArrayList<>();


        for (EventRegistration registration :
                regs.findByEventId(eventId)) {

            Map<String, Object> item =
                    new LinkedHashMap<>();

            item.put(
                    "registrationId",
                    registration.getId()
            );

            item.put(
                    "attended",
                    registration.isAttended()
            );

            item.put(
                    "user",
                    userMap(
                            registration.getUser()
                    )
            );

            result.add(item);
        }


        return ResponseEntity.ok(result);
    }


    // ========================================================
    // MARK ATTENDANCE
    // ========================================================

    public record AttendanceRequest(
            boolean attended
    ) {
    }


    @PutMapping("/attendance/{registrationId}")
    public ResponseEntity<?> updateAttendance(
            @PathVariable Long registrationId,
            @RequestBody AttendanceRequest request
    ) {

        EventRegistration registration =
                regs.findById(registrationId)
                        .orElse(null);

        if (registration == null) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(
                            Map.of(
                                    "message",
                                    "Registration not found"
                            )
                    );
        }


        registration.setAttended(
                request.attended()
        );

        regs.save(registration);


        return ResponseEntity.ok(
                Map.of(
                        "message",
                        request.attended()
                                ? "Student marked Present"
                                : "Student marked Absent",

                        "registrationId",
                        registrationId,

                        "attended",
                        request.attended()
                )
        );
    }


    // ========================================================
    // USER SAFE MAP
    // ========================================================

    private Map<String, Object> userMap(
            User user
    ) {

        Map<String, Object> data =
                new LinkedHashMap<>();

        data.put(
                "id",
                user.getId()
        );

        data.put(
                "name",
                user.getName()
        );

        data.put(
                "email",
                user.getEmail()
        );

        data.put(
                "studentId",
                user.getStudentId() == null
                        ? ""
                        : user.getStudentId()
        );

        data.put(
                "department",
                user.getDepartment() == null
                        ? ""
                        : user.getDepartment()
        );

        data.put(
                "role",
                user.getRole().name()
        );

        return data;
    }
}