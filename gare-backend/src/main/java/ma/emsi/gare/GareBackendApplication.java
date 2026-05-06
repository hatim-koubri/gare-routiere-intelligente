package ma.emsi.gare;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.jms.annotation.EnableJms;

@SpringBootApplication
@EnableJms
public class GareBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(GareBackendApplication.class, args);
    }

}
