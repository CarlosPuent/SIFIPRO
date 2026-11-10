import { describe, expect, it } from "vitest";
import { getSubdomainTenantCode } from "../tenant-subdomain";

describe("getSubdomainTenantCode (RF-01 · tenant by subdomain)", () => {
  it("reads the tenant code from a local subdomain", () => {
    expect(getSubdomainTenantCode("demo.localhost")).toBe("demo");
    expect(getSubdomainTenantCode("cafe-norte.localhost")).toBe("cafe-norte");
  });

  it("reads the tenant code from a production-style host", () => {
    expect(getSubdomainTenantCode("selectos.sifipro.com")).toBe("selectos");
  });

  it("returns null when there is no subdomain", () => {
    expect(getSubdomainTenantCode("localhost")).toBeNull();
    expect(getSubdomainTenantCode("sifipro.com")).toBeNull();
    expect(getSubdomainTenantCode("127.0.0.1")).toBeNull();
  });

  it("ignores reserved and invalid labels", () => {
    expect(getSubdomainTenantCode("www.sifipro.com")).toBeNull();
    expect(getSubdomainTenantCode("-bad.localhost")).toBeNull();
  });

  it("is case-insensitive", () => {
    expect(getSubdomainTenantCode("DEMO.LocalHost")).toBe("demo");
  });
});
