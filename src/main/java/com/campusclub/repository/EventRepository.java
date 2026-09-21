package com.campusclub.repository;
import com.campusclub.entity.Event; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface EventRepository extends JpaRepository<Event,Long>{ List<Event> findAllByOrderByEventDateAsc(); }
