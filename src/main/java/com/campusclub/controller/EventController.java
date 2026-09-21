package com.campusclub.controller;
import com.campusclub.entity.*; import com.campusclub.repository.*; import jakarta.servlet.http.HttpSession; import org.springframework.http.*; import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/events")
public class EventController {
 private final EventRepository events; private final ClubRepository clubs; private final EventRegistrationRepository regs; private final UserRepository users;
 public EventController(EventRepository e,ClubRepository c,EventRegistrationRepository r,UserRepository u){events=e;clubs=c;regs=r;users=u;}
 @GetMapping public List<Event> all(){return events.findAllByOrderByEventDateAsc();}
 public record EventRequest(String title,String description,String eventDate,String venue,Long clubId){}
 @PostMapping @PreAuthorize("hasRole('ADMIN')") public ResponseEntity<?> create(@RequestBody EventRequest r){Club c=clubs.findById(r.clubId()).orElse(null);if(c==null)return ResponseEntity.badRequest().body(Map.of("message","Club not found"));Event e=new Event();e.setTitle(r.title());e.setDescription(r.description());e.setEventDate(r.eventDate());e.setVenue(r.venue());e.setClub(c);return ResponseEntity.ok(events.save(e));}
 @DeleteMapping("/{id}") @PreAuthorize("hasRole('ADMIN')") public void delete(@PathVariable Long id){events.deleteById(id);}
 @PostMapping("/{id}/register") public ResponseEntity<?> register(@PathVariable Long id,HttpSession s){Long uid=(Long)s.getAttribute("userId");if(uid==null)return ResponseEntity.status(401).build();if(regs.existsByEventIdAndUserId(id,uid))return ResponseEntity.badRequest().body(Map.of("message","Already registered"));Event e=events.findById(id).orElseThrow();User u=users.findById(uid).orElseThrow();EventRegistration er=new EventRegistration();er.setEvent(e);er.setUser(u);regs.save(er);return ResponseEntity.ok(Map.of("message","Registered for event"));}
 @GetMapping("/mine") public List<EventRegistration> mine(HttpSession s){Long uid=(Long)s.getAttribute("userId");if(uid==null)return List.of();return regs.findByUserId(uid);}
 @GetMapping("/{id}/registrations") @PreAuthorize("hasRole('ADMIN')") public List<EventRegistration> registrations(@PathVariable Long id){return regs.findByEventId(id);}
 @PutMapping("/registrations/{registrationId}/attendance") @PreAuthorize("hasRole('ADMIN')") public ResponseEntity<?> attendance(@PathVariable Long registrationId,@RequestParam boolean attended){EventRegistration r=regs.findById(registrationId).orElseThrow();r.setAttended(attended);regs.save(r);return ResponseEntity.ok(Map.of("message","Attendance updated"));}
}
