// IDKitty — Client-side Crypto Service
// Uses Web Crypto API (built into browser, no library needed)

const bufferToHex = buf =>
  Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

const hexToBuffer = hex =>
  new Uint8Array(hex.match(/.{1,2}/g).map(b => parseInt(b, 16))).buffer

export const generateKeyPair = async () => {
  const keyPair = await window.crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  )

  const pubKeyRaw = await window.crypto.subtle.exportKey('raw', keyPair.publicKey)
  const privKeyRaw = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey)

  const publicKey = bufferToHex(pubKeyRaw)

  return {
    publicKey,
    privateKey: bufferToHex(privKeyRaw),
    did: `did:idkitty:${publicKey.slice(0, 20)}`,
  }
}

export const signChallenge = async (challenge, privateKeyHex) => {
  const keyBuffer = hexToBuffer(privateKeyHex)

  const privateKey = await window.crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  )

  const encoder = new TextEncoder()
  const signature = await window.crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    encoder.encode(challenge)
  )

  return bufferToHex(signature)
}
