import JSZip from 'jszip';

export interface EpubMeta {
  title: string;
  author: string;
  coverBuffer: Buffer | null;
  coverExt: string | null;
}

function getText(xml: string, tag: string): string {
  // Matches <dc:title ...>value</dc:title> or <title>value</title>
  const re = new RegExp(`<(?:[\\w-]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w-]+:)?${tag}>`, 'i');
  const m = re.exec(xml);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
}

function getAttr(xml: string, tag: string, attr: string): string {
  const re = new RegExp(`<${tag}[^>]*\\b${attr}=["']([^"']+)["']`, 'i');
  const m = re.exec(xml);
  return m ? m[1] : '';
}

function resolvePath(basePath: string, href: string): string {
  // basePath is the OPF's path e.g. "OEBPS/content.opf", href relative to it
  if (href.startsWith('/')) return href.replace(/^\//, '');
  const baseDir = basePath.includes('/') ? basePath.substring(0, basePath.lastIndexOf('/')) : '';
  const segments = (baseDir ? baseDir + '/' : '') + href;
  const parts: string[] = [];
  for (const part of segments.split('/')) {
    if (part === '..') parts.pop();
    else if (part && part !== '.') parts.push(part);
  }
  return parts.join('/');
}

function extForMime(mime: string): string {
  if (/jpe?g/i.test(mime)) return 'jpg';
  if (/png/i.test(mime)) return 'png';
  if (/gif/i.test(mime)) return 'gif';
  if (/webp/i.test(mime)) return 'webp';
  if (/svg/i.test(mime)) return 'svg';
  return 'img';
}

export async function extractEpubMeta(buffer: Buffer): Promise<EpubMeta> {
  const empty: EpubMeta = { title: '', author: '', coverBuffer: null, coverExt: null };
  try {
    const zip = await JSZip.loadAsync(buffer);

    // 1. Read container.xml → find OPF path
    const containerFile = zip.file('META-INF/container.xml');
    if (!containerFile) return empty;
    const containerXml = await containerFile.async('string');
    const opfPath = getAttr(containerXml, 'rootfile', 'full-path');
    if (!opfPath) return empty;

    // 2. Read OPF → title, author, cover manifest id/href
    const opfFile = zip.file(opfPath);
    if (!opfFile) return empty;
    const opfXml = await opfFile.async('string');

    const title = getText(opfXml, 'title');
    const author = getText(opfXml, 'creator');

    // Locate cover: first try <meta name="cover" content="id"/>
    let coverHref = '';
    let coverMime = '';
    const metaCoverIdMatch = /<meta[^>]*name=["']cover["'][^>]*content=["']([^"']+)["']/i.exec(opfXml);
    if (metaCoverIdMatch) {
      const coverId = metaCoverIdMatch[1];
      const itemRe = new RegExp(`<item[^>]*id=["']${coverId}["'][^>]*>`, 'i');
      const itemMatch = itemRe.exec(opfXml);
      if (itemMatch) {
        coverHref = /href=["']([^"']+)["']/i.exec(itemMatch[0])?.[1] ?? '';
        coverMime = /media-type=["']([^"']+)["']/i.exec(itemMatch[0])?.[1] ?? '';
      }
    }

    // Fallback: item with properties="cover-image"
    if (!coverHref) {
      const propMatch = /<item[^>]*properties=["'][^"']*cover-image[^"']*["'][^>]*>/i.exec(opfXml);
      if (propMatch) {
        coverHref = /href=["']([^"']+)["']/i.exec(propMatch[0])?.[1] ?? '';
        coverMime = /media-type=["']([^"']+)["']/i.exec(propMatch[0])?.[1] ?? '';
      }
    }

    // Fallback: first image/* item in manifest
    if (!coverHref) {
      const imgMatch = /<item[^>]*media-type=["']image\/[^"']+["'][^>]*>/i.exec(opfXml);
      if (imgMatch) {
        coverHref = /href=["']([^"']+)["']/i.exec(imgMatch[0])?.[1] ?? '';
        coverMime = /media-type=["']([^"']+)["']/i.exec(imgMatch[0])?.[1] ?? '';
      }
    }

    let coverBuffer: Buffer | null = null;
    let coverExt: string | null = null;
    if (coverHref) {
      const fullCoverPath = resolvePath(opfPath, coverHref);
      const coverFile = zip.file(fullCoverPath);
      if (coverFile) {
        const data = await coverFile.async('nodebuffer');
        coverBuffer = data;
        coverExt = extForMime(coverMime);
      }
    }

    return { title, author, coverBuffer, coverExt };
  } catch {
    return empty;
  }
}
