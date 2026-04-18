package ma.emsi.gare.dto.response;

import lombok.*;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NotificationOfflineResponse {

    private String userEmail;
    private int nombreNotifications;
    private List<NotifDTO> notifications;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class NotifDTO {
        private Long id;
        private String type;
        private String message;
        private String payload;
        private String dateCreation;
    }
}