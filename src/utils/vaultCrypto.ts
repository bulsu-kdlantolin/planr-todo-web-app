// Web Crypto API AES-GCM-256 Local Vault Protection (OWASP 2024 Compliant - 600,000 PBKDF2 iterations)
const ITERATIONS_V2 = 600000;
const ITERATIONS_V1 = 100000;
const V2_PREFIX = 'PLNR_V2_';

async function getKey(pin: string, salt: Uint8Array, iterations = ITERATIONS_V2): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as ArrayBuffer,
      iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(plainText: string, pin: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(pin, salt, ITERATIONS_V2);

  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as ArrayBuffer },
    key,
    enc.encode(plainText)
  );

  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  return V2_PREFIX + btoa(String.fromCharCode(...combined));
}

export async function decryptData(cipherText: string, pin: string): Promise<string> {
  const isV2 = cipherText.startsWith(V2_PREFIX);
  const cipherBase64 = isV2 ? cipherText.slice(V2_PREFIX.length) : cipherText;
  const iterations = isV2 ? ITERATIONS_V2 : ITERATIONS_V1;

  const binaryString = atob(cipherBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const salt = bytes.slice(0, 16);
  const iv = bytes.slice(16, 28);
  const data = bytes.slice(28);

  const key = await getKey(pin, salt, iterations);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as ArrayBuffer },
    key,
    data as unknown as ArrayBuffer
  );

  const dec = new TextDecoder();
  return dec.decode(decrypted);
}

let autoLockTimer: number | null = null;

export function scheduleVaultAutoLock(onLock: () => void, timeoutMs = 15 * 60 * 1000): void {
  if (autoLockTimer !== null) {
    window.clearTimeout(autoLockTimer);
  }
  autoLockTimer = window.setTimeout(() => {
    onLock();
  }, timeoutMs);
}

