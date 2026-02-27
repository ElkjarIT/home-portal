import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  generateBuildId: () => `build-${Date.now()}`,
};

export default nextConfig;
