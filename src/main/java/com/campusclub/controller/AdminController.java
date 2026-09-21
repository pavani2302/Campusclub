package com.campusclub.controller;
import com.campusclub.entity.*; import com.campusclub.repository.*; import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/admin") @PreAuthorize("hasRole('ADMIN')")
public class AdminController {
 private final UserRepository users; private final ClubRepository clubs; private final EventRepository events; private final MembershipRepository members; private final EventRegistrationRepository regs;
 public AdminController(UserRepository u,ClubRepository c,EventRepository e,MembershipRepository m,EventRegistrationRepository r){users=u;clubs=c;events=e;members=m;regs=r;}
 @GetMapping("/stats") public Map<String,Long> stats(){return Map.of("students",users.countByRole(Role.STUDENT),"clubs",clubs.count(),"events",events.count(),"memberships",members.count(),"registrations",regs.count());}
 @GetMapping("/users") public List<User> users(){return users.findAll();}
}
