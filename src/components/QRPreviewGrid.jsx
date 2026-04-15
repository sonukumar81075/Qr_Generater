import { motion } from "framer-motion";

/**
 * @param {object} props
 * @param {Array<{ index: number; url: string; dataUrl: string }>} props.items
 * @param {(item: object) => void} [props.onDownloadPng]
 */
export function QRPreviewGrid({ items, onDownloadPng }) {
  if (!items?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-10"
    >
      <h3 className="font-display text-lg font-semibold text-white">
        Preview
        <span className="ml-2 text-sm font-normal text-slate-500">({items.length})</span>
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        QR images only. Hover a code for the encoded URL.
      </p>
      <div className="mt-4 mx-auto grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {items.map((item, i) => (
          <motion.article
            key={item.index}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(i * 0.015, 0.35) }}
            className="rounded-xl border border-white/10 bg-slate-900/60 p-3 transition hover:border-cyan-500/30"
          >
            <div className="overflow-hidden rounded-lg bg-white p-2">
              <img
                src={item.dataUrl}
                alt={`QR ${item.index}`}
                title={item.url}
                className="aspect-square w-full object-contain"
              />
            </div>
            <p className="mt-2 text-center text-xs font-medium text-slate-400">
              #{item.index}
            </p>
            <button
              type="button"
              onClick={() => onDownloadPng?.(item)}
              className="mt-2 w-full rounded-lg border border-white/10 py-1.5 text-xs text-slate-300 transition hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-white"
            >
              Download PNG
            </button>
          </motion.article>
        ))}
      </div>
    </motion.div>
  );
}
