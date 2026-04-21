package ma.emsi.gare.mapper;

import ma.emsi.gare.dto.response.*;
import ma.emsi.gare.dto.response.LigneResponseDTO.ArretResponseDTO;
import ma.emsi.gare.entity.*;
import org.mapstruct.*;
import org.mapstruct.factory.Mappers;

import java.util.List;

@Mapper(componentModel = "spring")
public interface GareMapper {

    GareMapper INSTANCE = Mappers.getMapper(GareMapper.class);

    // ===== Bus =====
    @Mapping(source = "compagnie.id", target = "compagnieId")
    @Mapping(source = "compagnie.nom", target = "compagnieNom")
    BusResponseDTO toBusDTO(Bus bus);
    List<BusResponseDTO> toBusDTOList(List<Bus> bus);

    // ===== Stationnement OCR =====
    @Mapping(source = "compagnie.nom", target = "compagnieNom")
    @Mapping(source = "quai.numero", target = "quaiAttribue")
    @Mapping(source = "heureEntree", target = "debut")
    @Mapping(source = "heureSortie", target = "fin")
    @Mapping(source = "statut", target = "statut",
            qualifiedByName = "statutToString")
    @Mapping(source = "montantFacture", target = "montant")
    StationnementOCRResponseDTO toStationnementDTO(StationnementOCR s);
    List<StationnementOCRResponseDTO> toStationnementDTOList(
            List<StationnementOCR> stationnements);

    // ===== Trajet =====
    @Mapping(source = "ligne.id", target = "ligneId")
    @Mapping(source = "ligne.villeDepart", target = "villeDepart")
    @Mapping(source = "ligne.villeArrivee", target = "villeArrivee")
    @Mapping(source = "ligne.prixBase", target = "prixBase")
    @Mapping(source = "ligne.compagnie.id", target = "compagnieId")
    @Mapping(source = "ligne.compagnie.nom", target = "compagnieNom")
    @Mapping(source = "bus.id", target = "busId")
    @Mapping(source = "bus.matricule", target = "busMatricule")
    @Mapping(source = "bus.marque", target = "busMarque")
    @Mapping(source = "bus.nbSieges", target = "nbSieges")
    @Mapping(source = "chauffeur.id", target = "chauffeurId")
    @Mapping(source = "chauffeur.nom", target = "chauffeurNom")
    @Mapping(source = "chauffeur.prenom", target = "chauffeurPrenom")
    @Mapping(source = "quai.id", target = "quaiId")
    @Mapping(source = "quai.numero", target = "quaiNumero")
    @Mapping(source = "statut", target = "statut",
            qualifiedByName = "statutToString")
    TrajetResponseDTO toTrajetDTO(Trajet trajet);
    List<TrajetResponseDTO> toTrajetDTOList(List<Trajet> trajets);

    // ===== Ligne =====
    @Mapping(source = "compagnie.id", target = "compagnieId")
    @Mapping(source = "compagnie.nom", target = "compagnieNom")
    LigneResponseDTO toLigneDTO(Ligne ligne);
    List<LigneResponseDTO> toLigneDTOList(List<Ligne> lignes);

    // Arrêt
    ArretResponseDTO toArretDTO(Arret arret);

    // ===== Quai =====
    @Mapping(source = "compagnie.id", target = "compagnieId")
    @Mapping(source = "compagnie.nom", target = "compagnieNom")
    QuaiResponseDTO toQuaiDTO(Quai quai);
    List<QuaiResponseDTO> toQuaiDTOList(List<Quai> quais);

    // ===== Compagnie =====
    @Mapping(source = "bus", target = "nombreBus",
            qualifiedByName = "countBus")
    @Mapping(source = "quais", target = "nombreQuais",
            qualifiedByName = "countQuais")
    CompagnieResponseDTO toCompagnieDTO(Compagnie compagnie);
    List<CompagnieResponseDTO> toCompagnieDTOList(List<Compagnie> compagnies);

    // ===== Chauffeur =====
    @Mapping(source = "compagnie.id", target = "compagnieId")
    @Mapping(source = "compagnie.nom", target = "compagnieNom")
    ChauffeurResponseDTO toChauffeurDTO(Chauffeur chauffeur);
    List<ChauffeurResponseDTO> toChauffeurDTOList(List<Chauffeur> chauffeurs);

    // ===== Named methods =====
    @Named("statutToString")
    default String statutToString(Object statut) {
        return statut != null ? statut.toString() : null;
    }

    @Named("countBus")
    default int countBus(List<Bus> bus) {
        return bus != null ? bus.size() : 0;
    }

    @Named("countQuais")
    default int countQuais(List<Quai> quais) {
        return quais != null ? quais.size() : 0;
    }

    // ===== Incident =====
    @Mapping(source = "trajet.id", target = "trajetId")
    @Mapping(source = "trajet.ligne.villeDepart", target = "villeDepart")
    @Mapping(source = "trajet.ligne.villeArrivee", target = "villeArrivee")
    @Mapping(source = "trajet.dateDepart", target = "dateDepart")
    @Mapping(source = "chauffeur.id", target = "chauffeurId")
    @Mapping(source = "chauffeur.nom", target = "chauffeurNom")
    @Mapping(source = "chauffeur.prenom", target = "chauffeurPrenom")
    IncidentResponseDTO toIncidentDTO(Incident incident);
    List<IncidentResponseDTO> toIncidentDTOList(List<Incident> incidents);
}