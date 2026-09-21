package com.campusclub.entity;

import jakarta.persistence.*;

@Entity
@Table(name="clubs")
public class Club {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    @Column(nullable=false, length=100) private String name;
    @Column(nullable=false, length=1000) private String description;
    @Column(length=80) private String category;
    @Column(length=120) private String coordinator;

    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public String getName(){return name;} public void setName(String v){name=v;}
    public String getDescription(){return description;} public void setDescription(String v){description=v;}
    public String getCategory(){return category;} public void setCategory(String v){category=v;}
    public String getCoordinator(){return coordinator;} public void setCoordinator(String v){coordinator=v;}
}
