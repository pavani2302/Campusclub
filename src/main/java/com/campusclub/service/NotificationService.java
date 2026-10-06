package com.campusclub.service;

import com.campusclub.entity.Event;
import com.campusclub.entity.EventRegistration;
import com.campusclub.entity.Notification;
import com.campusclub.entity.User;
import com.campusclub.repository.EventRegistrationRepository;
import com.campusclub.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notifications;
    private final EventRegistrationRepository registrations;
    private final EmailService emailService;

    public NotificationService(
            NotificationRepository notifications,
            EventRegistrationRepository registrations,
            EmailService emailService) {

        this.notifications = notifications;
        this.registrations = registrations;
        this.emailService = emailService;
    }

    public int notifyRegisteredStudents(
            Event event,
            String updateMessage,
            boolean sendEmail) {

        List<EventRegistration> registeredStudents =
                registrations.findByEventId(event.getId());

        int notificationCount = 0;

        for (EventRegistration registration : registeredStudents) {

            User user = registration.getUser();

            // -----------------------------
            // In-app notification
            // -----------------------------

            Notification notification =
                    new Notification();

            notification.setUser(user);
            notification.setEvent(event);

            notification.setTitle(
                    "Event Update - " + event.getTitle()
            );

            notification.setMessage(updateMessage);

            notification.setCreatedAt(
                    LocalDateTime.now().toString()
            );

            notification.setRead(false);

            notifications.save(notification);

            notificationCount++;

            // -----------------------------
            // Email notification
            // -----------------------------

            if (sendEmail) {

                emailService.sendEventUpdateEmail(
                        user,
                        event,
                        updateMessage
                );
            }
        }

        return notificationCount;
    }

    public void sendRegistrationNotification(
            User user,
            Event event) {

        Notification notification =
                new Notification();

        notification.setUser(user);
        notification.setEvent(event);

        notification.setTitle(
                "Event Registration Confirmed"
        );

        notification.setMessage(
                "You have successfully registered for "
                + event.getTitle()
        );

        notification.setCreatedAt(
                LocalDateTime.now().toString()
        );

        notification.setRead(false);

        notifications.save(notification);

        emailService.sendEventRegistrationEmail(
                user,
                event
        );
    }
}
