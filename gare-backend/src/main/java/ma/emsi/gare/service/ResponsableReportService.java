package ma.emsi.gare.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import ma.emsi.gare.entity.Compagnie;
import ma.emsi.gare.entity.ResponsableCompagnie;
import ma.emsi.gare.repository.*;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

@Service
@RequiredArgsConstructor
public class ResponsableReportService {

    private final TrajetRepository trajetRepository;
    private final ReservationRepository reservationRepository;
    private final PaiementRepository paiementRepository;
    private final BusRepository busRepository;
    private final CodePromoRepository codePromoRepository;
    private final CompagnieRepository compagnieRepository;

    public byte[] exportPdf(Authentication authentication)
            throws Exception {

        Compagnie compagnie = getCompagnie(authentication);

        long totalTrajets =
                trajetRepository.countByCompagnieId(compagnie.getId());

        long totalReservations =
                reservationRepository.countByCompagnieId(compagnie.getId());

        double totalVentes =
                paiementRepository
                        .calculerRecettesCompagnie(compagnie.getId());

        long totalBus =
                busRepository.countByCompagnieIdAndActifTrue(
                        compagnie.getId()
                );

        Document document = new Document();

        ByteArrayOutputStream out = new ByteArrayOutputStream();

        PdfWriter.getInstance(document, out);

        document.open();

        Font titleFont =
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);

        Paragraph title = new Paragraph(
                "Rapport Compagnie - " + compagnie.getNom(),
                titleFont
        );

        title.setAlignment(Element.ALIGN_CENTER);

        document.add(title);

        document.add(new Paragraph(" "));

        PdfPTable table = new PdfPTable(2);

        table.addCell("Indicateur");
        table.addCell("Valeur");

        table.addCell("Total trajets");
        table.addCell(String.valueOf(totalTrajets));

        table.addCell("Total réservations");
        table.addCell(String.valueOf(totalReservations));

        table.addCell("Total ventes");
        table.addCell(totalVentes + " MAD");

        table.addCell("Bus actifs");
        table.addCell(String.valueOf(totalBus));

        document.add(table);

        document.close();

        return out.toByteArray();
    }

    public byte[] exportExcel(Authentication authentication)
            throws Exception {

        Compagnie compagnie = getCompagnie(authentication);

        long totalTrajets =
                trajetRepository.countByCompagnieId(compagnie.getId());

        long totalReservations =
                reservationRepository.countByCompagnieId(compagnie.getId());

        double totalVentes =
                paiementRepository
                        .calculerRecettesCompagnie(compagnie.getId());

        long totalBus =
                busRepository.countByCompagnieIdAndActifTrue(
                        compagnie.getId()
                );

        XSSFWorkbook workbook = new XSSFWorkbook();

        XSSFSheet sheet =
                workbook.createSheet("Rapport Compagnie");

        Row header = sheet.createRow(0);

        header.createCell(0).setCellValue("Indicateur");
        header.createCell(1).setCellValue("Valeur");

        Row row1 = sheet.createRow(1);
        row1.createCell(0).setCellValue("Total trajets");
        row1.createCell(1).setCellValue(totalTrajets);

        Row row2 = sheet.createRow(2);
        row2.createCell(0).setCellValue("Total réservations");
        row2.createCell(1).setCellValue(totalReservations);

        Row row3 = sheet.createRow(3);
        row3.createCell(0).setCellValue("Total ventes");
        row3.createCell(1).setCellValue(totalVentes);

        Row row4 = sheet.createRow(4);
        row4.createCell(0).setCellValue("Bus actifs");
        row4.createCell(1).setCellValue(totalBus);

        ByteArrayOutputStream out =
                new ByteArrayOutputStream();

        workbook.write(out);

        workbook.close();

        return out.toByteArray();
    }

    private Compagnie getCompagnie(Authentication authentication) {

        Object principal = authentication.getPrincipal();

        if (!(principal instanceof ResponsableCompagnie responsable)) {
            throw new IllegalStateException("Utilisateur invalide");
        }

        Long compagnieId = responsable.getCompagnie().getId();

        return compagnieRepository.findById(compagnieId)
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Compagnie introuvable"
                        ));
    }
}