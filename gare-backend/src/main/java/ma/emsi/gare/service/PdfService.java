package ma.emsi.gare.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.emsi.gare.entity.*;
import ma.emsi.gare.repository.BusRepository;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PdfService {

    private final BusRepository busRepository;

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FORMATTER =
            DateTimeFormatter.ofPattern("HH:mm");

    // Couleurs personnalisées
    private static final BaseColor ORANGE_PRIMARY = new BaseColor(249, 115, 22);
    private static final BaseColor ORANGE_LIGHT = new BaseColor(255, 237, 213);
    private static final BaseColor ORANGE_DARK = new BaseColor(194, 65, 12);
    private static final BaseColor WHITE = new BaseColor(255, 255, 255);
    private static final BaseColor GRAY_50 = new BaseColor(249, 250, 251);
    private static final BaseColor GRAY_200 = new BaseColor(229, 231, 235);
    private static final BaseColor GRAY_500 = new BaseColor(107, 114, 128);
    private static final BaseColor GRAY_700 = new BaseColor(55, 65, 81);
    private static final BaseColor GRAY_900 = new BaseColor(17, 24, 39);

    // ===== Facture stationnement PDF =====
    public byte[] genererFactureStationnement(StationnementOCR stat) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4);
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            document.open();

            addBackgroundDecoration(writer);

            Font titreFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, ORANGE_PRIMARY);
            Paragraph titre = new Paragraph("FACTURE STATIONNEMENT", titreFont);
            titre.setAlignment(Element.ALIGN_CENTER);
            titre.setSpacingAfter(10);
            document.add(titre);

            Font sousTitreFont = FontFactory.getFont(FontFactory.HELVETICA, 12, GRAY_500);
            Paragraph sousTitre = new Paragraph("Gare Routière Intelligente — EMSI", sousTitreFont);
            sousTitre.setAlignment(Element.ALIGN_CENTER);
            sousTitre.setSpacingAfter(30);
            document.add(sousTitre);

            addDecorativeLine(document, ORANGE_PRIMARY);

            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(90);
            table.setSpacingBefore(20);
            table.setSpacingAfter(20);
            table.setWidths(new float[]{35, 65});

            addStyledRow(table, "Matricule :", stat.getMatricule());
            addStyledRow(table, "Compagnie :", stat.getCompagnie() != null ? stat.getCompagnie().getNom() : "N/A");
            addStyledRow(table, "Quai :", stat.getQuai() != null ? "Quai " + stat.getQuai().getNumero() : "N/A");
            addStyledRow(table, "Heure d'entrée :", stat.getHeureEntree() != null ? stat.getHeureEntree().format(FORMATTER) : "N/A");
            addStyledRow(table, "Heure de sortie :", stat.getHeureSortie() != null ? stat.getHeureSortie().format(FORMATTER) : "N/A");

            if (stat.getDureeMinutes() != null) {
                addStyledRow(table, "Durée :", stat.getDureeMinutes() + " minutes");
            }

            document.add(table);
            addDecorativeLine(document, ORANGE_PRIMARY);

            Font montantLabelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, GRAY_700);
            Font montantValueFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24, ORANGE_PRIMARY);

            Paragraph montantPara = new Paragraph();
            montantPara.add(new Chunk("MONTANT TOTAL : ", montantLabelFont));
            montantPara.add(new Chunk((stat.getMontantFacture() != null ? stat.getMontantFacture() : 0.0) + " MAD", montantValueFont));
            montantPara.setAlignment(Element.ALIGN_RIGHT);
            montantPara.setSpacingBefore(20);
            document.add(montantPara);

            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9, GRAY_500);
            Paragraph footer = new Paragraph("Document généré automatiquement — Gestion Intelligente de la Gare Routière", footerFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Erreur génération PDF: {}", e.getMessage());
            throw new RuntimeException("Erreur génération PDF: " + e.getMessage());
        }
    }

    // ===== TICKET DE VOYAGE ULTRA STYLISÉ =====
    public byte[] genererTicket(String nom, String prenom, String trajet, String siege, String qrCode,
                                String compagnieNom, String busMatricule, String heureDepart,
                                String dateDepart, String villeDepart, String villeArrivee,
                                java.util.List<ma.emsi.gare.entity.Bagage> bagages) {

        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A6, 15, 15, 15, 15);
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            document.open();

            addRoundedBackground(writer);

            // ===== HEADER ORANGE =====
            PdfPTable header = new PdfPTable(1);
            header.setWidthPercentage(100);

            PdfPCell headerCell = new PdfPCell();
            headerCell.setBackgroundColor(ORANGE_PRIMARY);
            headerCell.setBorder(Rectangle.NO_BORDER);
            headerCell.setPadding(12);
            headerCell.setHorizontalAlignment(Element.ALIGN_CENTER);

            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, WHITE);
            Paragraph headerText = new Paragraph("GARE ROUTIÈRE", headerFont);
            headerCell.addElement(headerText);

            Font subHeaderFont = FontFactory.getFont(FontFactory.HELVETICA, 8, WHITE);
            Paragraph subHeaderText = new Paragraph("Intelligente • EMSI", subHeaderFont);
            subHeaderText.setSpacingBefore(3);
            headerCell.addElement(subHeaderText);

            header.addCell(headerCell);
            document.add(header);

            // Badge BILLET ÉLECTRONIQUE
            PdfPTable badgeTable = new PdfPTable(1);
            badgeTable.setWidthPercentage(80);
            badgeTable.setHorizontalAlignment(Element.ALIGN_CENTER);
            badgeTable.setSpacingBefore(4);
            badgeTable.setSpacingAfter(4);

            PdfPCell badgeCell = new PdfPCell();
            badgeCell.setBackgroundColor(ORANGE_LIGHT);
            badgeCell.setBorder(Rectangle.NO_BORDER);
            badgeCell.setPadding(5);
            badgeCell.setHorizontalAlignment(Element.ALIGN_CENTER);

            Font badgeFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, ORANGE_DARK);
            Paragraph badge = new Paragraph("✓ BILLET ÉLECTRONIQUE", badgeFont);
            badgeCell.addElement(badge);
            badgeTable.addCell(badgeCell);
            document.add(badgeTable);

            // ===== ZONE PASSAGER =====
            Font sectionTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, GRAY_500);
            Font valueFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, GRAY_900);
            Font smallValueFont = FontFactory.getFont(FontFactory.HELVETICA, 9, GRAY_700);

            PdfPTable passagerTable = new PdfPTable(1);
            passagerTable.setWidthPercentage(100);
            passagerTable.setSpacingBefore(5);

            PdfPCell passagerTitle = new PdfPCell(new Phrase("PASSAGER", sectionTitleFont));
            passagerTitle.setBorder(Rectangle.NO_BORDER);
            passagerTitle.setPaddingBottom(1);
            passagerTable.addCell(passagerTitle);

            PdfPCell passagerName = new PdfPCell(new Phrase(nom + " " + prenom, valueFont));
            passagerName.setBorder(Rectangle.NO_BORDER);
            passagerName.setPaddingBottom(4);
            passagerTable.addCell(passagerName);

            document.add(passagerTable);

            addDashedLine(document);

            // ===== ZONE TRAJET =====
            PdfPTable trajetTable = new PdfPTable(2);
            trajetTable.setWidthPercentage(100);
            trajetTable.setSpacingBefore(5);
            trajetTable.setWidths(new float[]{40, 60});

            // Trajet
            PdfPCell trajetLabel = new PdfPCell(new Phrase("TRAJET", sectionTitleFont));
            trajetLabel.setBorder(Rectangle.NO_BORDER);
            trajetLabel.setPaddingBottom(1);
            trajetTable.addCell(trajetLabel);

            PdfPCell trajetValue = new PdfPCell(new Phrase(villeDepart + " → " + villeArrivee, valueFont));
            trajetValue.setBorder(Rectangle.NO_BORDER);
            trajetValue.setPaddingBottom(1);
            trajetTable.addCell(trajetValue);

            // Compagnie
            trajetTable.addCell(new PdfPCell(new Phrase("COMPAGNIE", sectionTitleFont)));
            trajetTable.addCell(new PdfPCell(new Phrase(compagnieNom, smallValueFont)));

            // Bus
            trajetTable.addCell(new PdfPCell(new Phrase("BUS", sectionTitleFont)));
            trajetTable.addCell(new PdfPCell(new Phrase(busMatricule, smallValueFont)));

            // Siège avec fond orange
            trajetTable.addCell(new PdfPCell(new Phrase("SIÈGE", sectionTitleFont)));
            PdfPCell siegeCell = new PdfPCell(new Phrase(siege, valueFont));
            siegeCell.setBackgroundColor(ORANGE_LIGHT);
            siegeCell.setPadding(4);
            trajetTable.addCell(siegeCell);

            document.add(trajetTable);

            addDashedLine(document);

            // ===== DATE ET HEURE =====
            PdfPTable dateTable = new PdfPTable(2);
            dateTable.setWidthPercentage(100);
            dateTable.setSpacingBefore(5);
            dateTable.setWidths(new float[]{35, 65});

            dateTable.addCell(new PdfPCell(new Phrase("DATE", sectionTitleFont)));
            dateTable.addCell(new PdfPCell(new Phrase(dateDepart, smallValueFont)));

            dateTable.addCell(new PdfPCell(new Phrase("HEURE DÉPART", sectionTitleFont)));
            dateTable.addCell(new PdfPCell(new Phrase(heureDepart, smallValueFont)));

            document.add(dateTable);

            addDashedLine(document);

            // ===== ZONE BAGAGES =====
            PdfPTable bagagesTable = new PdfPTable(1);
            bagagesTable.setWidthPercentage(100);
            bagagesTable.setSpacingBefore(5);

            PdfPCell bagagesTitle = new PdfPCell(new Phrase("BAGAGES DÉCLARÉS (" + (bagages != null ? bagages.size() : 0) + ")", sectionTitleFont));
            bagagesTitle.setBorder(Rectangle.NO_BORDER);
            bagagesTitle.setPaddingBottom(2);
            bagagesTable.addCell(bagagesTitle);

            if (bagages == null || bagages.isEmpty()) {
                PdfPCell noBagage = new PdfPCell(new Phrase("Aucun bagage déclaré en soute.", smallValueFont));
                noBagage.setBorder(Rectangle.NO_BORDER);
                bagagesTable.addCell(noBagage);
            } else {
                for (int i = 0; i < bagages.size(); i++) {
                    ma.emsi.gare.entity.Bagage b = bagages.get(i);
                    String info = "Bagage " + (i + 1) + " (" + (b.getTypeBagage() != null ? b.getTypeBagage().name() : "STANDARD") + ") - ID: " + b.getId() + " - " + b.getPoidsKg() + " kg";
                    PdfPCell bCell = new PdfPCell(new Phrase(info, smallValueFont));
                    bCell.setBorder(Rectangle.NO_BORDER);
                    bCell.setPaddingBottom(1);
                    bagagesTable.addCell(bCell);
                }
            }
            document.add(bagagesTable);

            // ===== Message d'avant départ =====
            PdfPTable messageTable = new PdfPTable(1);
            messageTable.setWidthPercentage(100);
            messageTable.setSpacingBefore(5);
            messageTable.setSpacingAfter(5);

            PdfPCell messageCell = new PdfPCell();
            messageCell.setBackgroundColor(ORANGE_LIGHT);
            messageCell.setBorder(Rectangle.NO_BORDER);
            messageCell.setPadding(4);

            Font messageFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, ORANGE_DARK);
            Paragraph message = new Paragraph("⏰ Présentez-vous 30 minutes avant le départ à la gare.", messageFont);
            message.setAlignment(Element.ALIGN_CENTER);
            messageCell.addElement(message);
            messageTable.addCell(messageCell);
            document.add(messageTable);

            // ===== QR CODE =====
            BarcodeQRCode qr = new BarcodeQRCode(qrCode, 90, 90, null);
            Image qrImage = qr.getImage();
            qrImage.setAlignment(Element.ALIGN_CENTER);
            qrImage.setSpacingBefore(2);
            qrImage.setSpacingAfter(2);
            document.add(qrImage);

            // ===== CODE UNIQUE =====
            Font codeFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 6, GRAY_500);
            String shortCode = qrCode.length() > 20 ? qrCode.substring(0, 20) + "..." : qrCode;
            Paragraph uniqueCode = new Paragraph("Code : " + shortCode, codeFont);
            uniqueCode.setAlignment(Element.ALIGN_CENTER);
            document.add(uniqueCode);

            // ===== FOOTER =====
            PdfPTable footerTable = new PdfPTable(1);
            footerTable.setWidthPercentage(100);
            footerTable.setSpacingBefore(5);

            PdfPCell footerCell = new PdfPCell();
            footerCell.setBackgroundColor(GRAY_50);
            footerCell.setBorder(Rectangle.NO_BORDER);
            footerCell.setPadding(6);
            footerCell.setHorizontalAlignment(Element.ALIGN_CENTER);

            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA, 7, GRAY_500);
            Paragraph footer = new Paragraph("✨ Bon voyage ! ✨", footerFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            footerCell.addElement(footer);
            footerTable.addCell(footerCell);
            document.add(footerTable);

            document.close();
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Erreur génération ticket PDF: {}", e.getMessage());
            throw new RuntimeException("Erreur génération ticket PDF: " + e.getMessage());
        }
    }

    // Version simplifiée compatible avec l'existant
    public byte[] genererTicket(String nom, String prenom, String trajet, String siege, String qrCode) {
        String[] trajetParts = trajet.split(" → ");
        String villeDepart = trajetParts.length > 0 ? trajetParts[0] : "Départ";
        String villeArrivee = trajetParts.length > 1 ? trajetParts[1] : "Arrivée";

        return genererTicket(
                nom, prenom, trajet, siege, qrCode,
                "Transporteur", "BUS-" + System.currentTimeMillis() % 1000,
                LocalDateTime.now().format(TIME_FORMATTER),
                LocalDateTime.now().format(DATE_FORMATTER),
                villeDepart, villeArrivee,
                java.util.Collections.emptyList()
        );
    }

    // ===== FACTURE STATIONNEMENT — Version enrichie RIHLA =====
    public byte[] genererFactureStationnementRIHLA(StationnementOCR stat) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4, 30, 30, 30, 30);
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            document.open();

            BaseColor EMERALD = new BaseColor(16, 185, 129);
            BaseColor EMERALD_LIGHT = new BaseColor(209, 250, 229);
            BaseColor EMERALD_DARK = new BaseColor(6, 95, 70);
            BaseColor EMERALD_MUTED = new BaseColor(167, 243, 208);

            // — Background décoratif
            PdfContentByte canvas = writer.getDirectContentUnder();
            Rectangle page = writer.getPageSize();
            canvas.setColorFill(new BaseColor(249, 250, 251));
            canvas.rectangle(page.getLeft(), page.getBottom(), page.getWidth(), page.getHeight());
            canvas.fill();

            canvas.setColorFill(EMERALD_LIGHT);
            canvas.moveTo(page.getRight() - 100, page.getTop());
            canvas.lineTo(page.getRight(), page.getTop());
            canvas.lineTo(page.getRight(), page.getTop() - 100);
            canvas.fill();

            canvas.setColorFill(EMERALD_LIGHT);
            canvas.moveTo(page.getLeft(), page.getBottom());
            canvas.lineTo(page.getLeft() + 100, page.getBottom());
            canvas.lineTo(page.getLeft(), page.getBottom() + 100);
            canvas.fill();

            // — TOP BAND
            PdfPTable bandeHaut = new PdfPTable(2);
            bandeHaut.setWidthPercentage(100);
            bandeHaut.getDefaultCell().setBorder(Rectangle.NO_BORDER);
            bandeHaut.setWidths(new float[]{50, 50});

            // Logo RIHLA
            PdfPTable logoTable = new PdfPTable(1);
            logoTable.getDefaultCell().setBorder(Rectangle.NO_BORDER);

            Font logoFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 28, EMERALD);
            Paragraph rihla = new Paragraph("RIHLA", logoFont);
            rihla.setAlignment(Element.ALIGN_LEFT);
            logoTable.addCell(rihla);

            Font subLogoFont = FontFactory.getFont(FontFactory.HELVETICA, 9, EMERALD_DARK);
            Paragraph sub = new Paragraph("Gare Routière Intelligente", subLogoFont);
            sub.setAlignment(Element.ALIGN_LEFT);
            logoTable.addCell(sub);

            Font cityFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, EMERALD_MUTED);
            Paragraph city = new Paragraph("EMSI · Maroc", cityFont);
            city.setAlignment(Element.ALIGN_LEFT);
            logoTable.addCell(city);

            PdfPCell logoCell = new PdfPCell(logoTable);
            logoCell.setBorder(Rectangle.NO_BORDER);
            bandeHaut.addCell(logoCell);

            // Facture numéro + date
            PdfPTable infoDroite = new PdfPTable(1);
            infoDroite.getDefaultCell().setBorder(Rectangle.NO_BORDER);

            Font factureNumFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, EMERALD_DARK);
            Paragraph factureNum = new Paragraph("FACTURE", factureNumFont);
            factureNum.setAlignment(Element.ALIGN_RIGHT);
            infoDroite.addCell(factureNum);

            Font refFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, GRAY_700);
            Paragraph ref = new Paragraph("Nº FACT-" + stat.getId() + "/" + java.time.LocalDate.now().getYear(), refFont);
            ref.setAlignment(Element.ALIGN_RIGHT);
            infoDroite.addCell(ref);

            Font dateFont = FontFactory.getFont(FontFactory.HELVETICA, 9, GRAY_500);
            Paragraph dateFact = new Paragraph("Date: " + LocalDateTime.now().format(FORMATTER), dateFont);
            dateFact.setAlignment(Element.ALIGN_RIGHT);
            infoDroite.addCell(dateFact);

            PdfPCell infoCell = new PdfPCell(infoDroite);
            infoCell.setBorder(Rectangle.NO_BORDER);
            bandeHaut.addCell(infoCell);

            document.add(bandeHaut);

            // — Séparateur
            PdfPTable sep = new PdfPTable(1);
            sep.setWidthPercentage(100);
            PdfPCell sepCell = new PdfPCell();
            sepCell.setFixedHeight(3);
            sepCell.setBackgroundColor(EMERALD);
            sepCell.setBorder(Rectangle.NO_BORDER);
            sep.addCell(sepCell);
            sep.setSpacingBefore(12);
            sep.setSpacingAfter(16);
            document.add(sep);

            // — Détection image (si disponible)
            if (stat.getImageEntreeUrl() != null && !stat.getImageEntreeUrl().isBlank()) {
                try {
                    String imagePath = stat.getImageEntreeUrl();
                    if (imagePath.startsWith("/")) imagePath = "." + imagePath;
                    Image img = Image.getInstance(imagePath);
                    img.scaleToFit(200, 130);
                    img.setAlignment(Element.ALIGN_CENTER);
                    img.setSpacingAfter(12);
                    document.add(img);
                } catch (Exception e) {
                    log.warn("Impossible d'ajouter l'image de détection: {}", e.getMessage());
                }
            }

            // — Infos bus et compagnie
            PdfPTable infosTable = new PdfPTable(2);
            infosTable.setWidthPercentage(100);
            infosTable.setSpacingBefore(6);
            infosTable.setSpacingAfter(10);
            infosTable.setWidths(new float[]{50, 50});

            // Bloc gauche : Compagnie
            PdfPTable blocGauche = new PdfPTable(1);
            blocGauche.getDefaultCell().setBorder(Rectangle.NO_BORDER);
            Font infoTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, GRAY_500);

            PdfPCell cLeft = new PdfPCell();
            cLeft.setBorder(Rectangle.NO_BORDER);
            cLeft.setBackgroundColor(GRAY_50);
            cLeft.setPadding(10);

            Paragraph clTitre = new Paragraph("COMPAGNIE", infoTitleFont);
            clTitre.setSpacingAfter(4);
            cLeft.addElement(clTitre);

            Font companyNameFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, GRAY_900);
            String compagnieNom = stat.getCompagnie() != null ? stat.getCompagnie().getNom() : "—";
            cLeft.addElement(new Paragraph(compagnieNom, companyNameFont));

            if (stat.getCompagnie() != null) {
                Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 9, GRAY_700);
                Compagnie c = stat.getCompagnie();
                if (c.getCode() != null) cLeft.addElement(new Paragraph("Code: " + c.getCode(), smallFont));
                if (c.getTelephone() != null) cLeft.addElement(new Paragraph("Tél: " + c.getTelephone(), smallFont));
                if (c.getEmail() != null) cLeft.addElement(new Paragraph("Email: " + c.getEmail(), smallFont));
            }

            // Bus info
            Bus bus = null;
            try {
                Optional<Bus> busOpt = busRepository.findByMatricule(stat.getMatricule());
                if (busOpt.isPresent()) bus = busOpt.get();
            } catch (Exception e) {
                log.warn("Bus non trouvé pour matricule {}: {}", stat.getMatricule(), e.getMessage());
            }

            if (bus != null) {
                Font busLabelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, GRAY_500);
                Paragraph busTitre = new Paragraph("BUS", busLabelFont);
                busTitre.setSpacingBefore(8);
                busTitre.setSpacingAfter(4);
                cLeft.addElement(busTitre);
                Font busValFont = FontFactory.getFont(FontFactory.HELVETICA, 10, GRAY_700);
                cLeft.addElement(new Paragraph("Matricule: " + bus.getMatricule(), busValFont));
                cLeft.addElement(new Paragraph("Marque: " + bus.getMarque() + (bus.getModele() != null ? " " + bus.getModele() : ""), busValFont));
                cLeft.addElement(new Paragraph("Places: " + bus.getNbSieges(), busValFont));
            }

            infosTable.addCell(cLeft);

            // Bloc droit : Quai + Durée
            PdfPCell cRight = new PdfPCell();
            cRight.setBorder(Rectangle.NO_BORDER);
            cRight.setBackgroundColor(EMERALD_LIGHT);
            cRight.setPadding(10);

            Paragraph qTitre = new Paragraph("STATIONNEMENT", infoTitleFont);
            qTitre.setSpacingAfter(4);
            cRight.addElement(qTitre);

            Font valFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, GRAY_900);
            Font smallValFont = FontFactory.getFont(FontFactory.HELVETICA, 10, GRAY_700);

            if (stat.getQuai() != null) {
                cRight.addElement(new Paragraph("Quai Nº " + stat.getQuai().getNumero(), valFont));
                cRight.addElement(new Paragraph("Tarif: " + String.format("%.2f", stat.getQuai().getTarifHoraire()) + " DH/h", smallValFont));
            }

            cRight.addElement(new Paragraph("Entrée: " + (stat.getHeureEntree() != null ? stat.getHeureEntree().format(FORMATTER) : "—"), smallValFont));
            cRight.addElement(new Paragraph("Sortie: " + (stat.getHeureSortie() != null ? stat.getHeureSortie().format(FORMATTER) : "En cours"), smallValFont));

            if (stat.getDureeMinutes() != null) {
                long h = stat.getDureeMinutes() / 60;
                long m = stat.getDureeMinutes() % 60;
                cRight.addElement(new Paragraph("Durée: " + h + "h " + m + "min (" + stat.getDureeMinutes() + " min)", smallValFont));
            }

            infosTable.addCell(cRight);
            document.add(infosTable);

            // — Tableau détaillé
            PdfPTable detailTable = new PdfPTable(3);
            detailTable.setWidthPercentage(100);
            detailTable.setSpacingBefore(10);
            detailTable.setSpacingAfter(14);
            detailTable.setWidths(new float[]{40, 30, 30});

            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, WHITE);
            PdfPCell h1 = new PdfPCell(new Phrase("Libellé", headerFont));
            h1.setBackgroundColor(EMERALD);
            h1.setPadding(8);
            h1.setBorder(Rectangle.NO_BORDER);
            detailTable.addCell(h1);

            PdfPCell h2 = new PdfPCell(new Phrase("Durée", headerFont));
            h2.setBackgroundColor(EMERALD);
            h2.setPadding(8);
            h2.setHorizontalAlignment(Element.ALIGN_CENTER);
            h2.setBorder(Rectangle.NO_BORDER);
            detailTable.addCell(h2);

            PdfPCell h3 = new PdfPCell(new Phrase("Montant", headerFont));
            h3.setBackgroundColor(EMERALD);
            h3.setPadding(8);
            h3.setHorizontalAlignment(Element.ALIGN_RIGHT);
            h3.setBorder(Rectangle.NO_BORDER);
            detailTable.addCell(h3);

            String libelle = "Stationnement Quai " + (stat.getQuai() != null ? stat.getQuai().getNumero() : "N/A") + " — " + stat.getMatricule();
            String dureeStr = stat.getDureeMinutes() != null ? (stat.getDureeMinutes() / 60 + "h " + stat.getDureeMinutes() % 60 + "min") : "—";

            Font rowFont = FontFactory.getFont(FontFactory.HELVETICA, 10, GRAY_700);
            PdfPCell r1 = new PdfPCell(new Phrase(libelle, rowFont));
            r1.setPadding(7);
            r1.setBorderColor(GRAY_200);
            detailTable.addCell(r1);

            PdfPCell r2 = new PdfPCell(new Phrase(dureeStr, rowFont));
            r2.setPadding(7);
            r2.setHorizontalAlignment(Element.ALIGN_CENTER);
            r2.setBorderColor(GRAY_200);
            detailTable.addCell(r2);

            Font montantFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, GRAY_900);
            PdfPCell r3 = new PdfPCell(new Phrase(String.format("%.2f", stat.getMontantFacture() != null ? stat.getMontantFacture() : 0.0) + " DH", montantFont));
            r3.setPadding(7);
            r3.setHorizontalAlignment(Element.ALIGN_RIGHT);
            r3.setBorderColor(GRAY_200);
            detailTable.addCell(r3);

            document.add(detailTable);

            // — Ligne de total
            PdfPTable totalTable = new PdfPTable(1);
            totalTable.setWidthPercentage(100);

            PdfPCell totalCell = new PdfPCell();
            totalCell.setBorder(Rectangle.NO_BORDER);
            totalCell.setBackgroundColor(EMERALD_DARK);
            totalCell.setPadding(14);
            totalCell.setHorizontalAlignment(Element.ALIGN_RIGHT);

            Font totalLabelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, EMERALD_LIGHT);
            Font totalValueFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 26, WHITE);

            Paragraph totalPara = new Paragraph();
            totalPara.add(new Chunk("TOTAL À PAYER  ", totalLabelFont));
            totalPara.add(new Chunk(String.format("%.2f", stat.getMontantFacture() != null ? stat.getMontantFacture() : 0.0) + " DH", totalValueFont));
            totalCell.addElement(totalPara);

            totalTable.addCell(totalCell);
            totalTable.setSpacingAfter(20);
            document.add(totalTable);

            // — Footer
            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, GRAY_500);
            Paragraph footer = new Paragraph("Cette facture est générée automatiquement par le système RIHLA.", footerFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            footer.setSpacingAfter(4);
            document.add(footer);

            Paragraph footer2 = new Paragraph("Merci de votre confiance.", footerFont);
            footer2.setAlignment(Element.ALIGN_CENTER);
            document.add(footer2);

            document.close();
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Erreur génération facture RIHLA: {}", e.getMessage());
            throw new RuntimeException("Erreur génération facture: " + e.getMessage());
        }
    }

    // ===== Helpers =====
    private void addStyledRow(PdfPTable table, String label, String value) {
        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, GRAY_700);
        Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 11, GRAY_900);

        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPadding(6);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, valueFont));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setPadding(6);

        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private void addDecorativeLine(Document document, BaseColor color) throws DocumentException {
        Paragraph line = new Paragraph();
        line.setAlignment(Element.ALIGN_CENTER);
        Font lineFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, color);
        line.add(new Chunk("✦ ✦ ✦ ✦ ✦", lineFont));
        document.add(line);
    }

    private void addDashedLine(Document document) throws DocumentException {
        Paragraph line = new Paragraph();
        line.setAlignment(Element.ALIGN_CENTER);
        Font lineFont = FontFactory.getFont(FontFactory.HELVETICA, 6, GRAY_200);
        line.add(new Chunk("- - - - - - - - - - - - - - - - - - - -", lineFont));
        document.add(line);
    }

    private void addBackgroundDecoration(PdfWriter writer) {
        try {
            PdfContentByte canvas = writer.getDirectContentUnder();
            Rectangle rect = writer.getPageSize();

            canvas.setColorFill(ORANGE_LIGHT);
            canvas.moveTo(rect.getRight() - 80, rect.getTop());
            canvas.lineTo(rect.getRight(), rect.getTop());
            canvas.lineTo(rect.getRight(), rect.getTop() - 80);
            canvas.fill();

            canvas.setColorFill(ORANGE_LIGHT);
            canvas.moveTo(rect.getLeft(), rect.getBottom());
            canvas.lineTo(rect.getLeft() + 80, rect.getBottom());
            canvas.lineTo(rect.getLeft(), rect.getBottom() + 80);
            canvas.fill();
        } catch (Exception e) {
            log.warn("Erreur background: {}", e.getMessage());
        }
    }

    private void addRoundedBackground(PdfWriter writer) {
        try {
            PdfContentByte canvas = writer.getDirectContentUnder();
            Rectangle rect = writer.getPageSize();

            canvas.setColorFill(WHITE);
            canvas.rectangle(rect.getLeft(), rect.getBottom(), rect.getWidth(), rect.getHeight());
            canvas.fill();

            canvas.setColorFill(ORANGE_PRIMARY);
            canvas.rectangle(rect.getLeft(), rect.getTop() - 4, rect.getWidth(), 4);
            canvas.fill();

            canvas.setColorFill(ORANGE_PRIMARY);
            canvas.rectangle(rect.getLeft(), rect.getBottom(), rect.getWidth(), 3);
            canvas.fill();
        } catch (Exception e) {
            log.warn("Erreur background: {}", e.getMessage());
        }
    }
}