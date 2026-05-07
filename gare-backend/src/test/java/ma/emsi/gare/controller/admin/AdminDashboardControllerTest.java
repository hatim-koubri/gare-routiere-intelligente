package ma.emsi.gare.controller.admin;

import ma.emsi.gare.dto.response.DashboardFinancierDTO;
import ma.emsi.gare.service.DashboardFinancierService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AdminDashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DashboardFinancierService dashboardFinancierService;

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldReturnDashboard() throws Exception {
        when(dashboardFinancierService.getDashboardFinancier())
                .thenReturn(new DashboardFinancierDTO(
                        1000.0,
                        200.0,
                        1200.0,
                        5,
                        2,
                        80.0
                ));

        mockMvc.perform(get("/api/admin/dashboard/finance"))
                .andExpect(status().isOk());
    }
}