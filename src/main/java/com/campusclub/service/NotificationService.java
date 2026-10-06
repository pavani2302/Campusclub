package com.campusclub.service;

import com.campusclub.entity.Event;
import com.campusclub.entity.EventRegistration;
import com.campusclub.entity.Notification;
import com.campusclub.entity.User;
import com.campusclub.repository.EventRegistrationRepository;
import com.campusclub.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EventRegistrationRepository registrationRepository;
    private final EmailService emailService;

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public NotificationService(
            NotificationRepository notificationRepository,
            EventRegistrationRepository registrationRepository,
            EmailService emailService) {

        this.notificationRepository = notificationRepository;
        this.registrationRepository = registrationRepository;
        this.emailService = emailService;
    }

    /*
     * Result returned after notifying registered students.
     *
     * notifiedStudents = number of students who received
     *                     an in-app notification.
     *
     * emailsSent       = number of emails successfully sent.
     *
     * emailFailed      = number of email attempts that failed.
     */
    public record NotificationResult(
            int notifiedStudents,
            int emailsSent,
            int emailFailed
    ) {
    }


    /*
     * Notify all students registered for an event.
     *
     * IMPORTANT:
     *
     * In-app notification and email are handled separately.
     *
     * Even if email fails, the in-app notification
     * will still be saved.
     */
    @Transactional
    public NotificationResult notifyRegisteredStudents(
            Event event,
            String updateMessage,
            boolean sendEmail) {

        List<EventRegistration> registrations =
                registrationRepository.findByEventId(event.getId());

        int notifiedStudents = 0;
        int emailsSent = 0;
        int emailFailed = 0;

        for (EventRegistration registration : registrations) {

            User user = registration.getUser();

            if (user == null) {
                continue;
            }

            /*
             * -------------------------------------------------
             * STEP 1: CREATE IN-APP NOTIFICATION
             * -------------------------------------------------
             *
             * This happens BEFORE email.
             *
             * Therefore an email failure cannot prevent
             * the student from receiving the notification.
             */

            try {

                Notification notification =
                        new Notification();

                notification.setUser(user);
                notification.setEvent(event);

                notification.setTitle(
                        "Event Updated: " + event.getTitle()
                );

                notification.setMessage(
                        buildNotificationMessage(
                                event,
                                updateMessage
                        )
                );

                notification.setCreatedAt(
                        LocalDateTime.now()
                                .format(DATE_FORMATTER)
                );

                notification.setRead(false);

                notificationRepository.save(notification);

                notifiedStudents++;

                System.out.println(
                        "In-app notification created for "
                                + user.getEmail()
                );

            } catch (Exception e) {

                /*
                 * If notification creation fails for one student,
                 * do not stop processing the remaining students.
                 */

                System.err.println(
                        "In-app notification failed for "
                                + user.getEmail()
                                + ": "
                                + e.getMessage()
                );

                continue;
            }


            /*
             * -------------------------------------------------
             * STEP 2: SEND EMAIL
             * -------------------------------------------------
             *
             * Email is completely independent from the
             * in-app notification.
             *
             * If email fails:
             *
             * - in-app notification remains successful
             * - next student is still processed
             * - emailFailed is incremented
             */

            if (sendEmail) {

                try {

                    boolean emailSent =
                            emailService.sendEventUpdateEmail(
                                    user,
                                    event,
                                    updateMessage
                            );

                    if (emailSent) {

                        emailsSent++;

                        System.out.println(
                                "Email notification sent to "
                                        + user.getEmail()
                        );

                    } else {

                        emailFailed++;

                        System.err.println(
                                "Email notification failed for "
                                        + user.getEmail()
                        );
                    }

                } catch (Exception e) {

                    /*
                     * Catch ANY unexpected email exception.
                     *
                     * This guarantees that an email problem
                     * never stops the notification process.
                     */

                    emailFailed++;

                    System.err.println(
                            "Unexpected email error for "
                                    + user.getEmail()
                                    + ": "
                                    + e.getMessage()
                    );
                }
            }
        }

        System.out.println(
                "Event notification completed. "
                        + "Event ID: "
                        + event.getId()
                        + ", In-app notifications: "
                        + notifiedStudents
                        + ", Emails sent: "
                        + emailsSent
                        + ", Emails failed: "
                        + emailFailed
        );

        return new NotificationResult(
                notifiedStudents,
                emailsSent,
                emailFailed
        );
    }


    /*
     * Creates the message displayed inside the
     * application's notification panel.
     */
    private String buildNotificationMessage(
            Event event,
            String updateMessage) {

        return "The event \""
                + event.getTitle()
                + "\" has been updated.\n\n"

                + "Date: "
                + event.getEventDate()
                + "\n"

                + "Venue: "
                + event.getVenue()
                + "\n\n"

                + "Changes:\n"
                + updateMessage;
    }


    /*
     * Notification sent when a student registers
     * for an event.
     *
     * Email is attempted separately.
     *
     * Registration itself is not affected if
     * the email fails.
     */
    @Transactional
    public void sendRegistrationNotification(
            User user,
            Event event) {

        /*
         * -------------------------------------------------
         * STEP 1: SAVE IN-APP NOTIFICATION
         * -------------------------------------------------
         */

        try {

            Notification notification =
                    new Notification();

            notification.setUser(user);
            notification.setEvent(event);

            notification.setTitle(
                    "Event Registration Confirmed"
            );

            notification.setMessage(
                    "You have successfully registered for \""
                            + event.getTitle()
                            + "\".\n\n"
                            + "Date: "
                            + event.getEventDate()
                            + "\n"
                            + "Venue: "
                            + event.getVenue()
            );

            notification.setCreatedAt(
                    LocalDateTime.now()
                            .format(DATE_FORMATTER)
            );

            notification.setRead(false);

            notificationRepository.save(notification);

            System.out.println(
                    "Registration notification created for "
                            + user.getEmail()
            );

        } catch (Exception e) {

            System.err.println(
                    "Registration notification failed for "
                            + user.getEmail()
                            + ": "
                            + e.getMessage()
            );
        }


        /*
         * -------------------------------------------------
         * STEP 2: SEND REGISTRATION EMAIL
         * -------------------------------------------------
         */

        try {

            boolean emailSent =
                    emailService.sendEventRegistrationEmail(
                            user,
                            event
                    );

            if (emailSent) {

                System.out.println(
                        "Registration email sent to "
                                + user.getEmail()
                );

            } else {

                System.err.println(
                        "Registration email failed for "
                                + user.getEmail()
                );
            }

        } catch (Exception e) {

            System.err.println(
                    "Unexpected registration email error for "
                            + user.getEmail()
                            + ": "
                            + e.getMessage()
            );
        }
    }
}
