package ma.emsi.gare.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import lombok.extern.slf4j.Slf4j;
import ma.emsi.gare.entity.StationnementOCR;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
public class PdfService {

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
                                String dateDepart, String villeDepart, String villeArrivee) {

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
            badgeTable.setSpacingBefore(8);
            badgeTable.setSpacingAfter(8);

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
            passagerName.setPaddingBottom(8);
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

            // ===== Message d'avant départ =====
            PdfPTable messageTable = new PdfPTable(1);
            messageTable.setWidthPercentage(100);
            messageTable.setSpacingBefore(10);
            messageTable.setSpacingAfter(10);

            PdfPCell messageCell = new PdfPCell();
            messageCell.setBackgroundColor(ORANGE_LIGHT);
            messageCell.setBorder(Rectangle.NO_BORDER);
            messageCell.setPadding(8);

            Font messageFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, ORANGE_DARK);
            Paragraph message = new Paragraph("⏰ Présentez-vous 30 minutes avant le départ à la gare.", messageFont);
            message.setAlignment(Element.ALIGN_CENTER);
            messageCell.addElement(message);
            messageTable.addCell(messageCell);
            document.add(messageTable);

            // ===== QR CODE =====
            BarcodeQRCode qr = new BarcodeQRCode(qrCode, 110, 110, null);
            Image qrImage = qr.getImage();
            qrImage.setAlignment(Element.ALIGN_CENTER);
            qrImage.setSpacingBefore(5);
            qrImage.setSpacingAfter(5);
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
            footerTable.setSpacingBefore(10);

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
                villeDepart, villeArrivee
        );
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