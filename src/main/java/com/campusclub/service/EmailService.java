package com.campusclub.service;

import com.campusclub.entity.Event;
import com.campusclub.entity.User;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public boolean sendEventUpdateEmail(
            User user,
            Event event,
            String updateMessage) {

        try {
            SimpleMailMessage message = new SimpleMailMessage();

            message.setTo(user.getEmail());

            message.setSubject(
                    "Event Update - " + event.getTitle()
            );

            String body =
                    "Hello " + user.getName() + ",\n\n" +

                    "There has been an update to an event "
                    + "you registered for.\n\n" +

                    "Event: " + event.getTitle() + "\n" +

                    "Date: " + event.getEventDate() + "\n" +

                    "Venue: " + event.getVenue() + "\n\n" +

                    "Update:\n" +
                    updateMessage + "\n\n" +

                    "Please check the Campus Club Management "
                    + "System for the latest event information.\n\n" +

                    "Regards,\n" +
                    "Campus Club Management System";

            message.setText(body);

            mailSender.send(message);

            return true;

        } catch (MailException e) {

            System.err.println(
                    "Email could not be sent to "
                    + user.getEmail()
                    + ": "
                    + e.getMessage()
            );

            return false;
        }
    }

    public boolean sendEventRegistrationEmail(
            User user,
            Event event) {

        try {
            SimpleMailMessage message = new SimpleMailMessage();

            message.setTo(user.getEmail());

            message.setSubject(
                    "Event Registration Confirmed - "
                    + event.getTitle()
            );

            String body =
                    "Hello " + user.getName() + ",\n\n" +

                    "Your registration for the following event "
                    + "has been confirmed.\n\n" +

                    "Event: " + event.getTitle() + "\n" +
                    "Date: " + event.getEventDate() + "\n" +
                    "Venue: " + event.getVenue() + "\n\n" +

                    "We look forward to seeing you at the event.\n\n" +

                    "Regards,\n" +
                    "Campus Club Management System";

            message.setText(body);

            mailSender.send(message);

            return true;

        } catch (MailException e) {

            System.err.println(
                    "Registration email failed for "
                    + user.getEmail()
            );

            return false;
        }
    }
}
