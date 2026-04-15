import QRCode from "qrcode";

export const MAX_QR_COUNT = 200;
export const TOKEN_CODE_LENGTH = 7;

/** URL-safe random string (e.g. for resolve tokens). */
export function randomAlphanumeric(length) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let s = "";
  for (let i = 0; i < length; i++) s += alphabet[bytes[i] % alphabet.length];
  return s;
}

/**
 * @param {string} baseUrl
 * @param {number} index
 * @param {{
 *   mode: "none" | "serial" | "token";
 *   paramName?: string;
 *   tokenPrefix?: string;
 *   suffixLength?: number;
 * }} tracking
 */
export function buildTrackedUrl(baseUrl, index, tracking) {
  if (!tracking || tracking.mode === "none") return baseUrl;
  const u = new URL(baseUrl);

  if (tracking.mode === "serial") {
    u.searchParams.set("id", String(index + 1));
    return u.toString();
  }

  if (tracking.mode === "token") {
    const param = tracking.paramName?.trim() || "t";
    const value = randomAlphanumeric(TOKEN_CODE_LENGTH);
    u.searchParams.set(param, value);
    return u.toString();
  }

  return baseUrl;
}

/**
 * Short label for stand cards: not the full URL.
 * - `serial`: `id` query value only (e.g. `1`, `2`).
 * - `token`: value of the tracking param with `tokenPrefix` removed (the random secret tail).
 * - `none`: empty (no tracking to show).
 *
 * @param {string} fullUrl
 * @param {{
 *   trackingMode?: "none" | "serial" | "token";
 *   tokenParam?: string;
 *   tokenPrefix?: string;
 * }} [opts]
 */
export function getQrSecretLabel(fullUrl, opts = {}) {
  const {
    trackingMode = "serial",
    tokenParam = "t",
    tokenPrefix = "rv_-",
  } = opts;
  try {
    const u = new URL(fullUrl);
    if (trackingMode === "none") {
      return "";
    }
    if (trackingMode === "serial") {
      const id = u.searchParams.get("id");
      return id != null ? id : "";
    }
    if (trackingMode === "token") {
      const param = tokenParam?.trim() || "t";
      const v = u.searchParams.get(param);
      if (v == null || v === "") return "";
      const prefix = tokenPrefix ?? "";
      if (prefix.length > 0 && v.startsWith(prefix)) {
        const rest = v.slice(prefix.length);
        return rest !== "" ? rest : v;
      }
      return v;
    }
    return "";
  } catch {
    return "";
  }
}

/**
 * @param {string} text
 * @param {{
 *   width: number;
 *   margin: number;
 *   dark: string;
 *   light: string;
 *   logoDataUrl?: string | null;
 *   logoMaxFraction?: number;
 * }} opts
 * `logoMaxFraction` — max logo size vs QR width (default 0.22; ~0.18–0.2 for a subtle watermark).
 */
export async function generateQrDataUrl(text, opts) {
  const {
    width,
    margin,
    dark,
    light,
    logoDataUrl,
    logoMaxFraction,
  } = opts;

  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, text, {
    width,
    margin,
    color: { dark, light },
    errorCorrectionLevel: logoDataUrl ? "H" : "M",
  });

  if (logoDataUrl) {
    await drawLogoOnCanvas(
      canvas,
      logoDataUrl,
      width,
      light,
      logoMaxFraction ?? 0.22
    );
  }

  return canvas.toDataURL("image/png");
}

function drawLogoOnCanvas(
  canvas,
  logoSrc,
  qrPixelWidth,
  lightColor,
  logoMaxFraction = 0.22
) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas unsupported"));
        return;
      }
      const frac = Math.min(0.28, Math.max(0.12, logoMaxFraction));
      const logoMax = qrPixelWidth * frac;
      const aspect = img.width / Math.max(img.height, 1);
      let lw = logoMax;
      let lh = logoMax / aspect;
      if (lh > logoMax) {
        lh = logoMax;
        lw = lh * aspect;
      }
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const pad = Math.max(2, logoMax * 0.12);
      ctx.fillStyle = lightColor || "#ffffff";
      ctx.fillRect(cx - lw / 2 - pad, cy - lh / 2 - pad, lw + pad * 2, lh + pad * 2);
      ctx.drawImage(img, cx - lw / 2, cy - lh / 2, lw, lh);
      resolve();
    };
    img.onerror = () => reject(new Error("Logo image failed to load"));
    img.src = logoSrc;
  });
}

