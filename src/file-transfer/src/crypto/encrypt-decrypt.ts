export async function generateEncryptionKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["wrapKey", "unwrapKey"]
  );
}

export async function exportPublicKeyToBinary(publicKey: CryptoKey): Promise<Uint8Array> {
  const exportedBuffer = await crypto.subtle.exportKey(
    "spki",
    publicKey
  );
  return new Uint8Array(exportedBuffer);
}

export async function importEncryptionPublicKey(rawBinaryKey: Uint8Array): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "spki",
    rawBinaryKey as BufferSource,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["wrapKey"]
  );
}

//---------------------------------------------------------------------------------------------------------------------


export async function generateTemporaryTransferKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function lockTransferKeyWithRemotePublicKey(
  temporaryTransferKey: CryptoKey,
  remotePublicRsaKey: CryptoKey
): Promise<Uint8Array> {
  const wrappedKeyBuffer = await crypto.subtle.wrapKey(
    "raw",
    temporaryTransferKey,
    remotePublicRsaKey,
    { 
      name: "RSA-OAEP"
    }
  );

  return new Uint8Array(wrappedKeyBuffer);
}

export async function encryptData(
  rawChunkBuffer: Uint8Array,
  temporaryTransferKey: CryptoKey
) {
  const uniqueChunkIv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedChunkBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: uniqueChunkIv,
    },
    temporaryTransferKey,
    rawChunkBuffer as BufferSource,
  );

  return {
    iv: uniqueChunkIv,
    ciphertext: new Uint8Array(encryptedChunkBuffer),
  };
}

//---------------------------------------------------------------------------------------------------------------------


export async function unlockTransferKeyWithPrivateKey(
  rawWrappedKeyBuffer: Uint8Array,
  localPrivateRsaKey: CryptoKey
): Promise<CryptoKey> {
  
  const decryptedTransferKey = await crypto.subtle.unwrapKey(
    "raw",
    rawWrappedKeyBuffer as BufferSource,
    localPrivateRsaKey,
    { name: "RSA-OAEP" },
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  return decryptedTransferKey;
}

export async function decryptData(
  ciphertextChunksBytes: Uint8Array,
  chunkIvBytes: Uint8Array,
  unlockedTransferKey: CryptoKey
): Promise<Uint8Array> {
  
  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: chunkIvBytes as unknown as BufferSource
      },
      unlockedTransferKey,
      ciphertextChunksBytes  as unknown as BufferSource
    );

    return new Uint8Array(decryptedBuffer);
    
  } catch (error) {
    throw new Error("Integrity check failed! This chunk was tampered with or corrupted.");
  }
}

// --------------------------------------------------------------------------------------------------

export async function generateSigningKeyPair(): Promise<CryptoKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"]
  );

  return keyPair;
}

export async function importSigningPublicKey(rawBinaryKey: Uint8Array): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "spki",
    rawBinaryKey as BufferSource,
    {
      name: "ECDSA",
      namedCurve: "P-256", // Must perfectly match the curve used during generation
    },
    true, // Allows the key to be viewable/exported if needed
    ["verify"] // The receiver only uses this key to verify signatures
  );
}

export async function createSignature(
  data: Uint8Array,
  privateKey: CryptoKey
): Promise<Uint8Array> {
  const signatureBuffer = await crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" },
    },
    privateKey,
    data as BufferSource,
  );

  return new Uint8Array(signatureBuffer);
}

export async function verifySignature(
  data: Uint8Array,
  signature: Uint8Array,
  publicKey: CryptoKey
): Promise<boolean> {
  return await crypto.subtle.verify(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" },
    },
    publicKey,
    signature as BufferSource,
    data as BufferSource
  );
}

// ----------------------------------------------------------------------------------------------------

export async function generateSafetyNumber(publicKeyA: Uint8Array, publicKeyB: Uint8Array): Promise<string> {
  // 1. Combine both public keys together to form a unique channel bond
  const combined = new Uint8Array(publicKeyA.length + publicKeyB.length);
  combined.set(publicKeyA, 0);
  combined.set(publicKeyB, publicKeyA.length);

  // 2. Hash the combined keys using SHA-256
  const hashBuffer = await crypto.subtle.digest("SHA-256", combined);
  
  // 3. Take a 4-byte slice using a DataView
  const view = new DataView(hashBuffer);
  const part1 = view.getUint16(0); // First 2 bytes
  const part2 = view.getUint16(2); // Next 2 bytes

  // 4. Format them into two padded 3-digit numbers (e.g., "530-194")
  const code1 = String(part1 % 1000).padStart(3, '0');
  const code2 = String(part2 % 1000).padStart(3, '0');

  return `${code1}-${code2}`;
}