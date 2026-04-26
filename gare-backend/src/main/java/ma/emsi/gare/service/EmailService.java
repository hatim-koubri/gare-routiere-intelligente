package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void envoyerTicket(String to, byte[] pdf) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setTo(to);
            helper.setSubject("Votre ticket de voyage");
            helper.setText("Veuillez trouver votre ticket en pièce jointe.");

            helper.addAttachment("ticket.pdf", () -> new java.io.ByteArrayInputStream(pdf));

            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Erreur envoi email");
        }
    }
}