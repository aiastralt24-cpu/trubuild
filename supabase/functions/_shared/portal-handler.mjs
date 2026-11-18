import {
  calculate,
  normalizeContact,
  priceEstimate,
  validateStage,
  validateRule,
  validateReferences,
  PortalError,
} from "./portal-engine.mjs";
export function createPortalHandler(env, fetcher = fetch) {
  return async (req) => {
    const trace = crypto.randomUUID(),
      origin = req.headers.get("origin") || "";
    const allowed = (env("ALLOWED_ORIGINS") || "http://localhost:5173")
      .split(",")
      .map((x) => x.trim());
    const cors = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "content-type,apikey,authorization",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      Vary: "Origin",
      "Cache-Control": "no-store",
    };
    const reply = (data, status = 200) =>
      Response.json(data, { status, headers: cors });
    if (!allowed.includes(origin))
      return reply({ error: "Origin not allowed.", trace }, 403);
    if (req.method === "OPTIONS")
      return new Response(null, { status: 204, headers: cors });
    if (req.method !== "POST")
      return reply({ error: "POST required.", trace }, 405);
    const base = env("SUPABASE_URL"),
      secret = env("SUPABASE_SERVICE_ROLE_KEY"),
      org = env("PORTAL_ORG_ID");
    if (!base || !secret || !org)
      return reply(
        { error: "The portal is awaiting business configuration.", trace },
        503,
      );
    const service = {
      apikey: secret,
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    };
    const rest = async (path, options = {}, headers = service) => {
      const r = await fetcher(`${base}/rest/v1/${path}`, {
        ...options,
        headers: { ...headers, ...options.headers },
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.message || "database_unavailable");
      return data;
    };
    const rpc = (name, args) =>
      rest("rpc/" + name, { method: "POST", body: JSON.stringify(args) });
    const hash = async (s) =>
      Array.from(
        new Uint8Array(
          await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)),
        ),
        (b) => b.toString(16).padStart(2, "0"),
      ).join("");
    let b;
    try {
      const reader = req.body?.getReader();
      if (!reader) throw new PortalError("A JSON request is required.");
      let size = 0,
        text = "";
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 60000) {
          await reader.cancel();
          return reply({ error: "Request too large.", trace }, 413);
        }
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
      b = JSON.parse(text);
      const uuid = (v) => {
        if (
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            v || "",
          )
        )
          throw new PortalError("Invalid record reference.");
        return v;
      };
      const getRule = async () => {
        const rows = await rest(
          `portal_rules?org_id=eq.${org}&id=eq.${uuid(b.ruleId)}&status=eq.published`,
        );
        if (!rows.length)
          throw new PortalError("No published rule is available.");
        return { ...rows[0].definition, status: "published" };
      };
      if (b.action === "catalogue") {
        const rows = await rest(
          `portal_rules?org_id=eq.${org}&status=eq.published&select=id,definition`,
        );
        return reply({
          rules: rows.map((r) => ({
            ...r.definition,
            id: r.id,
            status: "published",
          })),
        });
      }
      if (["calculate", "capture"].includes(b.action)) {
        const rule = await getRule(),
          estimate = calculate(rule, b.input, { publishedOnly: true });
        if (b.action === "calculate") return reply({ estimate });
        const contact = normalizeContact(b.contact),
          project = String(b.project || "").trim();
        if (!project || project.length > 120)
          throw new PortalError("Enter a project name.");
        const salt = env("RATE_LIMIT_SALT");
        if (!salt) throw new Error("configuration_missing");
        const fingerprint = await hash(
          JSON.stringify({
            contact,
            project,
            ruleId: b.ruleId,
            input: b.input,
          }),
        );
        // Only bounded attribution fields; no arbitrary submitted analytics payload.
        const source = Object.fromEntries(
          [
            "landing",
            "referrer",
            "utm_source",
            "utm_medium",
            "utm_campaign",
          ].map((k) => [k, String(b.source?.[k] || "").slice(0, 300)]),
        );
        const result = await rpc("portal_capture", {
          p_org: org,
          p_request: uuid(b.requestId),
          p_fingerprint: fingerprint,
          p_contact: contact,
          p_project: project,
          p_estimate: estimate,
          p_source: source,
          p_rate: await hash(
            salt +
              ":" +
              (req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"),
          ),
        });
        return reply(result);
      }
      if (
        ["view_quote", "customer_action", "download_quote"].includes(b.action)
      ) {
        if (!/^[a-f0-9]{64}$/.test(b.token || ""))
          throw new PortalError("This quotation link is unavailable.");
        const digest = await hash(b.token);
        const rows = await rest(
          `portal_quotations?token_hash=eq.${digest}&org_id=eq.${org}`,
        );
        const q = rows[0];
        if (
          !q ||
          !["Issued", "Accepted", "Declined"].includes(q.status) ||
          Date.parse(q.link_expires_at) <= Date.now()
        )
          return reply(
            { error: "This link is unavailable or expired.", trace },
            410,
          );
        if (b.action === "customer_action") {
          if (!Number.isInteger(b.revision))
            throw new PortalError("Select the exact revision.");
          return reply(
            await rpc("portal_customer_action", {
              p_hash: digest,
              p_revision: b.revision,
              p_action: b.operation,
              p_note: String(b.note || "").slice(0, 2000),
            }),
          );
        }
        const newer = await rest(
          `portal_quotations?org_id=eq.${org}&lead_id=eq.${q.lead_id}&revision=gt.${q.revision}&status=in.(Issued,Accepted)&select=revision`,
        );
        const jobs = await rest(
          `portal_document_jobs?quote_id=eq.${q.id}&org_id=eq.${org}`,
        );
        if (b.action === "view_quote")
          return reply({
            quote: {
              ...q.snapshot,
              number: q.number,
              revision: q.revision,
              status: q.status,
              issuedAt: q.issued_at,
              expiresAt: q.expires_at,
              current: !newer.length,
              documentStatus: jobs[0]?.status || "queued",
            },
          });
        if (jobs[0]?.status !== "ready")
          return reply(
            {
              error: "The document is still being prepared. Please retry.",
              trace,
            },
            409,
          );
        const signed = await fetcher(
          `${base}/storage/v1/object/sign/portal-documents/${jobs[0].object_path}`,
          {
            method: "POST",
            headers: service,
            body: JSON.stringify({ expiresIn: 120 }),
          },
        );
        if (!signed.ok) throw new Error("document_unavailable");
        const data = await signed.json();
        return reply({ url: base + "/storage/v1" + data.signedURL });
      }
      // Authenticate before any staff operation. Never accept role/org/user claims from the body.
      const bearer = req.headers.get("authorization") || "";
      const userResponse = await fetcher(base + "/auth/v1/user", {
        headers: { apikey: secret, Authorization: bearer },
      });
      if (!userResponse.ok)
        return reply({ error: "Sign in to the staff workspace.", trace }, 401);
      const user = await userResponse.json();
      const members = await rest(
        `portal_memberships?org_id=eq.${org}&user_id=eq.${user.id}&active=eq.true`,
      );
      const member = members[0];
      if (!member)
        return reply(
          { error: "Active organisation membership is required.", trace },
          403,
        );
      const userHeaders = { ...service, Authorization: bearer };
      if (b.action === "workspace") {
        if (
          ![
            "admin",
            "manager",
            "sales",
            "product_admin",
            "pricing_admin",
          ].includes(member.role)
        )
          return reply(
            { error: "This role has no Phase 1 workspace access.", trace },
            403,
          );
        const names = [
          "leads",
          "contacts",
          "projects",
          "estimates",
          "activities",
          "tasks",
          "quotations",
          "document_jobs",
          "rules",
          "prices",
        ];
        const pairs = await Promise.all(
          names.map(async (n) => [
            n,
            await rest(
              `portal_${n}?org_id=eq.${org}&limit=500`,
              {},
              userHeaders,
            ),
          ]),
        );
        return reply({ member, ...Object.fromEntries(pairs) });
      }
      if (b.action === 'staff_download') {
        const quotes=await rest(`portal_quotations?org_id=eq.${org}&id=eq.${uuid(b.quoteId)}`,{},userHeaders);
        if(!quotes.length)return reply({error:'Quotation unavailable.',trace},403);
        const jobs=await rest(`portal_document_jobs?org_id=eq.${org}&quote_id=eq.${b.quoteId}`,{},userHeaders);
        if(jobs[0]?.status!=='ready')return reply({error:'PDF is not ready. Refresh or retry the document job.',trace},409);
        const r=await fetcher(`${base}/storage/v1/object/sign/portal-documents/${jobs[0].object_path}`,{method:'POST',headers:service,body:JSON.stringify({expiresIn:120})});
        if(!r.ok)throw new Error('document_unavailable');const d=await r.json();return reply({url:base+'/storage/v1'+d.signedURL});
      }
      const claims = JSON.parse(
        atob(bearer.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/") || ""),
      );
      if (claims.aal !== "aal2")
        return reply(
          { error: "MFA verification is required for staff changes.", trace },
          403,
        );
      if (b.action === "mutate") {
        if (b.operation === "stage") validateStage(b.data.stage, b.data, true); // DB checks actual active quotation.
        return reply(
          await rpc("portal_mutate", {
            p_org: org,
            p_actor: user.id,
            p_lead: uuid(b.leadId),
            p_version: b.version,
            p_action: b.operation,
            p_data: b.data,
          }),
        );
      }
      if (b.action === "save_config") {
        const d = structuredClone(b.definition);
        if (b.kind === "rule") {
          validateRule(d, { publish: b.status === "published" });
          if (b.status === "published") validateReferences(d);
        } else if (b.kind === "price") {
          if (
            !d.id ||
            !Number.isInteger(d.version) ||
            !d.items ||
            !d.seller?.legalName ||
            !d.seller?.address ||
            !d.currency ||
            !d.validFrom ||
            !d.validTo ||
            d.taxBasis !== "exclusive" ||
            !Array.isArray(d.territories)
          )
            throw new PortalError(
              "Complete seller, effective dates, currency, territory and exclusive tax basis.",
            );
          if (b.status === "published" && (!d.financeApproval || !d.terms))
            throw new PortalError(
              "Finance approval reference and terms are required.",
            );
          if (b.status === "published") d.seller.approvedBy = user.id;
        } else throw new PortalError("Unknown configuration type.");
        d.status = b.status;
        return reply({
          id: await rpc("portal_save_config", {
            p_org: org,
            p_actor: user.id,
            p_kind: b.kind,
            p_definition: d,
            p_status: b.status,
          }),
        });
      }
      if (b.action === "create_quote") {
        const leads = await rest(
          `portal_leads?org_id=eq.${org}&id=eq.${uuid(b.leadId)}`,
          {},
          userHeaders,
        );
        if (!leads.length)
          return reply({ error: "Lead unavailable.", trace }, 403);
        const l = leads[0];
        const [estimates, contacts, projects, prices] = await Promise.all([
          rest(
            `portal_estimates?org_id=eq.${org}&id=eq.${l.estimate_id}`,
            {},
            userHeaders,
          ),
          rest(
            `portal_contacts?org_id=eq.${org}&id=eq.${l.contact_id}`,
            {},
            userHeaders,
          ),
          rest(
            `portal_projects?org_id=eq.${org}&id=eq.${l.project_id}`,
            {},
            userHeaders,
          ),
          rest(
            `portal_prices?org_id=eq.${org}&status=eq.published`,
            {},
            userHeaders,
          ),
        ]);
        const estimate = estimates[0].snapshot,
          customer = l.context.contactAtEnquiry || contacts[0].details,
          date = new Date().toISOString().slice(0, 10);
        const eligible = prices
          .map((p) => p.definition)
          .filter(
            (p) =>
              p.validFrom <= date &&
              p.validTo >= date &&
              (p.territories.includes("*") ||
                p.territories.includes(customer.pincode)),
          );
        if (eligible.length !== 1)
          throw new PortalError(
            "One unambiguous approved price list is required. Commercial review needed.",
          );
        const priced = priceEstimate(estimate, eligible[0], {
          discountBps: b.discountBps || 0,
          chargesMinor: b.chargesMinor || 0,
          territory: customer.pincode,
          date,
        });
        const snapshot = {
          ...priced,
          estimate,
          customer,
          project: projects[0].name,
          type: "OFFICIAL QUOTATION",
          createdAt: new Date().toISOString(),
        };
        return reply(
          await rpc("portal_quote_create", {
            p_org: org,
            p_actor: user.id,
            p_lead: l.id,
            p_version: b.version,
            p_snapshot: snapshot,
            p_expires: b.expiresAt,
            p_reason: String(b.reason || "").slice(0, 1000),
            p_request: uuid(b.requestId),
          }),
        );
      }
      if (b.action === "quote_transition") {
        const token = Array.from(
          crypto.getRandomValues(new Uint8Array(32)),
          (n) => n.toString(16).padStart(2, "0"),
        ).join("");
        const result = await rpc("portal_quote_transition", {
          p_org: org,
          p_actor: user.id,
          p_quote: uuid(b.quoteId),
          p_version: b.version,
          p_action: b.operation,
          p_token_hash: b.operation === "issue" ? await hash(token) : null,
        });
        return reply({
          ...result,
          ...(b.operation === "issue" ? { token } : {}),
        });
      }
      return reply({ error: "Unsupported operation.", trace }, 400);
    } catch (e) {
      const msg = String(e?.message || "");
      const conflict = /conflict/.test(msg),
        denied = /access_denied|approval_not_permitted/.test(msg),
        rate = /rate_limited/.test(msg);
      return reply(
        {
          error:
            e instanceof PortalError
              ? msg
              : conflict
                ? "This record changed or the retry payload differs. Refresh before trying again."
                : denied
                  ? "Your role cannot perform this action."
                  : rate
                    ? "Too many requests. Please retry later."
                    : "The operation could not be completed. Your input has been retained.",
          field: e?.field || undefined,
          trace,
        },
        e instanceof PortalError
          ? 400
          : conflict
            ? 409
            : denied
              ? 403
              : rate
                ? 429
                : 503,
      );
    }
  };
}
