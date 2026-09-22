const dns = require("dns").promises;
const net = require("net");

// Private/reserved ranges we refuse to let workflow HTTP nodes reach.
// This blocks the SSRF classes: loopback, RFC1918 private ranges,
// link-local (incl. cloud metadata endpoint 169.254.169.254), and
// unique-local/loopback IPv6.
const isPrivateOrReservedIp = (ip) => {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;

    if (a === 127) return true;                    // 127.0.0.0/8 loopback
    if (a === 10) return true;                      // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true;        // 192.168.0.0/16
    if (a === 169 && b === 254) return true;        // 169.254.0.0/16 (link-local + cloud metadata)
    if (a === 0) return true;                        // 0.0.0.0/8
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 (carrier-grade NAT)
    return false;
  }

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true;                // loopback
    if (lower.startsWith("fe80:")) return true;       // link-local
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
    if (lower.startsWith("::ffff:")) {
      // IPv4-mapped IPv6 — check the embedded IPv4
      const embedded = lower.split(":").pop();
      if (net.isIPv4(embedded)) return isPrivateOrReservedIp(embedded);
    }
    return false;
  }

  return true; // not a recognizable IP — treat as unsafe
};

const BLOCKED_HOSTNAMES = new Set(["localhost", "metadata.google.internal"]);

// Resolves the hostname and validates every resolved IP is public.
// Throws if the target is unsafe. Call this before the request AND
// before following any redirect, so redirects can't bypass the check.
const assertSafeUrl = async (rawUrl) => {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported");
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new Error("Requests to this host are not allowed");
  }

  // If the hostname is already a literal IP, check it directly
  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new Error("Requests to private/internal addresses are not allowed");
    }
    return parsed;
  }

  // Otherwise resolve DNS and check every returned address —
  // prevents DNS rebinding to a private IP behind a public-looking hostname
  let addresses;
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch {
    throw new Error("Could not resolve host");
  }

  for (const { address } of addresses) {
    if (isPrivateOrReservedIp(address)) {
      throw new Error("Requests to private/internal addresses are not allowed");
    }
  }

  return parsed;
};

module.exports = { assertSafeUrl, isPrivateOrReservedIp };