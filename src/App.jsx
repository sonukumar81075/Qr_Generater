import { useCallback, useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toPng } from "html-to-image";
import { QRPreviewGrid } from "./components/QRPreviewGrid.jsx";
import { ReviewStandPanel } from "./components/ReviewStandPanel.jsx";
import {
  MAX_QR_COUNT,
  TOKEN_CODE_LENGTH,
  buildTrackedUrl,
  generateQrDataUrl,
  getQrSecretLabel,
} from "./lib/qrPdf.js";
import { ReviewStandCard } from "./components/ReviewStandCard.jsx";

const PRESETS = [10, 20, 50, 100];
const DEFAULT_RESOLVE_URL = "https://reword.vansedemo.xyz/api/qr/resolve";

export default function App() {
  const formId = useId();
  const [url, setUrl] = useState(DEFAULT_RESOLVE_URL);
  const [count, setCount] = useState(1);
  /** @type {"none" | "serial" | "token"} */
  const [trackingMode, setTrackingMode] = useState("token");
  const [tokenParam, setTokenParam] = useState("t");
  const [tokenPrefix, setTokenPrefix] = useState("");
  const [tokenSuffixLength, setTokenSuffixLength] = useState(TOKEN_CODE_LENGTH);
  const [width, setWidth] = useState(320);
  const [margin, setMargin] = useState(2);
  const [dark, setDark] = useState("#0f172a");
  const [light, setLight] = useState("#ffffff");
  const [logoDataUrl, setLogoDataUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cardsPngLoading, setCardsPngLoading] = useState(false);
  const [isCaptureMode, setIsCaptureMode] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const scannerCardsRef = useRef(null);

  const onLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setLogoDataUrl(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Logo must be an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const clearLogo = () => {
    setLogoDataUrl(null);
  };

  const runGenerate = useCallback(async () => {
    setError("");
    const n = Math.min(MAX_QR_COUNT, Math.max(1, Number(count) || 1));
    let base;
    try {
      base = new URL(url.trim()).toString();
    } catch {
      setError("Enter a valid URL (include https://).");
      return;
    }

    setLoading(true);
    setItems([]);
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

    try {
      const out = [];
      for (let i = 0; i < n; i++) {
        const text = buildTrackedUrl(base, i, tracking);
        const dataUrl = await generateQrDataUrl(text, {
          width,
          margin,
          dark,
          light,
          logoDataUrl,
        });
        out.push({ index: i + 1, url: text, dataUrl });
      }
      setItems(out);
    } catch (err) {
      setError(err?.message || "Generation failed.");
    } finally {
      setLoading(false);
    }
  }, [
    url,
    count,
    trackingMode,
    tokenParam,
    tokenPrefix,
    tokenSuffixLength,
    width,
    margin,
    dark,
    light,
    logoDataUrl,
  ]);

  const waitForRenderableAssets = useCallback(async (element) => {
    if (!element) return;
    if (document?.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {
        // ignore and continue
      }
    }
    const imgs = Array.from(element.querySelectorAll("img"));
    await Promise.all(
      imgs.map(async (img) => {
        if (img.complete && img.naturalWidth > 0) return;
        try {
          if (typeof img.decode === "function") {
            await img.decode();
            return;
          }
        } catch {
          // ignore and fallback to events
        }
        await new Promise((resolve) => {
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
        });
      })
    );
  }, []);

  const downloadPng = (item) => {
    const a = document.createElement("a");
    a.href = item.dataUrl;
    a.download = `qr-${String(item.index).padStart(4, "0")}.png`;
    a.click();
  };

  const downloadCardsPng = useCallback(async () => {
    if (!items.length || !scannerCardsRef.current) {
      setError("Generate scanner cards first.");
      return;
    }
    setCardsPngLoading(true);
    setError("");
    try {
      setIsCaptureMode(true);
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));
      const node = scannerCardsRef.current;
      await waitForRenderableAssets(node);
      await new Promise((r) => requestAnimationFrame(r));
      const targetWidth = Math.max(1200, node.scrollWidth);
      const targetHeight = Math.round((targetWidth / node.scrollWidth) * node.scrollHeight);
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        canvasWidth: targetWidth,
        canvasHeight: targetHeight,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "qr-cards.png";
      a.click();
    } catch (err) {
      setError(err?.message || "PNG export failed.");
    } finally {
      setIsCaptureMode(false);
      setCardsPngLoading(false);
    }
  }, [items.length, waitForRenderableAssets]);

  const qrList = items.map((item) => ({
    id: item.index,
    qrUrl: item.dataUrl,
    secretText:
      getQrSecretLabel(item.url, {
        trackingMode,
        tokenParam,
        tokenPrefix,
      }) || String(item.index),
  }));

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(6,182,212,0.18),transparent)]">
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 font-display text-lg font-semibold text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-sm font-bold text-white shadow-lg shadow-cyan-500/20">
              QR
            </span>
            QR Card Lab
          </div>
          <p className="hidden text-xs text-slate-500 sm:block">
            100% in your browser · no server storage
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-sm font-medium text-cyan-400/90">Bulk QR → one PNG</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Generate multiple QR codes from one URL
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">
            Create a batch in memory, preview in a grid, then download scanner cards as
            one PNG image. Use sequential <code className="text-cyan-300/90">?id=</code> or
            unique resolve-style tokens (e.g.{" "}
            <code className="text-cyan-300/90">?t=7A2K9QF</code>) so each scan can be tracked.
            Nothing is stored.
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-10 rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-xl shadow-black/20 backdrop-blur sm:p-8"
        >
          <form
            id={formId}
            onSubmit={(e) => {
              e.preventDefault();
              runGenerate();
            }}
            className="space-y-6"
          >
            <div>
              <label
                htmlFor={`${formId}-url`}
                className="text-xs font-medium uppercase tracking-wider text-slate-500"
              >
                Destination URL
              </label>
              <input
                id={`${formId}-url`}
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={DEFAULT_RESOLVE_URL}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none ring-cyan-500/0 transition focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  How many QR codes
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PRESETS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCount(n)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${count === n
                          ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/25"
                          : "border border-white/10 bg-slate-950/50 text-slate-300 hover:border-white/20"
                        }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label htmlFor={`${formId}-count`} className="text-xs text-slate-500">
                    Custom (max {MAX_QR_COUNT})
                  </label>
                  <input
                    id={`${formId}-count`}
                    type="number"
                    min={1}
                    max={MAX_QR_COUNT}
                    value={count}
                    onChange={(e) =>
                      setCount(
                        Math.min(
                          MAX_QR_COUNT,
                          Math.max(1, Number(e.target.value) || 1)
                        )
                      )
                    }
                    className="w-24 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor={`${formId}-track`}
                  className="text-xs font-medium uppercase tracking-wider text-slate-500"
                >
                  Tracking / unique URL per QR
                </label>
                <select
                  id={`${formId}-track`}
                  value={trackingMode}
                  onChange={(e) => setTrackingMode(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/40"
                >
                  <option value="token">
                    Unique token (e.g. ?t=7A2K9QF)
                  </option>
                  <option value="serial">Sequential (?id=1 … ?id=n)</option>
                  <option value="none">None (same URL every QR)</option>
                </select>
                {trackingMode === "token" && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`${formId}-tparam`}
                        className="text-xs text-slate-500"
                      >
                        Query param name
                      </label>
                      <input
                        id={`${formId}-tparam`}
                        type="text"
                        value={tokenParam}
                        onChange={(e) => setTokenParam(e.target.value.replace(/[^a-zA-Z0-9_-]/g, "") || "t")}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 font-mono text-sm text-white"
                        placeholder="t"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">
                        Token format
                      </label>
                      <p className="mt-1 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 font-mono text-sm text-cyan-300/90">
                        {TOKEN_CODE_LENGTH} chars (A-Z, 0-9)
                      </p>
                    </div>
                  </div>
                )}
                {trackingMode === "token" && (
                  <p className="mt-3 text-xs text-slate-500">
                    Each QR gets a new random value:{" "}
                    <code className="text-cyan-300/90">
                      ?{tokenParam || "t"}=&lt;{TOKEN_CODE_LENGTH} uppercase A-Z/0-9 chars&gt;
                    </code>
                    . Example: <code className="text-cyan-300/90">?{tokenParam || "t"}=7A2K9QF</code>.
                  </p>
                )}
                {trackingMode === "serial" && (
                  <p className="mt-3 text-xs text-slate-500">
                    Appends <code className="text-cyan-300/90">?id=1</code> …{" "}
                    <code className="text-cyan-300/90">?id=n</code> (merges with existing
                    query strings).
                  </p>
                )}
                {trackingMode === "none" && (
                  <p className="mt-3 text-xs text-amber-400/90">
                    Every QR encodes the same URL (duplicate scans).
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-6 border-t border-white/5 pt-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor={`${formId}-width`}
                  className="text-xs font-medium uppercase tracking-wider text-slate-500"
                >
                  QR render size (px)
                </label>
                <input
                  id={`${formId}-width`}
                  type="number"
                  min={128}
                  max={1024}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white"
                />
              </div>
              <div>
                <label
                  htmlFor={`${formId}-margin`}
                  className="text-xs font-medium uppercase tracking-wider text-slate-500"
                >
                  Quiet zone (margin)
                </label>
                <input
                  id={`${formId}-margin`}
                  type="number"
                  min={0}
                  max={10}
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white"
                />
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Dark modules
                </span>
                <div className="mt-2 flex gap-2">
                  <input
                    type="color"
                    value={dark}
                    onChange={(e) => setDark(e.target.value)}
                    className="h-11 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                  />
                  <input
                    type="text"
                    value={dark}
                    onChange={(e) => setDark(e.target.value)}
                    className="flex-1 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 font-mono text-sm text-white"
                  />
                </div>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Light modules
                </span>
                <div className="mt-2 flex gap-2">
                  <input
                    type="color"
                    value={light}
                    onChange={(e) => setLight(e.target.value)}
                    className="h-11 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                  />
                  <input
                    type="text"
                    value={light}
                    onChange={(e) => setLight(e.target.value)}
                    className="flex-1 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 font-mono text-sm text-white"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-6">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Logo inside QR (optional)
              </span>
              <p className="mt-1 text-xs text-slate-500">
                Uses high error correction. Keep logos small and simple for reliable scans.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="cursor-pointer rounded-xl border border-dashed border-white/20 bg-slate-950/50 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-500/40">
                  <input type="file" accept="image/*" className="hidden" onChange={onLogoChange} />
                  Choose image
                </label>
                {logoDataUrl && (
                  <button
                    type="button"
                    onClick={clearLogo}
                    className="text-sm text-slate-500 underline hover:text-slate-300"
                  >
                    Remove logo
                  </button>
                )}
                {logoDataUrl && (
                  <img
                    src={logoDataUrl}
                    alt="Logo preview"
                    className="h-10 w-10 rounded border border-white/10 object-contain"
                  />
                )}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />
                )}
                {loading ? "Generating…" : "Generate preview"}
              </button>
              <button
                type="button"
                onClick={downloadCardsPng}
                disabled={cardsPngLoading || !items.length}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-slate-800/50 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-cyan-500/40 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cardsPngLoading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                {cardsPngLoading ? "Building PNG…" : "Download Cards PNG"}
              </button>
            </div>
            <p className="text-center text-xs text-slate-500">
              Downloads all scanner cards in one PNG image.
            </p>
          </form>
        </motion.section>

        <ReviewStandPanel
          baseUrl={url}
          count={count}
          logoDataUrl={logoDataUrl}
          formId={formId}
          trackingMode={trackingMode}
          tokenParam={tokenParam}
          tokenPrefix={tokenPrefix}
          tokenSuffixLength={tokenSuffixLength}
        />

        <QRPreviewGrid items={items} onDownloadPng={downloadPng} />
      </main>

      {qrList.length > 0 && (
        <section ref={scannerCardsRef} className="mx-auto mt-10 w-full max-w-5xl px-4 pb-4 sm:px-6">
          <h3 className="font-display text-lg font-semibold text-white">
            Scanner Card Preview
            <span className="ml-2 text-sm font-normal text-slate-500">
              ({qrList.length})
            </span>
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {qrList.map((item) => (
              <div key={item.id} className="flex flex-col items-center gap-2">
                <ReviewStandCard
                  qr={item.qrUrl}
                  secretText={item.secretText}
                  exportMode={isCaptureMode}
                  cardWidthPx={320}
                  brandLogoDataUrl={logoDataUrl}
                />
                <p className="text-xs font-medium text-slate-400">Card #{item.id}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-600">
        QR codes and PNG images are generated in your browser. No data is sent to a server.
      </footer>
    </div>
  );
}
