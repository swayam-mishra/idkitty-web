// Inline pixel-cat used when an image asset fails to load
const FALLBACK_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' shape-rendering='crispEdges'%3E%3Crect width='16' height='16' fill='%23030404'/%3E%3Crect x='3' y='2' width='4' height='4' fill='%23F5F3E7'/%3E%3Crect x='9' y='2' width='4' height='4' fill='%23F5F3E7'/%3E%3Crect x='2' y='5' width='12' height='9' fill='%23F5F3E7'/%3E%3Crect x='5' y='8' width='2' height='2' fill='%23030404'/%3E%3Crect x='9' y='8' width='2' height='2' fill='%23030404'/%3E%3Crect x='6' y='11' width='4' height='1' fill='%23030404'/%3E%3C/svg%3E"

/**
 * <img> wrapper with automatic fallback if the asset fails to load.
 * Drop-in replacement for <img> — all props pass through unchanged.
 */
const SafeImg = ({ src, alt = '', fallback = FALLBACK_SVG, ...props }) => (
  <img
    src={src}
    alt={alt}
    onError={e => {
      e.target.onerror = null // prevent infinite loop if fallback also fails
      e.target.src = fallback
    }}
    {...props}
  />
)

export default SafeImg
