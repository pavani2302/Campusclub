package com.campusclub.controller;

import com.campusclub.entity.Notification;
import com.campusclub.repository.NotificationRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository notifications;

    public NotificationController(
            NotificationRepository notifications) {

        this.notifications = notifications;
    }

    @GetMapping
    public ResponseEntity<?> getNotifications(
            HttpSession session) {

        Long userId =
                (Long) session.getAttribute("userId");

        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        List<Notification> result =
                notifications
                        .findByUserIdOrderByIdDesc(userId);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> unreadCount(
            HttpSession session) {

        Long userId =
                (Long) session.getAttribute("userId");

        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        long count =
                notifications.countByUserIdAndReadFalse(userId);

        return ResponseEntity.ok(
                Map.of("count", count)
        );
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markRead(
            @PathVariable Long id,
            HttpSession session) {

        Long userId =
                (Long) session.getAttribute("userId");

        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        Notification notification =
                notifications.findById(id).orElse(null);

        if (notification == null) {
            return ResponseEntity.notFound().build();
        }

        if (!notification.getUser().getId().equals(userId)) {
            return ResponseEntity.status(403).build();
        }

        notification.setRead(true);

        notifications.save(notification);

        return ResponseEntity.ok(
                Map.of("message", "Notification marked as read")
        );
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllRead(
            HttpSession session) {

        Long userId =
                (Long) session.getAttribute("userId");

        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        List<Notification> result =
                notifications
                        .findByUserIdOrderByIdDesc(userId);

        for (Notification notification : result) {
            notification.setRead(true);
        }

        notifications.saveAll(result);

        return ResponseEntity.ok(
                Map.of("message", "All notifications marked as read")
        );
    }
}
