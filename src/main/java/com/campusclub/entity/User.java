package com.campusclub.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable=false, unique=true, length=120)
    private String email;
    @Column(nullable=false)
    private String password;
    @Column(nullable=false, length=100)
    private String name;
    @Column(length=30)
    private String studentId;
    @Column(length=100)
    private String department;
    @Enumerated(EnumType.STRING)
    @Column(nullable=false, length=20)
    private Role role = Role.STUDENT;

    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public String getEmail(){return email;} public void setEmail(String v){email=v;}
    public String getPassword(){return password;} public void setPassword(String v){password=v;}
    public String getName(){return name;} public void setName(String v){name=v;}
    public String getStudentId(){return studentId;} public void setStudentId(String v){studentId=v;}
    public String getDepartment(){return department;} public void setDepartment(String v){department=v;}
    public Role getRole(){return role;} public void setRole(Role v){role=v;}
}
