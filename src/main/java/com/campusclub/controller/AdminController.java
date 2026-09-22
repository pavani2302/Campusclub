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

    /*
     * =========================
     * ADMIN STATISTICS
     * =========================
     */
    @GetMapping("/stats")
    public Map<String, Long> stats() {

        long totalRegistrations = regs.count();

        long present = regs.findAll()
                .stream()
                .filter(r ->
                        Boolean.TRUE.equals(r.getAttendanceMarked())
                                && r.isAttended()
                )
                .count();

        long absent = regs.findAll()
                .stream()
                .filter(r ->
                        Boolean.TRUE.equals(r.getAttendanceMarked())
                                && !r.isAttended()
                )
                .count();

        long notMarked = totalRegistrations - present - absent;

        return Map.of(
                "students", users.countByRole(Role.STUDENT),
                "clubs", clubs.count(),
                "events", events.count(),
                "memberships", members.count(),
                "registrations", totalRegistrations,
                "present", present,
                "absent", absent,
                "notMarked", notMarked
        );
    }

    /*
     * =========================
     * ADMIN USERS
     * =========================
     *
     * Password is intentionally NOT returned.
     */
    @GetMapping("/users")
    public List<Map<String, Object>> users() {

        List<Map<String, Object>> result = new ArrayList<>();

        for (User user : users.findAll()) {

            Map<String, Object> row = new LinkedHashMap<>();

            row.put("id", user.getId());
            row.put("name", user.getName());
            row.put("email", user.getEmail());
            row.put("studentId",
                    user.getStudentId() == null ? "" : user.getStudentId());
            row.put("department",
                    user.getDepartment() == null ? "" : user.getDepartment());
            row.put("role", user.getRole().name());

            result.add(row);
        }

        return result;
    }

    /*
     * =========================
     * EVENTS FOR ADMIN
     * =========================
     */
    @GetMapping("/events")
    public List<Map<String, Object>> adminEvents() {

        List<Map<String, Object>> result = new ArrayList<>();

        for (Event event : events.findAllByOrderByEventDateAsc()) {

            List<EventRegistration> eventRegistrations =
                    regs.findByEventId(event.getId());

            long present = eventRegistrations.stream()
                    .filter(r ->
                            Boolean.TRUE.equals(r.getAttendanceMarked())
                                    && r.isAttended()
                    )
                    .count();

            long absent = eventRegistrations.stream()
                    .filter(r ->
                            Boolean.TRUE.equals(r.getAttendanceMarked())
                                    && !r.isAttended()
                    )
                    .count();

            long notMarked =
                    eventRegistrations.size() - present - absent;

            Map<String, Object> row = new LinkedHashMap<>();

            row.put("id", event.getId());
            row.put("title", event.getTitle());
            row.put("description", event.getDescription());
            row.put("eventDate", event.getEventDate());
            row.put("venue", event.getVenue());

            if (event.getClub() != null) {
                row.put("clubId", event.getClub().getId());
                row.put("clubName", event.getClub().getName());
            } else {
                row.put("clubId", null);
                row.put("clubName", "");
            }

            row.put("registrations", eventRegistrations.size());
            row.put("present", present);
            row.put("absent", absent);
            row.put("notMarked", notMarked);

            result.add(row);
        }

        return result;
    }

    /*
     * =========================
     * CLUB MEMBERS
     * =========================
     *
     * Shows:
     * Student
     * Email
     * Student ID
     * Department
     * Club
     * Joined Date
     */
    @GetMapping("/club-members")
    public List<Map<String, Object>> clubMembers() {

        List<Map<String, Object>> result = new ArrayList<>();

        for (Membership membership : members.findAll()) {

            User user = membership.getUser();
            Club club = membership.getClub();

            Map<String, Object> row = new LinkedHashMap<>();

            row.put("membershipId", membership.getId());

            row.put("studentId", user.getId());
            row.put("studentName", user.getName());
            row.put("email", user.getEmail());

            row.put(
                    "collegeStudentId",
                    user.getStudentId() == null
                            ? ""
                            : user.getStudentId()
            );

            row.put(
                    "department",
                    user.getDepartment() == null
                            ? ""
                            : user.getDepartment()
            );

            row.put("clubId", club.getId());
            row.put("clubName", club.getName());

            row.put(
                    "category",
                    club.getCategory() == null
                            ? ""
                            : club.getCategory()
            );

            row.put("joinedAt", membership.getJoinedAt());

            result.add(row);
        }

        return result;
    }

    /*
     * =========================
     * EVENT REGISTRATIONS
     * =========================
     */
    @GetMapping("/event-registrations")
    public List<Map<String, Object>> eventRegistrations() {

        List<Map<String, Object>> result = new ArrayList<>();

        for (EventRegistration registration : regs.findAll()) {

            User user = registration.getUser();
            Event event = registration.getEvent();

            Map<String, Object> row = new LinkedHashMap<>();

            row.put("registrationId", registration.getId());

            row.put("studentId", user.getId());
            row.put("studentName", user.getName());
            row.put("email", user.getEmail());

            row.put(
                    "collegeStudentId",
                    user.getStudentId() == null
                            ? ""
                            : user.getStudentId()
            );

            row.put(
                    "department",
                    user.getDepartment() == null
                            ? ""
                            : user.getDepartment()
            );

            row.put("eventId", event.getId());
            row.put("eventTitle", event.getTitle());
            row.put("eventDate", event.getEventDate());
            row.put("venue", event.getVenue());

            if (event.getClub() != null) {
                row.put("clubName", event.getClub().getName());
            } else {
                row.put("clubName", "");
            }

            row.put(
                    "attendanceStatus",
                    registration.getAttendanceStatus()
            );

            result.add(row);
        }

        return result;
    }

    /*
     * =========================
     * ATTENDANCE DASHBOARD
     * =========================
     */
    @GetMapping("/events/{eventId}/attendance")
    public ResponseEntity<?> attendance(
            @PathVariable Long eventId
    ) {

        Event event = events.findById(eventId).orElse(null);

        if (event == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Event not found"));
        }

        List<EventRegistration> registrations =
                regs.findByEventId(eventId);

        List<Map<String, Object>> students = new ArrayList<>();

        long present = 0;
        long absent = 0;
        long notMarked = 0;

        for (EventRegistration registration : registrations) {

            User user = registration.getUser();

            String status = registration.getAttendanceStatus();

            if ("PRESENT".equals(status)) {
                present++;
            } else if ("ABSENT".equals(status)) {
                absent++;
            } else {
                notMarked++;
            }

            Map<String, Object> row = new LinkedHashMap<>();

            row.put("registrationId", registration.getId());

            row.put("studentName", user.getName());
            row.put("email", user.getEmail());

            row.put(
                    "studentId",
                    user.getStudentId() == null
                            ? ""
                            : user.getStudentId()
            );

            row.put(
                    "department",
                    user.getDepartment() == null
                            ? ""
                            : user.getDepartment()
            );

            row.put("attendanceStatus", status);

            students.add(row);
        }

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("eventId", event.getId());
        response.put("eventTitle", event.getTitle());
        response.put("eventDate", event.getEventDate());
        response.put("venue", event.getVenue());

        response.put("total", registrations.size());
        response.put("present", present);
        response.put("absent", absent);
        response.put("notMarked", notMarked);

        response.put("students", students);

        return ResponseEntity.ok(response);
    }

    /*
     * =========================
     * MARK ATTENDANCE
     * =========================
     *
     * attended=true  -> PRESENT
     * attended=false -> ABSENT
     */
    public record AttendanceRequest(boolean attended) {
    }

    @PutMapping("/attendance/{registrationId}")
    public ResponseEntity<?> updateAttendance(
            @PathVariable Long registrationId,
            @RequestBody AttendanceRequest request
    ) {

        EventRegistration registration =
                regs.findById(registrationId).orElse(null);

        if (registration == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "message",
                            "Registration not found"
                    ));
        }

        registration.setAttended(request.attended());
        registration.setAttendanceMarked(true);

        regs.save(registration);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        request.attended()
                                ? "Student marked Present"
                                : "Student marked Absent",
                        "status",
                        registration.getAttendanceStatus()
                )
        );
    }
}