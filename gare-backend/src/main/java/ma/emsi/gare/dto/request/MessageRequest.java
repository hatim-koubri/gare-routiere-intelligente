package ma.emsi.gare.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MessageRequest {

    @NotNull
    private Long destinataireId;

    @NotBlank
    private String contenu;
}