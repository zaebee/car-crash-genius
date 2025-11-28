import { UploadedFile, ExifData } from "../types";

/**
 * Reads a file and returns an UploadedFile object with Base64 data and EXIF metadata (if JPEG).
 */
export const processFile = async (file: File): Promise<UploadedFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      if (e.target?.result) {
        const arrayBuffer = e.target.result as ArrayBuffer;
        
        // 1. Convert to Base64 for the 'data' property
        const base64String = arrayBufferToBase64(arrayBuffer, file.type);
        
        // 2. Parse EXIF if it's a JPEG
        let exifData: ExifData | undefined = undefined;
        if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
            try {
                exifData = parseExifFromBuffer(arrayBuffer);
            } catch (err) {
                console.warn("Failed to parse EXIF", err);
            }
        }

        resolve({
          name: file.name,
          type: file.type,
          data: base64String,
          size: file.size,
          lastModified: file.lastModified,
          exif: exifData
        });
      }
    };

    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
};

// --- Helpers ---

const arrayBufferToBase64 = (buffer: ArrayBuffer, type: string): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${type};base64,${btoa(binary)}`;
};

/**
 * Minimal EXIF Parser for standard tags
 * (Make, Model, FNumber, ExposureTime, ISO)
 */
const parseExifFromBuffer = (buffer: ArrayBuffer): ExifData | undefined => {
    const view = new DataView(buffer);
    if (view.getUint16(0, false) !== 0xFFD8) return undefined; // Not JPEG

    const length = view.byteLength;
    let offset = 2;

    while (offset < length) {
        if (view.getUint16(offset, false) !== 0xFFE1) {
            // Not APP1, skip
            offset += 2 + view.getUint16(offset + 2, false);
            continue;
        }

        // Found APP1, check for "Exif"
        if (view.getUint32(offset + 4, false) !== 0x45786966) return undefined;

        const littleEndian = view.getUint16(offset + 10, false) === 0x4949;
        const tiffOffset = offset + 10;
        
        // Offset to first IFD (usually 8)
        const firstIFDOffset = view.getUint32(tiffOffset + 4, littleEndian);
        if (firstIFDOffset < 0x00000008) return undefined;

        const dirStart = tiffOffset + firstIFDOffset;
        const entries = view.getUint16(dirStart, littleEndian);
        
        const exifData: ExifData = {};
        
        // Helper to read tag value
        const readTag = (dirOffset: number) => {
             for (let i = 0; i < entries; i++) {
                const entryOffset = dirOffset + 2 + (i * 12);
                const tag = view.getUint16(entryOffset, littleEndian);
                const type = view.getUint16(entryOffset + 2, littleEndian);
                const count = view.getUint32(entryOffset + 4, littleEndian);
                
                // Determine byte size per component
                let typeByteSize = 1;
                if (type === 3) typeByteSize = 2;       // SHORT
                else if (type === 4) typeByteSize = 4;  // LONG
                else if (type === 5) typeByteSize = 8;  // RATIONAL
                else if (type === 9) typeByteSize = 4;  // SLONG
                else if (type === 10) typeByteSize = 8; // SRATIONAL
                
                const dataSize = count * typeByteSize;
                
                // If data fits in 4 bytes, it's inline; otherwise, it's an offset
                const valueOffset = dataSize > 4
                    ? tiffOffset + view.getUint32(entryOffset + 8, littleEndian)
                    : entryOffset + 8;

                // 0x010F: Make
                if (tag === 0x010F) exifData.make = readString(view, valueOffset, count);
                // 0x0110: Model
                if (tag === 0x0110) exifData.model = readString(view, valueOffset, count);
                // 0x8769: ExifOffset (Pointer to SubIFD)
                if (tag === 0x8769) {
                    const subIfdOffset = tiffOffset + view.getUint32(entryOffset + 8, littleEndian);
                    readSubIFD(view, subIfdOffset, littleEndian, exifData, tiffOffset);
                }
            }
        };

        readTag(dirStart);
        return exifData;
    }
    return undefined;
};

const readSubIFD = (view: DataView, dirStart: number, littleEndian: boolean, data: ExifData, tiffOffset: number) => {
    const entries = view.getUint16(dirStart, littleEndian);
    for (let i = 0; i < entries; i++) {
        const entryOffset = dirStart + 2 + (i * 12);
        const tag = view.getUint16(entryOffset, littleEndian);
        const type = view.getUint16(entryOffset + 2, littleEndian);
        const count = view.getUint32(entryOffset + 4, littleEndian);
        
        // Value Offset logic
        let valueOffset = entryOffset + 8;
        const byteLen = count * (type === 5 ? 8 : (type === 3 ? 2 : 1)); // Simplified size calc
        if (byteLen > 4) {
             valueOffset = tiffOffset + view.getUint32(entryOffset + 8, littleEndian);
        }

        // 0x829A: ExposureTime (Rational)
        if (tag === 0x829A) {
             const num = view.getUint32(valueOffset, littleEndian);
             const den = view.getUint32(valueOffset + 4, littleEndian);
             if (den !== 0) {
                 data.exposureTime = num >= den ? (num/den).toString() : `1/${Math.round(den/num)}`;
             }
        }
        // 0x829D: FNumber (Rational)
        if (tag === 0x829D) {
             const num = view.getUint32(valueOffset, littleEndian);
             const den = view.getUint32(valueOffset + 4, littleEndian);
             if (den !== 0) data.fNumber = `f/${(num/den).toFixed(1)}`;
        }
        // 0x8827: ISO (Short)
        if (tag === 0x8827) {
             data.iso = view.getUint16(valueOffset, littleEndian).toString();
        }
         // 0x9003: DateTimeOriginal (ASCII)
        if (tag === 0x9003) {
             data.dateTime = readString(view, valueOffset, count);
        }
    }
};

const readString = (view: DataView, offset: number, length: number): string => {
    let str = '';
    for (let i = 0; i < length; i++) {
        const code = view.getUint8(offset + i);
        if (code === 0) break; // Null terminator
        str += String.fromCharCode(code);
    }
    return str.trim();
};