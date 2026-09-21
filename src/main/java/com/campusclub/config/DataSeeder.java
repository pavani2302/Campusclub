package com.campusclub.config;

import com.campusclub.entity.Club;
import com.campusclub.entity.Event;
import com.campusclub.entity.Role;
import com.campusclub.entity.User;
import com.campusclub.repository.ClubRepository;
import com.campusclub.repository.EventRepository;
import com.campusclub.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedData(
            UserRepository userRepository,
            ClubRepository clubRepository,
            EventRepository eventRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {

            // =========================================================
            // CREATE ADMIN USER
            // =========================================================

            if (userRepository.findByEmail("admin@campusclub.com").isEmpty()) {

                User admin = new User();

                admin.setName("System Administrator");
                admin.setEmail("admin@campusclub.com");
                admin.setPassword(
                        passwordEncoder.encode("admin123")
                );
                admin.setRole(Role.ADMIN);

                userRepository.save(admin);
            }

            // =========================================================
            // CREATE DEMO STUDENT
            // =========================================================

            if (userRepository.findByEmail("student@campusclub.com").isEmpty()) {

                User student = new User();

                student.setName("Demo Student");
                student.setEmail("student@campusclub.com");
                student.setPassword(
                        passwordEncoder.encode("student123")
                );
                student.setRole(Role.STUDENT);

                userRepository.save(student);
            }

            // =========================================================
            // CREATE DEMO CLUB
            // =========================================================

            Club club;

            if (clubRepository.count() == 0) {

                club = new Club();

                club.setName("Coding Club");

                club.setDescription(
                        "A campus club for programming, software development " +
                        "and technology enthusiasts."
                );

                club.setCategory("Technology");

                clubRepository.save(club);

            } else {

                club = clubRepository.findAll().get(0);
            }

            // =========================================================
            // CREATE DEMO EVENT
            // =========================================================

            if (eventRepository.count() == 0) {

                Event event = new Event();

                event.setTitle("Java Programming Workshop");

                event.setDescription(
                        "Introduction to Java programming and " +
                        "object-oriented programming."
                );

                /*
                 * Event.eventDate in the current project is a String,
                 * therefore convert LocalDateTime to String.
                 */
                event.setEventDate(
                        LocalDateTime.now()
                                .plusDays(7)
                                .toString()
                );

                event.setClub(club);

                eventRepository.save(event);
            }
        };
    }
}