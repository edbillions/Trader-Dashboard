import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright's native binary-loading internals shouldn't be traced/bundled
  // by Next's server bundler — used by the pre-market analyst's browser automation.
  serverExternalPackages: ["playwright"],
};

export default nextConfig;
