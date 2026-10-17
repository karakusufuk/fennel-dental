// assets-src/ → public/img/  (AVIF + WebP, birden çok genişlik)
import sharp from 'sharp';
import { mkdirSync, readdirSync } from 'node:fs';
import { join, parse } from 'node:path';

const SRC = 'assets-src';
const OUT = 'public/img';

const isler = [
  { dir: 'hero', ad: 'hero-arka', kaynak: 'hero-arka.webp', genislik: [768, 1536], q: 60 },
  { dir: 'hero', ad: 'hero-on', kaynak: 'hero-on.png', genislik: [768, 1152, 1536], q: 62, alfa: true },
  { dir: 'klinik', ad: 'bina', kaynak: 'bina.webp', genislik: [640, 1122], q: 62 },
  ...readdirSync(join(SRC, 'tedavi')).map((f) => ({ dir: 'tedavi', ad: parse(f).name, kaynak: f, genislik: [480, 768], q: 78, tam: true })),
  ...readdirSync(join(SRC, 'ekip')).map((f) => ({ dir: 'ekip', ad: parse(f).name, kaynak: f, genislik: [320, 640], q: 62 })),
];

for (const is of isler) {
  mkdirSync(join(OUT, is.dir), { recursive: true });
  const girdi = join(SRC, is.dir, is.kaynak);
  for (const w of is.genislik) {
    const taban = sharp(girdi).resize({ width: w, withoutEnlargement: true });
    const yol = join(OUT, is.dir, `${is.ad}-${w}`);
    // tedavi görselleri #EAEDEF zemini birebir korumalı: 4:4:4, yüksek kalite
    await taban.clone().avif({ quality: is.q, effort: 6, chromaSubsampling: is.tam ? '4:4:4' : '4:2:0' }).toFile(`${yol}.avif`);
    await taban.clone().webp({ quality: is.tam ? 90 : is.q + 15, effort: 6, alphaQuality: 90 }).toFile(`${yol}.webp`);
  }
}
console.log('görseller hazır:', isler.length, 'kaynak');
