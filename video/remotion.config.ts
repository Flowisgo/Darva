import { Config } from "@remotion/cli/config";

// Clips live in assets/ (raw captures are gitignored; see README).
Config.setPublicDir("./assets");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setConcurrency(4);
Config.setCodec("h264");
Config.setCrf(18);
Config.setPixelFormat("yuv420p");
// Port 3000 is often a Next.js dev server; keep Remotion off it.
Config.setPort(3399);
