import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { supabaseAdmin } from "@/lib/supabase";
import { pickedSummary, type Picked } from "@/lib/options";
import { POINTS_FOR_DRINK, POINTS_PER_ORDER } from "@/lib/rewards-rules";
import { pointsFor } from "@/lib/rewards";

// Customer emails, sent from R&X's Gmail with an app password
// (GMAIL_USER + GMAIL_APP_PASSWORD). Without those set, emails are skipped and
// everything else keeps working. Each order email goes out once: the column
// that marks it sent is claimed before sending.

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rx-fresas.vercel.app";
const ROSE = "#e8506a";

let transport: Transporter | null | undefined;
function mailer() {
  if (transport === undefined) {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
    transport = user && pass ? nodemailer.createTransport({ service: "gmail", auth: { user, pass } }) : null;
  }
  return transport;
}

export const emailReady = () => !!mailer();

async function send(to: string, subject: string, html: string, text: string) {
  const m = mailer();
  if (!m) {
    console.info(`[email] not configured, skipped: ${subject}`);
    return false;
  }
  await m.sendMail({ from: { name: "R&X Fresas con Crema", address: process.env.GMAIL_USER! }, to, subject, html, text });
  return true;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

/** A simple pink card that looks right in Gmail, Apple Mail and Outlook */
function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#fdf3ee;font-family:Helvetica,Arial,sans-serif;color:#3b2a2a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf3ee;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden">
<tr><td style="background:${ROSE};padding:22px 28px;color:#fff;font-size:20px;font-weight:bold">R&amp;X Fresas con Crema ♡</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 12px;font-size:24px;color:#3b2a2a">${title}</h1>
${body}
</td></tr>
<tr><td style="padding:18px 28px;background:#fff5f6;font-size:12px;color:#8a6f6f">Richmond, CA · <a href="${SITE}" style="color:${ROSE}">${SITE.replace(/^https?:\/\//, "")}</a></td></tr>
</table></td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<p style="margin:24px 0 0"><a href="${href}" style="display:inline-block;background:${ROSE};color:#fff;text-decoration:none;font-weight:bold;padding:12px 26px;border-radius:999px">${label}</a></p>`;

type EmailOrder = {
  id: string;
  order_number: number | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  fulfillment_type: "pickup" | "delivery";
  delivery_address: string | null;
  location: string;
  pickup_day: string;
  pickup_time: string;
  subtotal_cents: number;
  discount_cents: number;
  delivery_fee_cents: number;
  platform_fee_cents: number;
  card_fee_cents: number;
  total_cents: number;
  points_redeemed: number;
  order_items: { name: string; quantity: number; price_cents: number; options: Picked[] | null }[];
};

async function loadOrder(id: string) {
  const { data } = await supabaseAdmin.from("orders").select("*, order_items(name, quantity, price_cents, options)").eq("id", id).maybeSingle();
  return data as EmailOrder | null;
}

/** Marks the email as sent; false if it already was (or there's nowhere to send it) */
async function claim(id: string, column: "confirmation_emailed_at" | "ready_emailed_at") {
  const { data } = await supabaseAdmin.from("orders").update({ [column]: new Date().toISOString() }).eq("id", id).is(column, null).select("id");
  return !!data?.length;
}

const when = (o: EmailOrder) => `${o.pickup_day.toLowerCase()} a las ${o.pickup_time}`;

export async function sendOrderConfirmation(orderId: string) {
  if (!mailer()) return;
  const o = await loadOrder(orderId);
  if (!o?.customer_email || !(await claim(o.id, "confirmation_emailed_at"))) return;

  const first = esc(o.customer_name.split(" ")[0]);
  const number = o.order_number ? `#${o.order_number}` : `#${o.id.slice(0, 8).toUpperCase()}`;
  const delivery = o.fulfillment_type === "delivery";
  const { points } = await pointsFor(o.customer_phone);

  const rows = o.order_items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${i.quantity} × ${esc(i.name)}${i.options?.length ? `<br><span style="font-size:12px;color:#8a6f6f">${esc(pickedSummary(i.options))}</span>` : ""}</td><td align="right" style="padding:6px 0;white-space:nowrap">${usd(i.price_cents * i.quantity)}</td></tr>`,
    )
    .join("");
  const line = (label: string, cents: number, minus = false) =>
    cents ? `<tr><td style="padding:3px 0;color:#8a6f6f">${label}</td><td align="right" style="padding:3px 0;color:#8a6f6f">${minus ? "−" : ""}${usd(cents)}</td></tr>` : "";

  const body = `
<p style="margin:0 0 16px;font-size:16px;line-height:1.5">${
    delivery
      ? `Recibimos tu pedido <strong>${number}</strong>. Lo llevamos a <strong>${esc(o.delivery_address ?? "")}</strong> ${esc(when(o))}.`
      : `Recibimos tu pedido <strong>${number}</strong>. Estará listo <strong>${esc(when(o))}</strong> en <strong>${esc(o.location)}</strong>.`
  }</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-top:1px solid #f1dede;border-bottom:1px solid #f1dede">${rows}</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:8px">
${line("Bebida gratis (puntos)", o.discount_cents, true)}${line("Entrega", o.delivery_fee_cents)}${line("Tarifa de servicio", o.platform_fee_cents + o.card_fee_cents)}
<tr><td style="padding:8px 0 0;font-weight:bold;font-size:16px">Total pagado</td><td align="right" style="padding:8px 0 0;font-weight:bold;font-size:16px;color:${ROSE}">${usd(o.total_cents)}</td></tr>
</table>
<p style="margin:20px 0 0;padding:14px 16px;background:#fff5f6;border-radius:14px;font-size:14px">⭐ Ganaste <strong>${POINTS_PER_ORDER} puntos</strong>. Llevas <strong>${points} de ${POINTS_FOR_DRINK}</strong> para una bebida gratis.</p>
<p style="margin:16px 0 0;font-size:14px;color:#8a6f6f">${delivery ? "Te avisamos cuando vaya en camino." : "Te avisamos por correo cuando esté lista."} ¿Preguntas? Solo responde a este correo.</p>
${button(`${SITE}/pedido/gracias/${o.id}`, "Ver mi pedido")}`;

  const text = `¡Gracias, ${o.customer_name.split(" ")[0]}! Recibimos tu pedido ${number}. ${
    delivery ? `Lo llevamos a ${o.delivery_address} ${when(o)}.` : `Estará listo ${when(o)} en ${o.location}.`
  } Total pagado: ${usd(o.total_cents)}. Llevas ${points} de ${POINTS_FOR_DRINK} puntos. ${SITE}/pedido/gracias/${o.id}`;

  await send(o.customer_email, `¡Gracias, ${o.customer_name.split(" ")[0]}! Tu pedido ${number} ♡`, layout(`¡Gracias, ${first}!`, body), text);
}

export async function sendOrderReady(orderId: string) {
  if (!mailer()) return;
  const o = await loadOrder(orderId);
  if (!o?.customer_email || !(await claim(o.id, "ready_emailed_at"))) return;

  const number = o.order_number ? `#${o.order_number}` : "";
  const delivery = o.fulfillment_type === "delivery";
  const title = delivery ? "¡Tu pedido va en camino! 🚗" : "¡Tu pedido está listo! 🍓";
  const body = delivery
    ? `<p style="margin:0;font-size:16px;line-height:1.5">Tu pedido ${number} salió del truck y va a <strong>${esc(o.delivery_address ?? "")}</strong>.</p>`
    : `<p style="margin:0;font-size:16px;line-height:1.5">Pasa por tu pedido ${number} en <strong>${esc(o.location)}</strong>. Solo di tu nombre: <strong>${esc(o.customer_name)}</strong>.</p>`;
  const text = delivery ? `Tu pedido ${number} va en camino a ${o.delivery_address}.` : `Tu pedido ${number} está listo en ${o.location}. Di tu nombre: ${o.customer_name}.`;
  await send(o.customer_email, title, layout(title, body), text);
}

export async function sendRewardCode(email: string, code: string) {
  const body = `<p style="margin:0 0 16px;font-size:16px;line-height:1.5">Usa este código para canjear tu bebida gratis. Vence en 15 minutos.</p>
<p style="margin:0;font-size:34px;font-weight:bold;letter-spacing:8px;color:${ROSE}">${code}</p>
<p style="margin:20px 0 0;font-size:13px;color:#8a6f6f">Si tú no lo pediste, ignora este correo. Tus puntos están seguros.</p>`;
  return send(email, `Tu código R&X: ${code}`, layout("Tu bebida gratis ⭐", body), `Tu código R&X es ${code}. Vence en 15 minutos.`);
}
