export type ZipEntry = {
  name: string;
  data: Uint8Array;
};

const encoder = new TextEncoder();

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function uint16(value: number) {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff]);
}

function uint32(value: number) {
  return new Uint8Array([
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  ]);
}

function concat(parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.byteLength;
  }
  return output;
}

export function createStoredZip(entries: ZipEntry[]) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let localOffset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name.replace(/\\/g, "/"));
    const checksum = crc32(entry.data);
    const localHeader = concat([
      uint32(0x04034b50),
      uint16(20),
      uint16(0x0800),
      uint16(0),
      uint16(0),
      uint16(0x0021),
      uint32(checksum),
      uint32(entry.data.byteLength),
      uint32(entry.data.byteLength),
      uint16(name.byteLength),
      uint16(0),
      name,
    ]);
    localParts.push(localHeader, entry.data);

    centralParts.push(concat([
      uint32(0x02014b50),
      uint16(20),
      uint16(20),
      uint16(0x0800),
      uint16(0),
      uint16(0),
      uint16(0x0021),
      uint32(checksum),
      uint32(entry.data.byteLength),
      uint32(entry.data.byteLength),
      uint16(name.byteLength),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(0),
      uint32(localOffset),
      name,
    ]));
    localOffset += localHeader.byteLength + entry.data.byteLength;
  }

  const centralDirectory = concat(centralParts);
  const end = concat([
    uint32(0x06054b50),
    uint16(0),
    uint16(0),
    uint16(entries.length),
    uint16(entries.length),
    uint32(centralDirectory.byteLength),
    uint32(localOffset),
    uint16(0),
  ]);
  return concat([...localParts, centralDirectory, end]);
}

export function createZipBlob(entries: ZipEntry[]) {
  return new Blob([createStoredZip(entries)], { type: "application/zip" });
}
