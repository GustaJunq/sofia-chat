import StarLogo from "./StarLogo";
import handImg from "@/assets/hand.png";

interface HeroViewProps {
  visible: boolean;
}

const HeroView = ({ visible }: HeroViewProps) => {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center transition-all duration-400 ease-out pointer-events-none"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-40px)",
      }}
    >
      <div className="relative flex flex-col items-center -mt-16">
        <StarLogo className="w-[100px] h-[100px] animate-star-pulse relative z-10" />
        <img
          src={handImg}
          alt=""
          className="w-[75vw] max-w-[360px] -mt-10 relative z-0 opacity-90 mix-blend-screen"
        />
      </div>
    </div>
  );
};

export default HeroView;
