package com.puent.sifipro.platform.health;

import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/api/platform/health")
    public Map<String, Object> health() {
        Long appUsersCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM app_users", Long.class);

        return Map.of(
                "status", "ok",
                "app", "sifipro-platform-api",
                "database", "connected",
                "appUsersCount", appUsersCount);
    }
}
