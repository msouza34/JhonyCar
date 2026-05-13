package com.jhonycar.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "fipeImportExecutor")
    public Executor fipeImportExecutor(
            @Value("${app.async.fipe-import.core-pool-size:2}") int corePoolSize,
            @Value("${app.async.fipe-import.max-pool-size:4}") int maxPoolSize,
            @Value("${app.async.fipe-import.queue-capacity:100}") int queueCapacity
    ) {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(maxPoolSize);
        executor.setQueueCapacity(queueCapacity);
        executor.setThreadNamePrefix("fipe-import-");
        executor.initialize();
        return executor;
    }
}
