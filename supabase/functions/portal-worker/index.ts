import { quotePdf } from "../_shared/portal-pdf.mjs";
// Invoke from a protected scheduler. No customer/staff bearer can run this worker.
Deno.serve(async (req) => {
  const worker = Deno.env.get("PORTAL_WORKER_SECRET");
  if (!worker || req.headers.get("authorization") !== `Bearer ${worker}`)
    return new Response("Forbidden", { status: 403 });
  const base = Deno.env.get("SUPABASE_URL"),
    key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!base || !key)
    return new Response("Configuration required", { status: 503 });
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  const rest = async (path: string, options: RequestInit = {}) => {
    const r = await fetch(`${base}/rest/v1/${path}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    });
    if (!r.ok) throw new Error("database_failure");
    return r.status === 204 ? null : r.json();
  };
  const jobs = await rest("rpc/portal_claim_pdf", {
    method: "POST",
    body: "{}",
  });
  for (const job of jobs) {
    try {
      const [q] = await rest(
        `portal_quotations?id=eq.${job.quote_id}&org_id=eq.${job.org_id}`,
      );
      if (!q || !["Issued", "Accepted", "Declined"].includes(q.status))
        throw new Error("revision_unavailable");
      const bytes = quotePdf({
        ...q.snapshot,
        number: q.number,
        revision: q.revision,
        issuedAt: q.issued_at,
        expiresAt: q.expires_at,
      });
      const checksum = Array.from(
        new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
        (n) => n.toString(16).padStart(2, "0"),
      ).join("");
      const path = `${job.org_id}/${q.id}/${checksum}.pdf`;
      const upload = await fetch(
        `${base}/storage/v1/object/portal-documents/${path}`,
        {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/pdf",
            "x-upsert": "false",
          },
          body: bytes,
        },
      );
      if (!upload.ok) {
        const existing = await fetch(
          `${base}/storage/v1/object/portal-documents/${path}`,
          { headers },
        );
        if (!existing.ok) throw new Error("storage_failure");
        const old = await existing.arrayBuffer();
        const oldHash = Array.from(
          new Uint8Array(await crypto.subtle.digest("SHA-256", old)),
          (n) => n.toString(16).padStart(2, "0"),
        ).join("");
        if (oldHash !== checksum) throw new Error("checksum_mismatch");
      }
      await rest(`portal_document_jobs?id=eq.${job.id}&status=eq.working`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "ready",
          object_path: path,
          checksum,
          error_code: null,
        }),
      });
    } catch {
      await rest(`portal_document_jobs?id=eq.${job.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: job.attempts >= 3 ? "failed" : "queued",
          next_attempt_at: new Date(
            Date.now() + Math.min(3600, 30 * 2 ** job.attempts) * 1000,
          ).toISOString(),
          error_code: "render_or_storage_failed",
        }),
      });
    }
  }
  return Response.json({ processed: jobs.length });
});
