import html2canvas from "html2canvas";

/** ~300 DPI effective when card is ~90mm wide: 90mm * 300/25.4 ≈ 1063px → scale 4 on 320px ≈ 1280px */
export const STAND_CAPTURE_SCALE = 4;

async function waitForRenderableAssets(element) {
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
}

export async function captureElementToPng(element, scale = STAND_CAPTURE_SCALE) {
  if (!element) throw new Error("Nothing to capture");
  await waitForRenderableAssets(element);
  const canvas = await html2canvas(element, {
    scale: Math.max(2, scale),
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    logging: false,
    scrollX: 0,
    scrollY: 0,
    width: element.offsetWidth,
    height: element.offsetHeight,
    windowWidth: element.scrollWidth || element.offsetWidth,
    windowHeight: element.scrollHeight || element.offsetHeight,
  });
  return {
    dataUrl: canvas.toDataURL("image/png", 1.0),
    widthPx: canvas.width,
    heightPx: canvas.height,
  };
}
