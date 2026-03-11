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
      </div>
    </div>
  );
};

export default HeroView;
