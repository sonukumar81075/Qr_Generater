import { forwardRef } from "react";

const LOGO_FALLBACK = "/images/reward_image.png";
const STEP_SCAN_ICON = "/images/scan.png";
const STEP_COLLECT_ICON = "/images/collect_01.png";
const STEP_REWARD_ICON = "/images/reward.png";

export const STAND_CARD_BASE_WIDTH_PX = 320;

function StepItem({ idx, label, iconSrc, exportMode = false }) {
  return (
    <div className="relative mx-auto flex w-[86px] flex-col items-center">
      <div
        className="relative z-10 flex h-[70px] w-[70px] items-center justify-center rounded-full border-2 border-[#15803d] bg-white shadow-[0_1px_3px_rgba(45,90,63,0.08)]"
      >
        <span
          className="absolute left-[26px] top-[-8px] z-20 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#15803d] text-center text-[10px] font-bold leading-none text-white"
        >
          <span className="relative top-[-6px]">{idx}</span>
        </span>
        <img
          src={iconSrc}
          alt=""
          className={`h-auto max-h-[56px] rounded-full w-auto max-w-[56px] object-contain ${exportMode ? "" : "scale-110"
            }`}
          draggable={false}
        />
      </div>
      <p
        className="-mt-1 w-full text-center text-[13px] font-black leading-[1.2] text-slate-700"
      >
        {label}
      </p>
    </div>
  );
}

export const ReviewStandCard = forwardRef(function ReviewStandCard(
  {
    qr,
    qrDataUrl,
    secretText = "",
    cardWidthPx = STAND_CARD_BASE_WIDTH_PX,
    brandLogoDataUrl = null,
    exportMode = false,
  },
  ref
) {
  const qrSrc =
    typeof qr === "string" && qr.trim()
      ? qr
      : typeof qrDataUrl === "string" && qrDataUrl.trim()
        ? qrDataUrl
        : null;
  const logoSrc =
    typeof brandLogoDataUrl === "string" && brandLogoDataUrl.trim()
      ? brandLogoDataUrl
      : LOGO_FALLBACK;

  return (
    <div
      ref={ref}
      className="box-border overflow-hidden rounded-[22px] border border-[#15803d]  shadow-[0_3px_12px_rgba(45,90,63,0.1)]"
      style={{
        width: cardWidthPx,
        backgroundColor: "#f3f8f3",
        backgroundImage: `
          radial-gradient(circle at 100% 0%, #ffffff 0%,rgb(255, 255, 255) 0%, transparent 0%),
          url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 13.278 60.562 12 50 12c-10.626 0-16.855 1.397-26.66 5.063l-1.767.662c-2.475.923-4.66 1.674-6.724 2.275h6.335zm0-20C13.258 2.892 8.077 4 0 4V2c5.744 0 9.951-.814 17.73-3.735L18.992-2h2.192zM50 20c-10.271 0-15.362-1.222-24.629-4.928C24.416 14.688 23.502 14.331 22.62 14h-6.225c2.51.73 5.139 1.691 8.233 2.928C34.112 20.722 39.438 22 50 22c10.626 0 16.855-1.397 26.66-5.063l1.767-.662c2.475-.923 4.66-1.674 6.724-2.275h-6.335c-.357.13-.72.264-1.088.402l-1.768.661C66.36 18.653 60.353 20 50 20z' fill='%2315803d' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E")
        `,
      }}
    >
      <div className="mx-auto w-full pt-3 ">
        {/* Logo Section */}
        <div className="flex justify-center">
          <img
            src={logoSrc}
            alt="Logo"
            className={`block h-auto w-[180px] max-w-full object-contain ${exportMode ? "" : "scale-125"
              }`}
            draggable={false}
          />
        </div>

        {/* Heading Section */}
        <div className="mt-4 text-center px-4 relative top-[-16px] ">

          {/* Left "Scanner" Icon - Positioned Up next to SCAN */}
          <div className="absolute left-6 top-5 flex flex-col items-start gap-[3px]">
            <div className="h-[2.5px] w-[18px] rounded-full bg-[#15803d]"></div>
            <div className="h-[2.5px] w-[10px] rounded-full bg-[#15803d] opacity-60"></div>
            <div className="h-[2.5px] w-[14px] rounded-full bg-[#15803d] opacity-30"></div>
          </div>

          <h2 className="font-extrabold uppercase tracking-tight text-[#2f343a] text-[32px] leading-none">
            Scan & Get
          </h2>

          <div className="mt-1 flex justify-center items-center gap-2">
            <span className="text-[32px] font-[900] leading-none text-[#15803d]">
              FREE
            </span>
            <span className="text-[26px] font-bold leading-none text-[#2f343a]">
              REWARDS!
            </span>

            {/* Right "Scanner" Icon - Positioned at end of REWARDS! */}
            <div className="flex flex-col items-end gap-[3px] ml-1 mt-6">
              <div className="h-[2.5px] w-[14px] rounded-full bg-[#15803d] opacity-30"></div>
              <div className="h-[2.5px] w-[10px] rounded-full bg-[#15803d] opacity-60"></div>
              <div className="h-[2.5px] w-[18px] rounded-full bg-[#15803d]"></div>
            </div>
          </div>
        </div>

        {/* QR Section */}
        <div className="relative mt-3 flex justify-center px-2">
          <div className="relative w-[185px] rounded-[16px] border-[5px] border-[#15803d] bg-white p-[6px] shadow-sm">
            <img
              src={qrSrc}
              alt="QR code"
              className="mx-auto block h-[150px] w-[150px] object-contain"
              draggable={false}
            />

            {exportMode ? (
              <div className="absolute bottom-[-18px] left-1/2 flex -translate-x-1/2 justify-center">
                <div className="flex min-w-[128px] items-center justify-center gap-2 rounded-full bg-[#2e7d32] px-3 py-1  text-[10px] font-semibold text-white shadow-lg">
                  <div className="flex h-[16px] w-[16px] items-center justify-center rounded-full bg-white/20">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-[12px] w-[12px]"
                      viewBox="0 0 24 24"
                      fill="white"
                    >
                      <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm10-2h6v6h-6V3zm2 2v2h2V5h-2zM3 15h6v6H3v-6zm2 2v2h2v-2H5zm12-2h2v2h-2v-2zm0 4h2v2h-2v-2zm-4-4h2v6h-6v-2h4v-4z" />
                    </svg>
                  </div>
                  <span className="relative top-[-6px] whitespace-nowrap text-[10px] font-bold leading-none tracking-wide text-white">
                    Scan Here Now
                  </span>
                </div>
              </div>
            ) : (
              <div className="absolute bottom-[-18px] left-0 right-0 flex translate-y-1/2 justify-center">
                <div className="flex items-center justify-center gap-2 rounded-full bg-[#2e7d32] px-3 py-1  text-[10px] font-semibold text-white shadow-lg">
                  <div className="flex h-[16px] w-[16px] items-center justify-center rounded-full bg-white/20">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-[12px] w-[12px]"
                      viewBox="0 0 24 24"
                      fill="white"
                    >
                      <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm10-2h6v6h-6V3zm2 2v2h2V5h-2zM3 15h6v6H3v-6zm2 2v2h2v-2H5zm12-2h2v2h-2v-2zm0 4h2v2h-2v-2zm-4-4h2v6h-6v-2h4v-4z" />
                    </svg>
                  </div>
                  <span className="relative top-[-4px] whitespace-nowrap text-[10px] font-bold leading-none tracking-wide text-white">
                    Scan Here Now
                  </span>
                </div>
              </div>
            )}
          </div>

          {secretText ? (
            <div className="absolute right-10 top-1/2 -translate-y-1/2 rounded-md   bg-[#15803d]/10 px-1 pt-1 pb-3 text-center">
              <span className="block text-[9px] font-semibold uppercase leading-tight text-[#14532d]">
                ID
              </span>
              <span className="mt-0.5 block whitespace-pre font-mono text-[9px] font-bold uppercase leading-[9px] text-[#14532d]">
                {secretText.split("").join("\n")}
              </span>
            </div>
          ) : null}
        </div>

        {/* Steps Section */}
        <div className="relative mt-7 px-4">
          <div className="absolute left-[17.5%] top-[35px] h-[2px] w-[65%] bg-[#15803d]/30" />

          <div className="relative z-10 grid grid-cols-3 justify-items-center">
            <StepItem idx={1} label="Scan" iconSrc={STEP_SCAN_ICON} exportMode={exportMode} />
            <StepItem idx={2} label="Collect" iconSrc={STEP_COLLECT_ICON} exportMode={exportMode} />
            <StepItem idx={3} label="Reward" iconSrc={STEP_REWARD_ICON} exportMode={exportMode} />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-2">
          <div className="w-full bg-[#15803d] py-4 text-center">
            <span className="flex items-center justify-center gap-2 text-[19px] font-bold tracking-wide text-white -mt-4">
              <span className="text-yellow-400">✦</span>
              Start Earning <span className="text-yellow-400">Today!</span>
              <span className="text-yellow-400">✦</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

ReviewStandCard.displayName = "ReviewStandCard";