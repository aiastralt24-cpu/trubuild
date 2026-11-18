const base = import.meta.env.VITE_SUPABASE_URL,
  key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const connected = Boolean(
  base && key && !base.includes("YOUR_PROJECT") && !key.includes("YOUR_"),
);
let session = null;
export function currentSession() {
  return session;
}
export async function signIn(email, password) {
  if (!connected)
    throw new Error("Connect a Supabase project to enable staff sign-in.");
  const r = await fetch(base + "/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.msg || d.error_description || "Sign-in failed.");
  session = d;
  return d;
}
export async function signOut() {
  if (session)
    await fetch(base + "/auth/v1/logout", {
      method: "POST",
      headers: { apikey: key, Authorization: "Bearer " + session.access_token },
    });
  session = null;
}
export async function portal(action, body = {}) {
  if (!connected)
    throw new Error(
      "Live persistence is not configured. This is a demonstration workspace.",
    );
  const r = await fetch(base + "/functions/v1/portal", {
    method: "POST",
    headers: {
      apikey: key,
      "Content-Type": "application/json",
      ...(session ? { Authorization: "Bearer " + session.access_token } : {}),
    },
    body: JSON.stringify({ action, ...body }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok)
    throw new Error(
      (d.error || "Request failed.") +
        (d.trace ? ` Reference: ${d.trace}` : ""),
    );
  return d;
}
export async function verifyMfa(code) {
  const h = {
    apikey: key,
    Authorization: "Bearer " + session.access_token,
    "Content-Type": "application/json",
  };
  const u = await fetch(base + "/auth/v1/user", { headers: h }).then((r) =>
    r.json(),
  );
  const factor = u.factors?.find(
    (f) => f.factor_type === "totp" && f.status === "verified",
  );
  if (!factor)
    throw new Error(
      "Enroll a TOTP factor through your organisation’s approved account setup first.",
    );
  const challenge = await fetch(
    `${base}/auth/v1/factors/${factor.id}/challenge`,
    { method: "POST", headers: h, body: "{}" },
  ).then((r) => r.json());
  const r = await fetch(`${base}/auth/v1/factors/${factor.id}/verify`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ challenge_id: challenge.id, code }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error("MFA code was not accepted.");
  session = { ...session, ...d };
  return session;
}
export function downloadPdf(bytes, name) {
  const url = URL.createObjectURL(
    new Blob([bytes], { type: "application/pdf" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
