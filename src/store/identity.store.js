// IDKitty — Identity Store
// Identity → localStorage (persists across sessions)
// JWT     → sessionStorage (clears on tab close)

export const saveIdentity = (identity) => {
  localStorage.setItem('idkitty_identity', JSON.stringify(identity))
}

export const loadIdentity = () => {
  const raw = localStorage.getItem('idkitty_identity')
  return raw ? JSON.parse(raw) : null
}

export const clearIdentity = () => localStorage.removeItem('idkitty_identity')

export const saveJWT = (token) => {
  sessionStorage.setItem('idkitty_jwt', token)
}

export const loadJWT = () => sessionStorage.getItem('idkitty_jwt')

export const clearJWT = () => sessionStorage.removeItem('idkitty_jwt')
