import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { motion } from "framer-motion";
import {
  ReviewStandCard,
  STAND_CARD_BASE_WIDTH_PX,
} from "./ReviewStandCard.jsx";
import {
  MAX_QR_COUNT,
  buildTrackedUrl,
  generateQrDataUrl,
  getQrSecretLabel,
} from "../lib/qrPdf.js";
import { captureElementToPng, STAND_CAPTURE_SCALE } from "../lib/standCapture.js";

/** QR center logo max width vs module size — kept ≤~20% for reliable scanning */
const STAND_QR_LOGO_FRACTION = 0.19;
/**
 * The card layout is pixel-tuned for the base width.
 * Going below this starts to wrap footer/title text in captures.
 */
const STAND_MIN_SAFE_WIDTH_PX = STAND_CARD_BASE_WIDTH_PX;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Stand pack uses the same tracking as the main form (serial ?id= or token ?t=…).
 * Reward/offer card layout — high-res PNG export.
 */
export function ReviewStandPanel({
  baseUrl,
  count,
  logoDataUrl,
  formId,
  /** @type {"none" | "serial" | "token"} */
  trackingMode = "serial",
  tokenParam = "t",
  tokenPrefix = "",
  tokenSuffixLength = 7,
}) {
  const cardRef = useRef(null);
  /** QR image for stand capture */
  const [capturePayload, setCapturePayload] = useState(null);
  const [standBusy, setStandBusy] = useState(false);
  const [standProgress, setStandProgress] = useState("");
  const [error, setError] = useState("");

  const [headingMode, setHeadingMode] = useState("scan-earn");
  const [heading, setHeading] = useState("Scan & Earn Rewards 🎁");
  const [mainText, setMainText] = useState(
    "Scan the QR code to get exciting offers and rewards"
  );
  const [footerText, setFooterText] = useState(
    "Collect points on every scan and redeem exclusive rewards"
  );
  const [brandLine, setBrandLine] = useState("");
  /** Stand card width in CSS px — scales layout + QR sharpness */
  const [standCardWidth, setStandCardWidth] = useState(STAND_CARD_BASE_WIDTH_PX);
  const [standShowHeaderLogo, setStandShowHeaderLogo] = useState(true);
  /** Off by default — clean scannable QR; header brand logo stays separate */
  const [standEmbedQrLogo, setStandEmbedQrLogo] = useState(false);

  const exportCardWidth = Math.max(STAND_MIN_SAFE_WIDTH_PX, standCardWidth);
  const qrWidth = Math.round(
    Math.min(800, Math.max(200, 400 * (exportCardWidth / STAND_CARD_BASE_WIDTH_PX)))
  );

  useEffect(() => {
    if (headingMode === "scan-earn") setHeading("Scan & Earn Rewards 🎁");
    else if (headingMode === "unlock") setHeading("Unlock Your Reward");
  }, [headingMode]);

  async function waitForCaptureSettle(isFirst = false) {
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));
    await sleep(isFirst ? 220 : 120);
  }

  async function runDownloadAllPng() {
    setError("");
    let base;
    try {
      base = new URL(baseUrl.trim()).toString();
    } catch {
      setError("Enter a valid URL.");
      return;
    }
    const n = Math.min(MAX_QR_COUNT, Math.max(1, Number(count) || 1));
    const tracking =
      trackingMode === "none"
        ? { mode: "none" }
        : trackingMode === "serial"
          ? { mode: "serial" }
          : {
              mode: "token",
              paramName: tokenParam,
              tokenPrefix,
              suffixLength: tokenSuffixLength,
            };

    setStandBusy(true);
    try {
      for (let i = 0; i < n; i++) {
        setStandProgress(`PNG ${i + 1} / ${n}…`);
        const text = buildTrackedUrl(base, i, tracking);
        const secretText = getQrSecretLabel(text, {
          trackingMode,
          tokenParam,
          tokenPrefix,
        });
        const qrDataUrl = await generateQrDataUrl(text, {
          width: qrWidth,
          margin: 2,
          dark: "#000000",
          light: "#ffffff",
          logoDataUrl: standEmbedQrLogo && logoDataUrl ? logoDataUrl : null,
          logoMaxFraction: STAND_QR_LOGO_FRACTION,
        });
        flushSync(() =>
          setCapturePayload({ qrDataUrl, secretText })
        );
        await waitForCaptureSettle(i === 0);
        const cap = await captureElementToPng(cardRef.current, STAND_CAPTURE_SCALE);
        const a = document.createElement("a");
        a.href = cap.dataUrl;
        a.download = `reward-stand-${String(i + 1).padStart(3, "0")}.png`;
        a.click();
        await new Promise((r) => setTimeout(r, 250));
      }
    } catch (e) {
      setError(e?.message || "PNG export failed.");
    } finally {
      flushSync(() => setCapturePayload(null));
      setStandBusy(false);
      setStandProgress("");
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-10 rounded-2xl border border-orange-500/20 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-6 shadow-xl sm:p-8"
    >
      <div className="flex flex-col gap-2 border-b border-white/5 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">
            Print-ready reward stand
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Offer &amp; loyalty layout (orange / black / white). Uses the same{" "}
            <strong className="font-medium text-slate-300">Tracking</strong> mode as above
            (sequential <code className="text-orange-400/90">?id=</code> or unique token{" "}
            <code className="text-orange-400/90">?t=</code>). Under the QR, only the card id or
            token secret is shown (not the full URL). Nothing stored.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-500">Heading preset</label>
            <select
              value={headingMode}
              onChange={(e) => setHeadingMode(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              <option value="scan-earn">Scan &amp; Earn Rewards 🎁</option>
              <option value="unlock">Unlock Your Reward</option>
              <option value="custom">Custom (edit field →)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500" htmlFor={`${formId}-bh`}>
              Heading (editable)
            </label>
            <input
              id={`${formId}-bh`}
              type="text"
              value={heading}
              onChange={(e) => {
                setHeading(e.target.value);
                setHeadingMode("custom");
              }}
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500" htmlFor={`${formId}-bl`}>
            Business name (optional)
          </label>
          <input
            id={`${formId}-bl`}
            type="text"
            value={brandLine}
            onChange={(e) => setBrandLine(e.target.value)}
            placeholder="e.g. Café Local"
            className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
          />
        </div>
        {logoDataUrl ? (
          <div className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-3">
            <p className="text-xs font-medium text-slate-500">
              Brand logo{" "}
              <span className="font-normal text-slate-600">(main form upload)</span>
            </p>
            <label className="mt-2 flex cursor-pointer items-start gap-2.5 text-sm leading-snug text-slate-200">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-slate-900 accent-orange-500"
                checked={standShowHeaderLogo}
                onChange={(e) => setStandShowHeaderLogo(e.target.checked)}
              />
              <span>Show logo above card title (centered, print-sharp)</span>
            </label>
            <label className="mt-2 flex cursor-pointer items-start gap-2.5 text-sm leading-snug text-slate-200">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-slate-900 accent-orange-500"
                checked={standEmbedQrLogo}
                onChange={(e) => setStandEmbedQrLogo(e.target.checked)}
              />
              <span>
                Embed small logo in QR center (~{Math.round(STAND_QR_LOGO_FRACTION * 100)}
                %, high error correction — stays scannable)
              </span>
            </label>
          </div>
        ) : null}
        <div>
          <label className="text-xs font-medium text-slate-500" htmlFor={`${formId}-main`}>
            Main message
          </label>
          <textarea
            id={`${formId}-main`}
            rows={2}
            value={mainText}
            onChange={(e) => setMainText(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500" htmlFor={`${formId}-foot`}>
            Bottom line (points / offer)
          </label>
          <textarea
            id={`${formId}-foot`}
            rows={2}
            value={footerText}
            onChange={(e) => setFooterText(e.target.value)}
            placeholder="Collect points… or Scan now and get your special offer instantly"
            className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-medium text-slate-500" htmlFor={`${formId}-cw`}>
              Card width
            </label>
            <span className="text-xs tabular-nums text-orange-400/90">{standCardWidth}px</span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <input
              id={`${formId}-cw`}
              type="range"
              min={STAND_MIN_SAFE_WIDTH_PX}
              max={520}
              step={10}
              value={standCardWidth}
              onChange={(e) => setStandCardWidth(Number(e.target.value))}
              className="h-2 flex-1 cursor-pointer accent-orange-500"
            />
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                className="rounded-lg border border-white/15 bg-slate-800 px-2 py-1 text-xs text-white hover:border-orange-500/40"
                onClick={() =>
                  setStandCardWidth((w) => Math.max(STAND_MIN_SAFE_WIDTH_PX, w - 10))
                }
                aria-label="Decrease card width"
              >
                −
              </button>
              <button
                type="button"
                className="rounded-lg border border-white/15 bg-slate-800 px-2 py-1 text-xs text-white hover:border-orange-500/40"
                onClick={() =>
                  setStandCardWidth((w) => Math.min(520, w + 10))
                }
                aria-label="Increase card width"
              >
                +
              </button>
            </div>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Smaller cards fit more per sheet; larger cards are easier to read. QR resolution scales
            with size. Minimum width is locked to keep layout aligned in PNG exports.
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={standBusy}
          onClick={runDownloadAllPng}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:opacity-60"
        >
          {standBusy && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          {standBusy ? standProgress || "Working…" : "Download all card PNGs"}
        </button>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Capture scale {STAND_CAPTURE_SCALE}× for sharp print PNGs; physical size follows your card
        width setting.
      </p>

      <div
        className="pointer-events-none fixed left-0 top-0 opacity-0"
        aria-hidden
      >
        {capturePayload ? (
          <ReviewStandCard
            ref={cardRef}
            qrDataUrl={capturePayload.qrDataUrl}
            secretText={capturePayload.secretText ?? ""}
            brandLogoDataUrl={
              standShowHeaderLogo && logoDataUrl ? logoDataUrl : null
            }
            cardWidthPx={exportCardWidth}
            exportMode
            heading={heading}
            mainText={mainText}
            footerText={footerText}
            brandLine={brandLine}
          />
        ) : null}
      </div>
    </motion.section>
  );
}
