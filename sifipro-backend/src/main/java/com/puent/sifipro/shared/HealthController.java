package com.puent.sifipro.shared;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Health", description = "Basic service health endpoint.")
public class HealthController {

    @GetMapping("/api/health")
    @Operation(summary = "Health check", description = "Returns a simple status payload to confirm the API is running.")
    public Map<String, String> health() {
        return Map.of(
                "status", "ok",
                "app", "sifipro-backend");
    }
}