import StarLogo from "./StarLogo";

const APK_URL = "/sofia.apk";

interface HeroViewProps {
  visible: boolean;
}

const HeroView = ({ visible }: HeroViewProps) => {
  return (
    <div
      className="hero-container"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-40px)",
      }}
    >
      <div className="hero-inner">
        <StarLogo className="w-[100px] h-[100px] animate-star-pulse relative z-10" />

        <a
          href={APK_URL}
          download="SofIA.apk"
          className="mt-8 flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 transition-all text-white text-sm font-medium pointer-events-auto"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Baixar APK
        </a>
      </div>
    </div>
  );
};

export default HeroView;
