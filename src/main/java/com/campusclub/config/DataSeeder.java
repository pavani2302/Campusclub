package com.campusclub.config;
import com.campusclub.entity.*; import com.campusclub.repository.*; import org.springframework.boot.CommandLineRunner; import org.springframework.context.annotation.*; import org.springframework.security.crypto.password.PasswordEncoder;
@Configuration
public class DataSeeder {
 @Bean CommandLineRunner seed(UserRepository users,ClubRepository clubs,EventRepository events,PasswordEncoder encoder){return args->{
   if(users.findByEmail("admin@campusclub.com").isEmpty()){User a=new User();a.setName("System Admin");a.setEmail("admin@campusclub.com");a.setPassword(encoder.encode("admin123"));a.setRole(Role.ADMIN);users.save(a);}
   if(users.findByEmail("student@campusclub.com").isEmpty()){User s=new User();s.setName("Demo Student");s.setEmail("student@campusclub.com");s.setPassword(encoder.encode("student123"));s.setStudentId("STU001");s.setDepartment("Computer Science");s.setRole(Role.STUDENT);users.save(s);}
   if(clubs.count()==0){Club c1=new Club();c1.setName("Coding Club");c1.setDescription("Programming, hackathons and software projects.");c1.setCategory("Technology");c1.setCoordinator("Faculty Coordinator");clubs.save(c1);Club c2=new Club();c2.setName("Robotics Club");c2.setDescription("Robotics, IoT and embedded systems activities.");c2.setCategory("Engineering");c2.setCoordinator("Faculty Coordinator");clubs.save(c2);Club c3=new Club();c3.setName("Cultural Club");c3.setDescription("Music, dance, arts and cultural events.");c3.setCategory("Culture");c3.setCoordinator("Faculty Coordinator");clubs.save(c3);}
   if(events.count()==0){Club c=clubs.findAll().get(0);Event e=new Event();e.setTitle("Campus Hackathon");e.setDescription("Build a useful solution in a team.");e.setEventDate("2026-10-15 10:00");e.setVenue("Innovation Lab");e.setClub(c);events.save(e);}
 };}
}
