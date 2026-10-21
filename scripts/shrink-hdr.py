# Reduce un HDRI .hdr a la mitad (para la iluminación de estudio de la web).
# Uso: python3 scripts/shrink-hdr.py entrada.hdr salida.hdr
import sys, numpy as np

def read_hdr(p):
    b = open(p, 'rb').read(); i = b.index(b'\n\n') + 2
    j = b.index(b'\n', i); parts = b[i:j].decode().split(); h, w = int(parts[1]), int(parts[3])
    pos = j + 1; out = np.zeros((h, w, 4), np.uint8)
    for y in range(h):
        pos += 4
        for c in range(4):
            x = 0
            while x < w:
                n = b[pos]; pos += 1
                if n > 128:
                    n -= 128; out[y, x:x + n, c] = b[pos]; pos += 1
                else:
                    out[y, x:x + n, c] = np.frombuffer(b[pos:pos + n], np.uint8); pos += n
                x += n
    e = np.where(out[..., 3:4] > 0, np.ldexp(1.0, out[..., 3:4].astype(int) - 136), 0)
    return out[..., :3].astype(np.float32) * e

def write_hdr(p, img):
    h, w, _ = img.shape
    m = img.max(axis=2); mant, e = np.frexp(m)
    nz = m > 1e-32
    sc = np.where(nz, mant * 256.0 / np.maximum(m, 1e-32), 0)
    rgbe = np.zeros((h, w, 4), np.uint8)
    rgbe[..., :3] = np.clip(img * sc[..., None], 0, 255).astype(np.uint8)
    rgbe[..., 3] = np.where(nz, e + 128, 0)
    f = open(p, 'wb'); f.write(b'#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n' + f'-Y {h} +X {w}\n'.encode())
    for y in range(h):
        f.write(bytes([2, 2, w >> 8, w & 255]))
        for c in range(4):
            row = rgbe[y, :, c]; x = 0; buf = bytearray()
            while x < w:
                r = 1
                while x + r < w and r < 127 and row[x + r] == row[x]: r += 1
                if r >= 4:
                    buf += bytes([128 + r, row[x]]); x += r; continue
                lit = bytearray()
                while x < w and len(lit) < 128:
                    r = 1
                    while x + r < w and r < 4 and row[x + r] == row[x]: r += 1
                    if r >= 4: break
                    lit.append(row[x]); x += 1
                buf += bytes([len(lit)]) + lit
            f.write(buf)

img = read_hdr(sys.argv[1]); h, w, _ = img.shape
write_hdr(sys.argv[2], img.reshape(h // 2, 2, w // 2, 2, 3).mean(axis=(1, 3)))
