package ma.emsi.gare.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class ReservationRequest {

    private Long trajetId;

    // MOI_SEUL, MOI_PLUS_ACCOMPAGNANTS, AUTRE_PERSONNE
    private String typeGroupe;

    private List<MembreGroupeRequest> membres;

}