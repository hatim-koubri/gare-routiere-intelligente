package ma.emsi.gare.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import ma.emsi.gare.enums.TypeNotification;

@Data
public class NotificationTrajetRequest {

    @NotNull
    private Long trajetId;

    @NotNull
    private TypeNotification type;

    @NotBlank
    private String message;
}