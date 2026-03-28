// PixelCatLarge — 64×64 viewBox pixel art cat
// Each "macro pixel" = 4×4 SVG units → effectively a 16×16 pixel grid displayed large.
// Ring eyes (3-layer concentric), inner ear markings, mouth, whiskers.

const FG = '#f5f0e8'   // cream face
const BG = '#0a0a0a'   // dark
const AC = '#FF6B2B'   // accent / nose

const PixelCatLarge = ({ size = 96, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    shapeRendering="crispEdges"
    className={className}
    aria-hidden="true"
  >
    {/* ── Left ear (outer dark, inner cream triangle) ── */}
    <rect x="0"  y="0"  width="12" height="16" fill={BG} />
    <rect x="2"  y="2"  width="8"  height="12" fill={FG} />
    <rect x="4"  y="4"  width="4"  height="8"  fill={BG} />

    {/* ── Right ear ── */}
    <rect x="52" y="0"  width="12" height="16" fill={BG} />
    <rect x="54" y="2"  width="8"  height="12" fill={FG} />
    <rect x="56" y="4"  width="4"  height="8"  fill={BG} />

    {/* ── Face background ── */}
    <rect x="4"  y="12" width="56" height="52" fill={FG} />

    {/* ── Face border (4px pixel outline) ── */}
    {/* top */}
    <rect x="4"  y="12" width="56" height="4"  fill={BG} />
    {/* bottom */}
    <rect x="4"  y="60" width="56" height="4"  fill={BG} />
    {/* left */}
    <rect x="4"  y="12" width="4"  height="52" fill={BG} />
    {/* right */}
    <rect x="56" y="12" width="4"  height="52" fill={BG} />

    {/* ── Left eye — 3-ring concentric ── */}
    {/* outer dark ring 12×12 at (12,24) */}
    <rect x="12" y="24" width="12" height="12" fill={BG} />
    {/* middle cream 8×8 */}
    <rect x="14" y="26" width="8"  height="8"  fill={FG} />
    {/* center dark pupil 4×4 */}
    <rect x="16" y="28" width="4"  height="4"  fill={BG} />

    {/* ── Right eye — 3-ring concentric ── */}
    <rect x="40" y="24" width="12" height="12" fill={BG} />
    <rect x="42" y="26" width="8"  height="8"  fill={FG} />
    <rect x="44" y="28" width="4"  height="4"  fill={BG} />

    {/* ── Nose ── */}
    <rect x="28" y="40" width="8"  height="4"  fill={AC} />
    <rect x="30" y="44" width="4"  height="4"  fill={AC} />

    {/* ── Mouth — pixel curve ── */}
    <rect x="20" y="48" width="4"  height="4"  fill={BG} />
    <rect x="24" y="52" width="4"  height="4"  fill={BG} />
    <rect x="28" y="52" width="8"  height="4"  fill={BG} />
    <rect x="36" y="52" width="4"  height="4"  fill={BG} />
    <rect x="40" y="48" width="4"  height="4"  fill={BG} />

    {/* ── Left whiskers ── */}
    <rect x="8"  y="38" width="8"  height="2" fill={BG} opacity="0.35" />
    <rect x="6"  y="42" width="10" height="2" fill={BG} opacity="0.25" />

    {/* ── Right whiskers ── */}
    <rect x="48" y="38" width="8"  height="2" fill={BG} opacity="0.35" />
    <rect x="48" y="42" width="10" height="2" fill={BG} opacity="0.25" />
  </svg>
)

export default PixelCatLarge
