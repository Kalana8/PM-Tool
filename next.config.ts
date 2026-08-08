import type { NextConfig } from "next";
import path from "path";

// Pins the workspace root to this project. Without this, Next.js finds the
// empty package-lock.json in the parent `clone/` folder and infers that as
// the root instead, which breaks static asset (CSS/JS chunk) resolution.
const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
