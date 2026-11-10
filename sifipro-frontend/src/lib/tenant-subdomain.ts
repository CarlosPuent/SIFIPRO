// RF-01 · every merchant is reachable at its own subdomain: <code>.<host>.
// Locally that is <code>.localhost:5173 (browsers resolve *.localhost to this machine);
// in a deployment it would be <code>.sifipro.com. The code is the tenant code.

const RESERVED = new Set(["www", "app", "api", "admin", "platform"]);
const TENANT_CODE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

/** Tenant code from a hostname, or null when the app is opened without a subdomain. */
export function getSubdomainTenantCode(hostname: string): string | null {
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");
  if (!host || /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":")) {
    return null; // IPv4 / IPv6 address: no subdomain
  }

  const labels = host.split(".");
  const isLocalhost = labels[labels.length - 1] === "localhost";
  const minimumLabels = isLocalhost ? 2 : 3;
  if (labels.length < minimumLabels) {
    return null;
  }

  const candidate = labels[0];
  if (RESERVED.has(candidate) || !TENANT_CODE.test(candidate)) {
    return null;
  }
  return candidate;
}

/** Tenant code of the current page, if it was opened on a merchant subdomain. */
export function currentTenantCode(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return getSubdomainTenantCode(window.location.hostname);
}

/** Public URL of a merchant subdomain on the current host (e.g. http://demo.localhost:5173). */
export function tenantSubdomainUrl(code: string, path = "/"): string {
  if (typeof window === "undefined") {
    return path;
  }
  const { protocol, hostname, port } = window.location;
  const current = getSubdomainTenantCode(hostname);
  const baseHost = current ? hostname.slice(current.length + 1) : hostname;
  return `${protocol}//${code}.${baseHost}${port ? `:${port}` : ""}${path}`;
}
