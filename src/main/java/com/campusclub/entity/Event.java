package com.campusclub.entity;

import jakarta.persistence.*;

@Entity
@Table(name="events")
public class Event {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private String title;
    @Column(nullable=false, length=1000) private String description;
    @Column(nullable=false) private String eventDate;
    @Column(nullable=false) private String venue;
    @ManyToOne(optional=false) private Club club;
    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public String getTitle(){return title;} public void setTitle(String v){title=v;}
    public String getDescription(){return description;} public void setDescription(String v){description=v;}
    public String getEventDate(){return eventDate;} public void setEventDate(String v){eventDate=v;}
    public String getVenue(){return venue;} public void setVenue(String v){venue=v;}
    public Club getClub(){return club;} public void setClub(Club v){club=v;}
}
