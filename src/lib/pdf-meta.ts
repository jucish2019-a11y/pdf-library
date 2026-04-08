// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');

export async function extractMeta(buffer: Buffer): Promise<{ pageCount: number; title: string }> {
  try {
    const data = await pdfParse(buffer);
    const title = (data.info?.Title as string) || '';
    return { pageCount: data.numpages || 0, title };
  } catch {
    return { pageCount: 0, title: '' };
  }
}
