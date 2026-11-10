import { describe, expect, it } from "vitest";
import { resolveForcedLogoutNotice } from "../../auth/auth.service";

describe("resolveForcedLogoutNotice (RF-03 · suspended tenant)", () => {
  it("explains a suspended tenant", () => {
    expect(resolveForcedLogoutNotice({ details: ["TENANT_SUSPENDED"] })).toMatch(/suspended/i);
  });

  it("explains a deactivated user", () => {
    expect(resolveForcedLogoutNotice({ details: ["USER_INACTIVE"] })).toMatch(/deactivated/i);
  });

  it("returns null for any other 401", () => {
    expect(resolveForcedLogoutNotice({ details: ["Provide a valid Bearer token."] })).toBeNull();
    expect(resolveForcedLogoutNotice(null)).toBeNull();
  });
});
