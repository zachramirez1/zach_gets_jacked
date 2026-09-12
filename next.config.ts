import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isProd ? "/zach_gets_jacked" : "",
  assetPrefix: isProd ? "/zach_gets_jacked/" : "",
};

export default nextConfig;
