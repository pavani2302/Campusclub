package com.campusclub.controller;
import com.campusclub.entity.*; import com.campusclub.repository.*; import jakarta.servlet.http.HttpSession; import org.springframework.http.*; import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.web.bind.annotation.*; import java.time.*; import java.util.*;
@RestController @RequestMapping("/api/clubs")
public class ClubController {
 private final ClubRepository clubs; private final MembershipRepository members; private final UserRepository users;
 public ClubController(ClubRepository c,MembershipRepository m,UserRepository u){clubs=c;members=m;users=u;}
 @GetMapping public List<Club> all(){return clubs.findAll();}
 @PostMapping @PreAuthorize("hasRole('ADMIN')") public Club create(@RequestBody Club c){c.setId(null);return clubs.save(c);}
 @DeleteMapping("/{id}") @PreAuthorize("hasRole('ADMIN')") public void delete(@PathVariable Long id){clubs.deleteById(id);}
 @PostMapping("/{id}/join") public ResponseEntity<?> join(@PathVariable Long id,HttpSession s){Long uid=(Long)s.getAttribute("userId"); if(uid==null)return ResponseEntity.status(401).build(); if(members.existsByClubIdAndUserId(id,uid))return ResponseEntity.badRequest().body(Map.of("message","Already a member")); Club c=clubs.findById(id).orElseThrow(); User u=users.findById(uid).orElseThrow(); Membership m=new Membership();m.setClub(c);m.setUser(u);m.setJoinedAt(LocalDate.now().toString());members.save(m);return ResponseEntity.ok(Map.of("message","Joined club successfully"));}
 @GetMapping("/mine") public List<Club> mine(HttpSession s){Long uid=(Long)s.getAttribute("userId");if(uid==null)return List.of();return members.findByUserId(uid).stream().map(Membership::getClub).toList();}
}
