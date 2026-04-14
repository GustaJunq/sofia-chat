const StarLogo = ({ className = "", style }: { className?: string; style?: React.CSSProperties }) => (
  <img
    src="/logo.png"
    alt="Logo"
    className={className}
    style={style}
  />
);

export default StarLogo;
