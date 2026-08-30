// The FlowForge signature: three forged nodes with a flow travelling between them.
// size in px; used small in the navbar, large on auth/home hero backgrounds.
export default function FlowMark({ size = 28, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6 30 L18 14 L32 24"
        stroke="var(--flow)"
        strokeWidth="2"
        strokeLinecap="round"
        className="flow-path"
        opacity="0.9"
      />
      <circle cx="6" cy="30" r="3.5" fill="var(--forge)" />
      <circle cx="18" cy="14" r="3.5" fill="var(--forge)" />
      <circle cx="32" cy="24" r="3.5" fill="var(--forge)" />
    </svg>
  );
}
