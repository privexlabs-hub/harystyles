import { getAuth } from "@/server/modules/identity";

// Better Auth endpoints (magic link, passkeys, OAuth callbacks, session). Rate-limited by Better Auth.
export async function GET(req: Request) {
  return (await getAuth()).handler(req);
}
export async function POST(req: Request) {
  return (await getAuth()).handler(req);
}
