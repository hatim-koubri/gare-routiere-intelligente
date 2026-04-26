package ma.emsi.gare.service;

import lombok.extern.slf4j.Slf4j;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.awt.image.BufferedImage;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class TesseractOCRService {

    @Value("${tesseract.datapath:C:/Program Files/Tesseract-OCR/tessdata}")
    private String tessDataPath;

    private Tesseract tesseract;

    // Patterns pour plaques marocaines
    private static final Pattern PLAQUE_PATTERN_STRICT =
            Pattern.compile("(\\d{3,5})[-\\s]([A-Z]{1,2})[-\\s](\\d{1,2})");

    private static final Pattern PLAQUE_PATTERN_FLEX =
            Pattern.compile("(\\d{3,5})\\s*[-\\s]\\s*([A-Z]{1,2})\\s*[-\\s]\\s*(\\d{1,2})");

    private static final Pattern PLAQUE_PATTERN_DIRECT =
            Pattern.compile("(\\d{3,6}[-\\s][A-Z]{1,3}[-\\s]\\d{1,3})");

    private static final Pattern PLAQUE_PATTERN_NO_SEP =
            Pattern.compile("(\\d{3,5})([A-Z]{1,2})(\\d{1,2})");

    @PostConstruct
    public void init() {
        tesseract = new Tesseract();
        tesseract.setDatapath(tessDataPath);
        tesseract.setLanguage("fra+eng");
        tesseract.setPageSegMode(7);      // Single text line
        tesseract.setOcrEngineMode(3);     // LSTM + Legacy
        tesseract.setVariable("tessedit_char_whitelist",
                "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ");
        log.info("Tesseract initialisé avec datapath: {}", tessDataPath);
    }

    // =============================================
    // Extraction matricule via Tesseract
    // =============================================
    public String extraireMatricule(BufferedImage image) {
        try {
            String texteOCR = tesseract.doOCR(image);
            log.info("Texte OCR brut: '{}'", texteOCR);

            // Nettoyage agressif
            String textePropre = nettoyerTexteOCR(texteOCR);
            log.info("Texte nettoyé: '{}'", textePropre);

            // Essayer différents patterns
            String matricule = extraireAvecPatterns(textePropre);

            if (matricule != null) {
                log.info("Matricule extrait: '{}'", matricule);
                return matricule;
            }

            // Fallback avec validation
            return fallbackExtraction(textePropre);

        } catch (TesseractException e) {
            log.error("Erreur Tesseract: {}", e.getMessage());
            return null;
        }
    }

    // ===== Nettoyage du texte OCR =====
    private String nettoyerTexteOCR(String texte) {
        if (texte == null) return "";

        return texte
                .toUpperCase()
                // Supprimer les caractères spéciaux
                .replaceAll("[^A-Z0-9\\-\\s]", "")
                // Supprimer les textes parasites
                .replaceAll("VOYAGEUR|EXPRESS|TOURING|SCANIA|CTM|BUS", "")
                // Remplacer les confusions courantes
                .replace("O", "0")
                .replace("I", "1")
                .replace("L", "1")
                .replace("S", "5")
                .replace("B", "8")
                .replace("G", "6")
                .replace("Z", "2")
                // Nettoyer les espaces
                .replaceAll("\\s+", " ")
                .trim();
    }

    // ===== Extraction avec tous les patterns =====
    private String extraireAvecPatterns(String texte) {
        // Pattern direct (déjà formaté)
        Matcher directMatcher = PLAQUE_PATTERN_DIRECT.matcher(texte);
        if (directMatcher.find()) {
            String matricule = directMatcher.group(1).replaceAll("\\s+", "-");
            log.debug("Match direct: {}", matricule);
            return matricule;
        }

        // Pattern strict (chiffres-lettre-chiffres)
        Matcher strictMatcher = PLAQUE_PATTERN_STRICT.matcher(texte);
        if (strictMatcher.find()) {
            String matricule = strictMatcher.group(1) + "-" +
                    strictMatcher.group(2) + "-" +
                    strictMatcher.group(3);
            log.debug("Match strict: {}", matricule);
            return matricule;
        }

        // Pattern flexible (espaces variés)
        Matcher flexMatcher = PLAQUE_PATTERN_FLEX.matcher(texte);
        if (flexMatcher.find()) {
            String matricule = flexMatcher.group(1) + "-" +
                    flexMatcher.group(2) + "-" +
                    flexMatcher.group(3);
            log.debug("Match flexible: {}", matricule);
            return matricule;
        }

        // Pattern sans séparateur (ex: 331A26)
        Matcher noSepMatcher = PLAQUE_PATTERN_NO_SEP.matcher(texte);
        if (noSepMatcher.find()) {
            String matricule = noSepMatcher.group(1) + "-" +
                    noSepMatcher.group(2) + "-" +
                    noSepMatcher.group(3);
            log.debug("Match sans séparateur: {}", matricule);
            return matricule;
        }

        return null;
    }

    // ===== Fallback avec validation =====
    private String fallbackExtraction(String texte) {
        if (texte == null || texte.isEmpty()) {
            log.warn("Texte vide pour fallback");
            return null;
        }

        // Ne garder que chiffres et lettres
        String fallback = texte.replaceAll("[^A-Z0-9]", "");

        // Validation longueur (plaque marocaine = 6 à 9 caractères)
        if (fallback.length() < 5 || fallback.length() > 10) {
            log.warn("Longueur invalide pour fallback: {} caractères", fallback.length());
            return null;
        }

        // Essayer de formatter automatiquement
        // Format: chiffres + lettre(s) + chiffres
        Matcher matcher = Pattern.compile("(\\d{3,5})([A-Z]{1,2})(\\d{1,2})").matcher(fallback);
        if (matcher.find()) {
            String formate = matcher.group(1) + "-" + matcher.group(2) + "-" + matcher.group(3);
            log.warn("Fallback formaté: {} → {}", fallback, formate);
            return formate;
        }

        log.warn("Fallback non formatable: {}", fallback);
        return fallback.length() <= 12 ? fallback : fallback.substring(0, 12);
    }
}