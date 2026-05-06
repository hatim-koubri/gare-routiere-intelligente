package ma.emsi.gare.enums;

public enum TypeBagage {
    /**
     * Bagage cabine : poids ≤ 15 kg et volume ≤ 60 000 cm³ — Gratuit
     */
    CABINE,

    /**
     * Bagage soute standard : poids 15–30 kg ou volume 60 000–200 000 cm³ — Surplus variable
     */
    SOUTE,

    /**
     * Bagage surdimensionné : poids > 30 kg ou volume > 200 000 cm³ — Surplus majoré
     */
    SURDIMENSIONNE
}

