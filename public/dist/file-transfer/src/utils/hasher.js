export class SHA256 {
    constructor() {
        // Initial hash values: First 32 bits of the fractional parts of the square roots of the first 8 primes
        this.h0 = 0x6a09e667;
        this.h1 = 0xbb67ae85;
        this.h2 = 0x3c6ef372;
        this.h3 = 0xa54ff53a;
        this.h4 = 0x510e527f;
        this.h5 = 0x9b05688c;
        this.h6 = 0x1f83d9ab;
        this.h7 = 0x5be0cd19;
        this.buffer = new Uint8Array(64);
        this.bufferLength = 0;
        this.bytesHashed = 0;
        this.w = new Uint32Array(64);
        this.finalBlock = new Uint8Array(128);
    }
    reset() {
        this.h0 = 0x6a09e667;
        this.h1 = 0xbb67ae85;
        this.h2 = 0x3c6ef372;
        this.h3 = 0xa54ff53a;
        this.h4 = 0x510e527f;
        this.h5 = 0x9b05688c;
        this.h6 = 0x1f83d9ab;
        this.h7 = 0x5be0cd19;
        this.bufferLength = 0;
        this.bytesHashed = 0;
        return this;
    }
    update(data) {
        let position = 0;
        this.bytesHashed += data.length;
        while (position < data.length) {
            if (this.bufferLength === 0 &&
                (data.length - position) >= 64) {
                this.processBlock(data, position);
                position += 64;
                continue;
            }
            const take = Math.min(data.length - position, 64 - this.bufferLength);
            this.buffer.set(data.subarray(position, position + take), this.bufferLength);
            this.bufferLength += take;
            position += take;
            if (this.bufferLength === 64) {
                this.processBlock(this.buffer);
                this.bufferLength = 0;
            }
        }
        return this;
    }
    digest() {
        const finalBlock = this.finalBlock;
        finalBlock.fill(0);
        finalBlock.set(this.buffer.subarray(0, this.bufferLength), 0);
        let offset = this.bufferLength;
        finalBlock[offset++] = 0x80;
        const bitLength = BigInt(this.bytesHashed) * 8n;
        const needsTwoBlocks = offset > 56;
        const lengthOffset = needsTwoBlocks ? 120 : 56;
        for (let i = 0; i < 8; i++) {
            finalBlock[lengthOffset + 7 - i] =
                Number((bitLength >> BigInt(i * 8)) & 0xffn);
        }
        if (needsTwoBlocks) {
            this.processBlock(finalBlock.subarray(0, 64));
            this.processBlock(finalBlock.subarray(64, 128));
        }
        else {
            this.processBlock(finalBlock.subarray(0, 64));
        }
        const digest = this.toHex(this.h0) +
            this.toHex(this.h1) +
            this.toHex(this.h2) +
            this.toHex(this.h3) +
            this.toHex(this.h4) +
            this.toHex(this.h5) +
            this.toHex(this.h6) +
            this.toHex(this.h7);
        this.reset();
        return digest;
    }
    processBlock(block, offset = 0) {
        const w = this.w;
        // 1. Prepare message schedule (W)
        for (let i = 0; i < 16; i++) {
            const j = offset + (i << 2);
            w[i] =
                (block[j] << 24) |
                    (block[j + 1] << 16) |
                    (block[j + 2] << 8) |
                    block[j + 3];
        }
        for (let i = 16; i < 64; i++) {
            const w15 = w[i - 15];
            const s0 = (((w15 >>> 7) | (w15 << 25)) ^ ((w15 >>> 18) | (w15 << 14)) ^ (w15 >>> 3)) >>> 0;
            const w2 = w[i - 2];
            const s1 = (((w2 >>> 17) | (w2 << 15)) ^ ((w2 >>> 19) | (w2 << 13)) ^ (w2 >>> 10)) >>> 0;
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
        }
        // 2. Initialize working variables
        let a = this.h0;
        let b = this.h1;
        let c = this.h2;
        let d = this.h3;
        let e = this.h4;
        let f = this.h5;
        let g = this.h6;
        let h = this.h7;
        // 3. Compression loop (64 rounds)
        for (let i = 0; i < 64; i++) {
            const S1 = (((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))) >>> 0;
            const ch = ((e & f) ^ (~e & g)) >>> 0;
            const temp1 = (h + S1 + ch + SHA256.K[i] + w[i]) >>> 0;
            const S0 = (((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))) >>> 0;
            const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
            const temp2 = (S0 + maj) >>> 0;
            h = g;
            g = f;
            f = e;
            e = (d + temp1) >>> 0;
            d = c;
            c = b;
            b = a;
            a = (temp1 + temp2) >>> 0;
        }
        // 4. Update working internal values
        this.h0 = (this.h0 + a) >>> 0;
        this.h1 = (this.h1 + b) >>> 0;
        this.h2 = (this.h2 + c) >>> 0;
        this.h3 = (this.h3 + d) >>> 0;
        this.h4 = (this.h4 + e) >>> 0;
        this.h5 = (this.h5 + f) >>> 0;
        this.h6 = (this.h6 + g) >>> 0;
        this.h7 = (this.h7 + h) >>> 0;
    }
    // private rotr(value: number, bits: number): number {
    //     return ((value >>> bits) | (value << (32 - bits))) >>> 0;
    // }
    toHex(value) {
        return (value >>> 0)
            .toString(16)
            .padStart(8, "0");
    }
}
// SHA-256 Constants: First 32 bits of the fractional parts of the cube roots of the first 64 primes
SHA256.K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);
