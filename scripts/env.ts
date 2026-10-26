import { config } from "dotenv";
// Scripts read .env.local first (Neon CLI writes it), then .env.
config({ path: ".env.local" });
config({ path: ".env" });
