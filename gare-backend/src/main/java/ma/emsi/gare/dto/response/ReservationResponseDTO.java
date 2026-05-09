package ma.emsi.gare.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ReservationResponseDTO {

    private Long id;
    private Long voyageurId;
    private Long trajetId;

    private LocalDateTime dateReservation;
    private Double prixTotal;
    private String statut;
    private String codePromoUtilise;
    private Integer nbModif;

    private Long groupeId;
    private String typeGroupe;
    private Integer nombrePassagers;

    private List<MembreGroupeDTO> membres;
    private TrajetResponseDTO trajet;
    private List<TicketDTO> tickets;
    private List<BagageResponseDTO> bagages;
}