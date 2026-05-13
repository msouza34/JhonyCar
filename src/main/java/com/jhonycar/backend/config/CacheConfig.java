package com.jhonycar.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;

import java.time.Duration;

@Slf4j
@Configuration
@EnableCaching
@RequiredArgsConstructor
public class CacheConfig implements CachingConfigurer {

    private final RedisConnectionFactory connectionFactory;
    private final ObjectMapper objectMapper;

    @Bean
    @Override
    public CacheManager cacheManager() {
        ObjectMapper cacheObjectMapper = objectMapper.copy();
        cacheObjectMapper.registerModule(new JavaTimeModule());
        cacheObjectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        cacheObjectMapper.activateDefaultTypingAsProperty(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.EVERYTHING,
                "@class"
        );
        GenericJackson2JsonRedisSerializer.registerNullValueSerializer(cacheObjectMapper, "@class");
        GenericJackson2JsonRedisSerializer serializer = new GenericJackson2JsonRedisSerializer(cacheObjectMapper);

        RedisCacheConfiguration cacheConfig = RedisCacheConfiguration.defaultCacheConfig()
                .prefixCacheNameWith("v2::")
                .entryTtl(Duration.ofMinutes(10))
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(serializer)
                );

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(cacheConfig)
                .build();
    }

    @Bean
    @Override
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
                log.warn("Falha ao ler cache '{}' (key='{}'). Seguindo sem cache: {}",
                        cacheName(cache), key, exception.getMessage());
            }

            @Override
            public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) {
                log.warn("Falha ao gravar cache '{}' (key='{}'). Seguindo sem cache: {}",
                        cacheName(cache), key, exception.getMessage());
            }

            @Override
            public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
                log.warn("Falha ao invalidar cache '{}' (key='{}'). Seguindo sem cache: {}",
                        cacheName(cache), key, exception.getMessage());
            }

            @Override
            public void handleCacheClearError(RuntimeException exception, Cache cache) {
                log.warn("Falha ao limpar cache '{}'. Seguindo sem cache: {}",
                        cacheName(cache), exception.getMessage());
            }

            private String cacheName(Cache cache) {
                return cache != null ? cache.getName() : "desconhecido";
            }
        };
    }
}
