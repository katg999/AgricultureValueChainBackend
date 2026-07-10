package com.ugaap.authentication.service;

import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class EmailService {

    @Value("${sendgrid.api.key}")
    private String sendGridApiKey;

    @Value("${app.mail.from}")
    private String fromEmail;

    public void sendOtp(String toEmail, String otp) throws IOException {
        Email from = new Email(fromEmail);
        Email to = new Email(toEmail);
        String subject = "Your OTP Code - UGAAP";
        Content content = new Content(
                "text/plain",
                "Your OTP code is: " + otp + "\n\nThis code expires in 5 minutes.\n\nIf you did not request this, please ignore."
        );

        Mail mail = new Mail(from, subject, to, content);

        SendGrid sg = new SendGrid(sendGridApiKey);
        Request request = new Request();
        request.setMethod(Method.POST);
        request.setEndpoint("mail/send");
        request.setBody(mail.build());

        Response response = sg.api(request);

        if (response.getStatusCode() >= 400) {
            throw new RuntimeException("Failed to send email. Status: "
                    + response.getStatusCode() + " Body: " + response.getBody());
        }

        System.out.println("OTP email sent to " + toEmail + " | Status: " + response.getStatusCode());
    }

    public void sendWelcomeCredentials(String toEmail, String fullName,
                                       String username, String tempPassword) throws IOException {
        Email from = new Email(fromEmail);
        Email to = new Email(toEmail);
        String subject = "Your UGAAP Account Is Ready";
        Content content = new Content(
                "text/plain",
                "Hello " + fullName + ",\n\n" +
                        "Your UGAAP cooperative dashboard account has been created.\n\n" +
                        "Username: " + username + "\n" +
                        "Temporary Password: " + tempPassword + "\n\n" +
                        "You will be required to change this password on first login.\n\n" +
                        "If you did not expect this account, please contact your administrator."
        );

        Mail mail = new Mail(from, subject, to, content);

        SendGrid sg = new SendGrid(sendGridApiKey);
        Request request = new Request();
        request.setMethod(Method.POST);
        request.setEndpoint("mail/send");
        request.setBody(mail.build());

        Response response = sg.api(request);

        if (response.getStatusCode() >= 400) {
            throw new IOException("Failed to send welcome email. Status: "
                    + response.getStatusCode() + " Body: " + response.getBody());
        }

        System.out.println("Welcome email sent to " + toEmail + " | Status: " + response.getStatusCode());
    }
}