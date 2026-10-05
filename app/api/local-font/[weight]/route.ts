import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { inflateRawSync } from 'node:zlib';

export const runtime = 'nodejs';

const names: Record<string, string> = {
  light: 'Light', regular: 'Regular', medium: 'Medium', bold: 'Bold', black: 'Black',
};
const cache = new Map<string, Uint8Array>();

function readEntry(archive: Buffer, wanted: string): Uint8Array {
  let end = -1;
  for (let offset = archive.length - 22; offset >= Math.max(0, archive.length - 65557); offset--) {
    if (archive.readUInt32LE(offset) === 0x06054b50) { end = offset; break; }
  }
  if (end < 0) throw Error('Invalid archive');
  const count = archive.readUInt16LE(end + 10);
  let offset = archive.readUInt32LE(end + 16);
  for (let index = 0; index < count; index++) {
    if (archive.readUInt32LE(offset) !== 0x02014b50) throw Error('Invalid directory');
    const method = archive.readUInt16LE(offset + 10);
    const compressedLength = archive.readUInt32LE(offset + 20);
    const originalLength = archive.readUInt32LE(offset + 24);
    const nameLength = archive.readUInt16LE(offset + 28);
    const extraLength = archive.readUInt16LE(offset + 30);
    const commentLength = archive.readUInt16LE(offset + 32);
    const localOffset = archive.readUInt32LE(offset + 42);
    const name = archive.toString('utf8', offset + 46, offset + 46 + nameLength);
    if (name === wanted) {
      if (originalLength > 1_000_000 || ![0, 8].includes(method)) throw Error('Unsupported entry');
      if (archive.readUInt32LE(localOffset) !== 0x04034b50) throw Error('Invalid local entry');
      const dataOffset = localOffset + 30 + archive.readUInt16LE(localOffset + 26) + archive.readUInt16LE(localOffset + 28);
      const compressed = archive.subarray(dataOffset, dataOffset + compressedLength);
      const bytes = method === 8 ? inflateRawSync(compressed) : compressed;
      const signature = bytes.toString('ascii', 0, 4);
      if (bytes.length !== originalLength || (signature !== 'OTTO' && bytes.readUInt32BE(0) !== 0x00010000)) throw Error('Invalid OpenType font');
      return new Uint8Array(bytes);
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  throw Error('Font missing');
}

export async function GET(request: Request, context: { params: Promise<{ weight: string }> }) {
  const hostname = new URL(request.url).hostname;
  if (process.env.NODE_ENV !== 'development' || !['localhost', '127.0.0.1'].includes(hostname)) {
    return new Response(null, { status: 404 });
  }
  const { weight } = await context.params;
  const name = names[weight];
  if (!name) return new Response(null, { status: 404 });
  try {
    let bytes = cache.get(weight);
    if (!bytes) {
      const archivePath = process.env.THMANYAH_FONT_ARCHIVE || join(homedir(), 'Downloads', 'Thmanyah-Font-Family.zip');
      const archive = await readFile(archivePath);
      bytes = readEntry(archive, `thmanyah typeface/thmanyahsans/otf/thmanyahsans-${name}.otf`);
      cache.set(weight, bytes);
    }
    return new Response(new Uint8Array(bytes), {
      headers: {
        'Content-Type': 'font/otf',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
