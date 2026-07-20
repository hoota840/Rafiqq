import dotenv from "dotenv";

dotenv.config();

export const config = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  port: process.env.PORT ?? "4000",
};

const missing = Object.entries(config)
  .filter(([key, value]) => key !== "port" && !value)
  .map(([key]) => key);

if (missing.length) {
  console.warn(
    `[config] Missing env vars, related features will error until set: ${missing.join(", ")}`
  );
}
