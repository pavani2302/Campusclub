package com.campusclub.repository;

import com.campusclub.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByIdDesc(Long userId);

    long countByUserIdAndReadFalse(Long userId);
}
