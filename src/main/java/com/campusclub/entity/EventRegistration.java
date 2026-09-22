package com.campusclub.entity;

import jakarta.persistence.*;

@Entity
@Table(
    name = "event_registrations",
    uniqueConstraints = @UniqueConstraint(columnNames = {"event_id", "user_id"})
)
public class EventRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Event event;

    @ManyToOne(optional = false)
    private User user;

    /*
     * Existing field.
     *
     * false = absent when attendance has been marked
     * true  = present when attendance has been marked
     */
    @Column(nullable = false)
    private boolean attended = false;

    /*
     * New field.
     *
     * null / false = attendance has not been taken yet
     * true         = attendance has been taken
     *
     * Boolean is intentionally used so old database rows can remain
     * compatible while Hibernate updates the schema.
     */
    @Column(nullable = true)
    private Boolean attendanceMarked = false;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Event getEvent() {
        return event;
    }

    public void setEvent(Event event) {
        this.event = event;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public boolean isAttended() {
        return attended;
    }

    public void setAttended(boolean attended) {
        this.attended = attended;
    }

    public Boolean getAttendanceMarked() {
        return attendanceMarked;
    }

    public void setAttendanceMarked(Boolean attendanceMarked) {
        this.attendanceMarked = attendanceMarked;
    }

    /*
     * Helper method used by the application/UI.
     */
    public String getAttendanceStatus() {

        if (attendanceMarked == null || !attendanceMarked) {
            return "NOT_MARKED";
        }

        return attended ? "PRESENT" : "ABSENT";
    }
}