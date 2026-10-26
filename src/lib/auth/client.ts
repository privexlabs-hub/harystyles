"use client";
import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";

/** Browser auth client. It only talks to /api/auth; it never decides access (INV-14). */
export const authClient = createAuthClient({ plugins: [magicLinkClient(), passkeyClient()] });
