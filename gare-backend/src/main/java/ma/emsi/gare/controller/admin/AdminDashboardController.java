package ma.emsi.gare.controller.admin;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.response.DashboardFinancierDTO;
import ma.emsi.gare.dto.response.QuaiStationnementSummaryDTO;
import ma.emsi.gare.service.DashboardFinancierService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final DashboardFinancierService dashboardFinancierService;

    @GetMapping("/finance")
    public DashboardFinancierDTO getDashboardFinancier() {
        return dashboardFinancierService.getDashboardFinancier();
    }

    @GetMapping("/stationnement-quais")
    public QuaiStationnementSummaryDTO getQuaiStationnementSummary() {
        return dashboardFinancierService.getQuaiStationnementSummary();
    }
}