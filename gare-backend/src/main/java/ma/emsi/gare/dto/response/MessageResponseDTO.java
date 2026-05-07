package ma.emsi.gare.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MessageResponseDTO {

    private Long id;

    private Long expediteurId;

    private String expediteurNom;

    private Long destinataireId;

    private String destinataireNom;

    private String contenu;

    private boolean lu;

    private LocalDateTime dateEnvoi;
}