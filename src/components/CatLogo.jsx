const CatLogo = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="IDKitty logo"
  >
    {/* Left ear */}
    <rect x="4" y="2" width="10" height="14" fill="#f5f0e8" />
    {/* Right ear */}
    <rect x="34" y="2" width="10" height="14" fill="#f5f0e8" />
    {/* Face */}
    <rect x="2" y="12" width="44" height="32" fill="#0a0a0a" stroke="#f5f0e8" strokeWidth="3" />
    {/* Left eye — blinks via CSS */}
    <rect
      className="cat-eye-left"
      x="10"
      y="21"
      width="8"
      height="7"
      fill="#FFE500"
    />
    {/* Right eye — key icon shape (blocky, pixel-art key) */}
    <g transform="translate(26, 19)">
      {/* Key head (circle bit) */}
      <rect x="0" y="0" width="8" height="8" rx="0" fill="none" stroke="#FF6B2B" strokeWidth="2.5" />
      <rect x="2" y="2" width="4" height="4" fill="#FF6B2B" />
      {/* Key shaft */}
      <rect x="7" y="3" width="7" height="2.5" fill="#FF6B2B" />
      {/* Key teeth */}
      <rect x="11" y="5.5" width="2" height="2.5" fill="#FF6B2B" />
      <rect x="13.5" y="5.5" width="2" height="2" fill="#FF6B2B" />
    </g>
    {/* Nose */}
    <polygon points="22,35 26,35 24,38" fill="#FF6B2B" />
    {/* Left whiskers */}
    <rect x="2" y="37" width="13" height="1.5" fill="#f5f0e8" opacity="0.4" />
    <rect x="2" y="40" width="11" height="1.5" fill="#f5f0e8" opacity="0.25" />
    {/* Right whiskers */}
    <rect x="33" y="37" width="13" height="1.5" fill="#f5f0e8" opacity="0.4" />
    <rect x="35" y="40" width="11" height="1.5" fill="#f5f0e8" opacity="0.25" />
  </svg>
)

export default CatLogo
