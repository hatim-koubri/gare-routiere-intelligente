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

    private static final Pattern PLAQUE_PATTERN = Pattern.compile("(\\d{1,5})[-\\s]?([A-Z])[-\\s]?(\\d{1,3})");

    @PostConstruct
    public void init() {

        tesseract = new Tesseract();

        tesseract.setDatapath(tessDataPath);

        tesseract.setLanguage("eng");

        tesseract.setPageSegMode(7);

        tesseract.setOcrEngineMode(1);

        tesseract.setVariable(
                "tessedit_char_whitelist",
                "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-");

        tesseract.setVariable(
                "user_defined_dpi",
                "300");

        log.info(
                "Tesseract initialisé : {}",
                tessDataPath);
    }

    public String extraireMatricule(
            BufferedImage image) {

        try {

            String texteOCR = tesseract.doOCR(image);

            log.info(
                    "OCR brut : '{}'",
                    texteOCR);

            String texte = texteOCR
                    .toUpperCase()
                    .replaceAll("[^A-Z0-9\\-\\s]", "")
                    .replaceAll("\\s+", " ")
                    .trim();

            log.info(
                    "OCR nettoyé : '{}'",
                    texte);

            Matcher matcher = PLAQUE_PATTERN.matcher(texte);

            if (matcher.find()) {

                String matricule = matcher.group(1)
                        + "-"
                        + matcher.group(2)
                        + "-"
                        + matcher.group(3);

                log.info(
                        "Matricule détecté : {}",
                        matricule);

                return matricule;
            }

            log.warn("Aucun matricule détecté");

            return null;

        } catch (TesseractException e) {

            log.error(
                    "Erreur Tesseract : {}",
                    e.getMessage());

            return null;
        }
    }
}