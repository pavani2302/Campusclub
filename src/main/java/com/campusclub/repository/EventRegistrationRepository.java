package com.campusclub.repository;
import com.campusclub.entity.*; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface EventRegistrationRepository extends JpaRepository<EventRegistration,Long>{ boolean existsByEventIdAndUserId(Long eventId,Long userId); List<EventRegistration> findByUserId(Long userId); List<EventRegistration> findByEventId(Long eventId); long countByEventId(Long eventId); }
