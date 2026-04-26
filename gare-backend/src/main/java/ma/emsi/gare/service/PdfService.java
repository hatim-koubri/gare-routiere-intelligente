package ma.emsi.gare.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import lombok.extern.slf4j.Slf4j;
import ma.emsi.gare.entity.StationnementOCR;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
public class PdfService {

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    // ===== Facture stationnement PDF =====
    public byte[] genererFactureStationnement(StationnementOCR stat) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, baos);
            document.open();

            // Titre
            Font titreFont = FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD, 18, BaseColor.DARK_GRAY);
            Paragraph titre = new Paragraph(
                    "FACTURE STATIONNEMENT", titreFont);
            titre.setAlignment(Element.ALIGN_CENTER);
            titre.setSpacingAfter(20);
            document.add(titre);

            // Sous-titre
            Font sousTitreFont = FontFactory.getFont(
                    FontFactory.HELVETICA, 12, BaseColor.GRAY);
            Paragraph sousTitre = new Paragraph(
                    "Gare Routière Intelligente — EMSI", sousTitreFont);
            sousTitre.setAlignment(Element.ALIGN_CENTER);
            sousTitre.setSpacingAfter(30);
            document.add(sousTitre);

            // Ligne séparatrice
            document.add(new Paragraph("─".repeat(60)));
            document.add(Chunk.NEWLINE);

            // Détails
            Font labelFont = FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD, 11);
            Font valueFont = FontFactory.getFont(
                    FontFactory.HELVETICA, 11);

            // Tableau des détails
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10);
            table.setSpacingAfter(20);

            addRow(table, "Matricule :", stat.getMatricule(),
                    labelFont, valueFont);
            addRow(table, "Compagnie :",
                    stat.getCompagnie() != null
                            ? stat.getCompagnie().getNom() : "N/A",
                    labelFont, valueFont);
            addRow(table, "Quai :",
                    stat.getQuai() != null
                            ? "Quai " + stat.getQuai().getNumero() : "N/A",
                    labelFont, valueFont);
            addRow(table, "Heure d'entrée :",
                    stat.getHeureEntree() != null
                            ? stat.getHeureEntree().format(FORMATTER) : "N/A",
                    labelFont, valueFont);
            addRow(table, "Heure de sortie :",
                    stat.getHeureSortie() != null
                            ? stat.getHeureSortie().format(FORMATTER) : "N/A",
                    labelFont, valueFont);

            if (stat.getDureeMinutes() != null) {
                addRow(table, "Durée :",
                        stat.getDureeMinutes() + " minutes",
                        labelFont, valueFont);
            }

            document.add(table);

            // Montant total
            document.add(new Paragraph("─".repeat(60)));
            document.add(Chunk.NEWLINE);

            Font montantFont = FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD, 16, BaseColor.BLACK);
            Paragraph montant = new Paragraph(
                    "MONTANT TOTAL : "
                            + (stat.getMontantFacture() != null
                            ? stat.getMontantFacture() : 0.0)
                            + " MAD",
                    montantFont);
            montant.setAlignment(Element.ALIGN_RIGHT);
            document.add(montant);

            // Footer
            document.add(Chunk.NEWLINE);
            document.add(Chunk.NEWLINE);
            Font footerFont = FontFactory.getFont(
                    FontFactory.HELVETICA_OBLIQUE, 9, BaseColor.GRAY);
            Paragraph footer = new Paragraph(
                    "Document généré automatiquement — "
                            + "Gestion Intelligente de la Gare Routière",
                    footerFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            log.info("Facture PDF générée pour stationnement {}",
                    stat.getId());
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Erreur génération PDF: {}", e.getMessage());
            throw new RuntimeException("Erreur génération PDF: "
                    + e.getMessage());
        }
    }

    // ===== Helper — Ajouter une ligne au tableau =====
    private void addRow(PdfPTable table, String label, String value,
                        Font labelFont, Font valueFont) {
        PdfPCell labelCell = new PdfPCell(
                new Phrase(label, labelFont));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPadding(5);

        PdfPCell valueCell = new PdfPCell(
                new Phrase(value, valueFont));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setPadding(5);

        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    public byte[] genererTicket(String nom, String prenom,
                                String trajet, String siege,
                                String qrCode) {

        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A6, 20, 20, 20, 20);
            PdfWriter.getInstance(document, baos);
            document.open();

            // HEADER
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, BaseColor.WHITE);

            PdfPTable header = new PdfPTable(1);
            header.setWidthPercentage(100);

            PdfPCell cell = new PdfPCell(new Phrase("GARE ROUTIÈRE", headerFont));
            cell.setBackgroundColor(new BaseColor(255, 107, 0)); // orange
            cell.setBorder(0);
            cell.setPadding(10);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);

            header.addCell(cell);
            document.add(header);

            document.add(Chunk.NEWLINE);

            // TITRE
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Paragraph title = new Paragraph("Ticket de voyage", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            document.add(Chunk.NEWLINE);

            // INFOS
            Font infoFont = FontFactory.getFont(FontFactory.HELVETICA, 11);

            document.add(new Paragraph("Nom: " + nom + " " + prenom, infoFont));
            document.add(new Paragraph("Trajet: " + trajet, infoFont));
            document.add(new Paragraph("Siège: " + siege, infoFont));
            document.add(new Paragraph("Date: " + java.time.LocalDate.now(), infoFont));

            document.add(Chunk.NEWLINE);

            // QR CODE
            BarcodeQRCode qr = new BarcodeQRCode(qrCode, 120, 120, null);
            Image qrImage = qr.getImage();
            qrImage.setAlignment(Element.ALIGN_CENTER);
            document.add(qrImage);

            document.add(Chunk.NEWLINE);

            // FOOTER
            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10, BaseColor.GRAY);
            Paragraph footer = new Paragraph("Bon voyage ✨", footerFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Erreur génération ticket PDF");
        }
    }
}