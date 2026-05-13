package com.jhonycar.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class JhonycarBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(JhonycarBackendApplication.class, args);
    }
}
