package com.campusclub.entity;

import jakarta.persistence.*;

@Entity
@Table(
        name = "event_registrations",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"event_id", "user_id"}
        )
)
public class EventRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Event event;

    @ManyToOne(optional = false)
    private User user;

    @Column(nullable = false)
    private boolean attended = false;

    public Long getId() {
        return id;
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
}
