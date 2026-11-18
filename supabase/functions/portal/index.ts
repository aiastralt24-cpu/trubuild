import { createPortalHandler } from "../_shared/portal-handler.mjs";
Deno.serve(createPortalHandler((key: string) => Deno.env.get(key)));
