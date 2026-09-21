package com.campusclub.entity;

import jakarta.persistence.*;

@Entity
@Table(name="club_members", uniqueConstraints=@UniqueConstraint(columnNames={"club_id","user_id"}))
public class Membership {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional=false) private Club club;
    @ManyToOne(optional=false) private User user;
    @Column(nullable=false) private String joinedAt;
    public Long getId(){return id;} public Club getClub(){return club;} public void setClub(Club v){club=v;}
    public User getUser(){return user;} public void setUser(User v){user=v;}
    public String getJoinedAt(){return joinedAt;} public void setJoinedAt(String v){joinedAt=v;}
}
