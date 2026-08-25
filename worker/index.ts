/** Cloudflare Worker entry point for the Arch Engineering website. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
  RESEND_API_KEY?: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

type ContactPayload = {
  name?: string; email?: string; phone?: string; company?: string;
  service?: string; timeline?: string; budget?: string; details?: string; website?: string;
};

const jsonHeaders = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const clean = (value: unknown, maximum: number) => typeof value === "string" ? value.trim().slice(0, maximum) : "";
const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
}[character] || character));

async function handleContact(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed." }), {
      status: 405, headers: { ...jsonHeaders, allow: "POST" }
    });
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > 20000) {
    return new Response(JSON.stringify({ ok: false, error: "Request is too large." }), { status: 413, headers: jsonHeaders });
  }

  let payload: ContactPayload;
  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid request." }), { status: 400, headers: jsonHeaders });
  }

  if (clean(payload.website, 100)) {
    return new Response(JSON.stringify({ ok: true }), { headers: jsonHeaders });
  }

  const name = clean(payload.name, 100);
  const email = clean(payload.email, 180).toLowerCase();
  const phone = clean(payload.phone, 60);
  const company = clean(payload.company, 120);
  const service = clean(payload.service, 160);
  const timeline = clean(payload.timeline, 80);
  const budget = clean(payload.budget, 80);
  const details = clean(payload.details, 5000);

  if (!name || !validEmail(email) || !service || !details) {
    return new Response(JSON.stringify({ ok: false, error: "Please complete all required fields." }), { status: 400, headers: jsonHeaders });
  }
  if (!env.RESEND_API_KEY) {
    console.error(JSON.stringify({ event: "contact_email_failed", reason: "missing_resend_secret" }));
    return new Response(JSON.stringify({ ok: false, error: "Email service is not configured. Please call or email us directly." }), { status: 503, headers: jsonHeaders });
  }

  const fields = [
    ["Name", name], ["Email", email], ["Phone", phone || "Not provided"],
    ["Company", company || "Not provided"], ["Service", service],
    ["Timeline", timeline || "Not provided"], ["Budget", budget || "Not provided"],
    ["Project details", details]
  ];
  const rows = fields.map(([label, value]) =>
    `<tr><th style="padding:10px;text-align:left;vertical-align:top;background:#eef4fb;border:1px solid #d9e3ef">${escapeHtml(label)}</th><td style="padding:10px;border:1px solid #d9e3ef;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`
  ).join("");
  const text = fields.map(([label, value]) => `${label}: ${value}`).join("\n\n");

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
      "idempotency-key": crypto.randomUUID()
    },
    body: JSON.stringify({
      from: "Arch Engineering Website <website@archengineeringservices.com>",
      to: ["archengservices2022@gmail.com"],
      reply_to: email,
      subject: `New website enquiry: ${service}`,
      html: `<div style="font-family:Arial,sans-serif;color:#102947"><h2>New Arch Engineering website enquiry</h2><table style="border-collapse:collapse;width:100%;max-width:720px">${rows}</table><p style="color:#64748b">Reply to this email to respond directly to ${escapeHtml(name)}.</p></div>`,
      text
    })
  });

  if (!emailResponse.ok) {
    const providerError = (await emailResponse.text()).slice(0, 1000);
    console.error(JSON.stringify({ event: "contact_email_failed", status: emailResponse.status, providerError }));
    return new Response(JSON.stringify({ ok: false, error: "We could not send your enquiry. Please try again or call us." }), { status: 502, headers: jsonHeaders });
  }

  console.log(JSON.stringify({ event: "contact_email_sent", service, submittedAt: new Date().toISOString() }));
  return new Response(JSON.stringify({ ok: true }), { headers: jsonHeaders });
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact") return handleContact(request, env);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
