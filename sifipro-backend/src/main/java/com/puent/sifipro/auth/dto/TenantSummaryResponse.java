package com.puent.sifipro.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Tenant summary information included in authentication responses.")
public class TenantSummaryResponse {

    @Schema(description = "Tenant identifier.", example = "1")
    private Long id;

    private String name;

    private String code;

    private Boolean active;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
