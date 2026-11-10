package com.puent.sifipro.platform.tenant.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Editable data of a tenant (RF-01). The code/subdomain is immutable once created. */
public class UpdateTenantRequest {

    @NotBlank(message = "Tenant name is required")
    @Size(max = 150, message = "Tenant name must not exceed 150 characters")
    private String name;

    @Email(message = "Contact email must be a valid format")
    @Size(max = 150, message = "Contact email must not exceed 150 characters")
    private String contactEmail;

    @Size(max = 30, message = "Contact phone must not exceed 30 characters")
    private String contactPhone;

    @Size(max = 255, message = "Address must not exceed 255 characters")
    private String address;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }
}
