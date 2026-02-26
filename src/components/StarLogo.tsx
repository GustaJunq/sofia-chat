const StarLogo = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="50" cy="50" r="8" fill="white" />
    <path
      d="M50 0L56 38L50 28L44 38L50 0Z"
      fill="white"
    />
    <path
      d="M50 100L56 62L50 72L44 62L50 100Z"
      fill="white"
    />
    <path
      d="M0 50L38 44L28 50L38 56L0 50Z"
      fill="white"
    />
    <path
      d="M100 50L62 44L72 50L62 56L100 50Z"
      fill="white"
    />
    <path
      d="M14.6 14.6L42 40L34 34L40 42L14.6 14.6Z"
      fill="white"
    />
    <path
      d="M85.4 85.4L58 60L66 66L60 58L85.4 85.4Z"
      fill="white"
    />
    <path
      d="M85.4 14.6L60 42L66 34L58 40L85.4 14.6Z"
      fill="white"
    />
    <path
      d="M14.6 85.4L40 58L34 66L42 60L14.6 85.4Z"
      fill="white"
    />
  </svg>
);

export default StarLogo;
