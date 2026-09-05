/**
 * HTML Sanitizer Utility
 * Sanitizes untrusted HTML (such as inbound email bodies) to prevent Stored XSS (CWE-79),
 * malicious style injection, form hijacking, and credential exfiltration.
 */

const DANGEROUS_TAGS = new Set([
  'script',
  'style',
  'iframe',
  'frame',
  'frameset',
  'object',
  'embed',
  'applet',
  'form',
  'input',
  'button',
  'select',
  'textarea',
  'base',
  'meta',
  'link',
  'svg',
  'math',
  'noscript',
]);

const ALLOWED_TAGS = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'code',
  'dd',
  'div',
  'dl',
  'dt',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'small',
  'span',
  'strike',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
]);

const ALLOWED_ATTRIBUTES = new Set([
  'alt',
  'title',
  'width',
  'height',
  'class',
  'id',
  'align',
  'valign',
  'border',
  'cellpadding',
  'cellspacing',
]);

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * Validate a URL attribute (href, src) to prevent javascript: and dangerous schemes
 */
function isSafeUrl(url: string, allowImageData = false): boolean {
  const trimmed = url.trim().toLowerCase();
  if (!trimmed) return false;

  // Reject protocol-relative URLs (e.g. //evil.com) which bypass scheme validation
  if (trimmed.startsWith('//') || trimmed.startsWith('\\\\')) {
    return false;
  }

  // Neutralize dangerous pseudo-protocols (javascript:, vbscript:, data:)
  const normalized = trimmed.replace(/[\x00-\x1F\x7F-\x9F\s]/g, '');
  if (normalized.startsWith('javascript:') || normalized.startsWith('vbscript:') || normalized.startsWith('data:')) {
    if (allowImageData && /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=]+$/i.test(trimmed)) {
      return true;
    }
    return false;
  }

  try {
    const parsed = new URL(trimmed, 'https://placeholder.invalid');
    return ALLOWED_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize inline CSS styles to prevent fixed position overlays, expression(), url(), etc.
 */
function sanitizeStyle(style: string): string {
  if (!style) return '';

  const lowered = style.toLowerCase();
  if (
    lowered.includes('expression(') ||
    lowered.includes('javascript:') ||
    lowered.includes('behavior:') ||
    lowered.includes('-moz-binding') ||
    lowered.includes('url(') ||
    lowered.includes('position: fixed') ||
    lowered.includes('position:fixed')
  ) {
    return '';
  }

  return style
    .replace(/[<>]/g, '')
    .trim();
}

/**
 * Sanitizes an HTML string using DOM manipulation when available (in browser or DOMParser),
 * or regex-based fallback for non-DOM environments.
 */
export function sanitizeHtml(dirtyHtml: string): string {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') {
    return '';
  }

  if (typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
    try {
      const parser = new window.DOMParser();
      const doc = parser.parseFromString(dirtyHtml, 'text/html');

      for (const tag of DANGEROUS_TAGS) {
        const elements = doc.querySelectorAll(tag);
        elements.forEach((el) => el.remove());
      }

      const allElements = doc.body.querySelectorAll('*');
      allElements.forEach((el) => {
        const tagName = el.tagName.toLowerCase();

        if (!ALLOWED_TAGS.has(tagName)) {
          el.replaceWith(...Array.from(el.childNodes));
          return;
        }

        const attrs = Array.from(el.attributes);
        for (const attr of attrs) {
          const attrName = attr.name.toLowerCase();

          if (attrName.startsWith('on')) {
            el.removeAttribute(attr.name);
            continue;
          }

          if (attrName === 'href') {
            if (!isSafeUrl(attr.value)) {
              el.removeAttribute(attr.name);
            } else {
              el.setAttribute('target', '_blank');
              el.setAttribute('rel', 'noopener noreferrer nofollow');
            }
            continue;
          }

          if (attrName === 'src') {
            if (!isSafeUrl(attr.value, tagName === 'img')) {
              el.removeAttribute(attr.name);
            }
            continue;
          }

          if (attrName === 'style') {
            const clean = sanitizeStyle(attr.value);
            if (clean) {
              el.setAttribute('style', clean);
            } else {
              el.removeAttribute(attr.name);
            }
            continue;
          }

          if (!['alt', 'title', 'width', 'height', 'class', 'id', 'align', 'valign', 'border', 'cellpadding', 'cellspacing'].includes(attrName)) {
            el.removeAttribute(attr.name);
          }
        }
      });

      return doc.body.innerHTML;
    } catch {
      // Fall through to tokenizer sanitizer
    }
  }

  return sanitizeHtmlNonDom(dirtyHtml);
}

function escapeHtmlAttr(val: string): string {
  return val
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseAndSanitizeAttributes(tagName: string, attrText: string): string[] {
  const allowedAttrs: string[] = [];
  let pos = 0;
  const len = attrText.length;

  while (pos < len) {
    while (pos < len && /\s/.test(attrText[pos])) {
      pos++;
    }
    if (pos >= len) break;

    const nameStart = pos;
    while (pos < len && /[^\s=/><]/.test(attrText[pos])) {
      pos++;
    }
    const rawAttrName = attrText.slice(nameStart, pos).toLowerCase();
    if (!rawAttrName) {
      pos++;
      continue;
    }

    while (pos < len && /\s/.test(attrText[pos])) {
      pos++;
    }

    let attrValue = '';
    if (pos < len && attrText[pos] === '=') {
      pos++;
      while (pos < len && /\s/.test(attrText[pos])) {
        pos++;
      }
      if (pos < len) {
        const quote = attrText[pos];
        if (quote === '"' || quote === "'") {
          pos++;
          const valStart = pos;
          while (pos < len && attrText[pos] !== quote) {
            pos++;
          }
          attrValue = attrText.slice(valStart, pos);
          if (pos < len) pos++;
        } else {
          const valStart = pos;
          while (pos < len && /[^\s>]/.test(attrText[pos])) {
            pos++;
          }
          attrValue = attrText.slice(valStart, pos);
        }
      }
    }

    // Strip inline event handlers (onerror, onload, onclick, etc.)
    if (rawAttrName.startsWith('on')) {
      continue;
    }

    if (rawAttrName === 'href') {
      if (isSafeUrl(attrValue)) {
        allowedAttrs.push(`href="${escapeHtmlAttr(attrValue)}"`);
        allowedAttrs.push('target="_blank"');
        allowedAttrs.push('rel="noopener noreferrer nofollow"');
      }
      continue;
    }

    if (rawAttrName === 'src') {
      if (isSafeUrl(attrValue, tagName === 'img')) {
        allowedAttrs.push(`src="${escapeHtmlAttr(attrValue)}"`);
      }
      continue;
    }

    if (rawAttrName === 'style') {
      const clean = sanitizeStyle(attrValue);
      if (clean) {
        allowedAttrs.push(`style="${escapeHtmlAttr(clean)}"`);
      }
      continue;
    }

    if (ALLOWED_ATTRIBUTES.has(rawAttrName)) {
      allowedAttrs.push(`${rawAttrName}="${escapeHtmlAttr(attrValue)}"`);
    }
  }

  return allowedAttrs;
}

/**
 * Tokenizer-based sanitizer for non-DOM environments (SSR / test runners)
 * Avoids fragile regular expression tag filtering (CWE-116, CWE-79).
 */
function sanitizeHtmlNonDom(dirtyHtml: string): string {
  let result = '';
  let i = 0;
  const len = dirtyHtml.length;

  while (i < len) {
    const nextLt = dirtyHtml.indexOf('<', i);
    if (nextLt === -1) {
      result += dirtyHtml.slice(i);
      break;
    }

    result += dirtyHtml.slice(i, nextLt);
    i = nextLt;

    if (dirtyHtml.startsWith('<!--', i)) {
      const endComment = dirtyHtml.indexOf('-->', i + 4);
      if (endComment === -1) {
        break;
      }
      i = endComment + 3;
      continue;
    }

    let inQuote: string | null = null;
    let tagEnd = -1;
    for (let j = i + 1; j < len; j++) {
      const ch = dirtyHtml[j];
      if (inQuote) {
        if (ch === inQuote) inQuote = null;
      } else if (ch === '"' || ch === "'") {
        inQuote = ch;
      } else if (ch === '>') {
        tagEnd = j;
        break;
      }
    }

    if (tagEnd === -1) {
      break;
    }

    const rawTag = dirtyHtml.slice(i + 1, tagEnd).trim();
    i = tagEnd + 1;

    const isClosing = rawTag.startsWith('/');
    const tagContent = isClosing ? rawTag.slice(1).trim() : rawTag;

    let nameEnd = 0;
    while (nameEnd < tagContent.length && /[a-zA-Z0-9-]/.test(tagContent[nameEnd])) {
      nameEnd++;
    }
    const tagName = tagContent.slice(0, nameEnd).toLowerCase();

    if (!tagName) {
      continue;
    }

    if (DANGEROUS_TAGS.has(tagName)) {
      if (!isClosing) {
        let searchIndex = i;
        while (searchIndex < len) {
          const closeIdx = dirtyHtml.indexOf('</', searchIndex);
          if (closeIdx === -1) {
            i = len;
            break;
          }
          const closeGt = dirtyHtml.indexOf('>', closeIdx);
          if (closeGt === -1) {
            i = len;
            break;
          }
          const closeTagContent = dirtyHtml.slice(closeIdx + 2, closeGt).trim().toLowerCase();
          if (
            closeTagContent === tagName ||
            closeTagContent.startsWith(tagName + ' ') ||
            closeTagContent.startsWith(tagName + '\t')
          ) {
            i = closeGt + 1;
            break;
          }
          searchIndex = closeIdx + 2;
        }
      }
      continue;
    }

    if (ALLOWED_TAGS.has(tagName)) {
      if (isClosing) {
        result += `</${tagName}>`;
      } else {
        const isSelfClosing = tagContent.endsWith('/');
        const attrText = tagContent.slice(nameEnd, isSelfClosing ? tagContent.length - 1 : undefined).trim();
        const attrs = parseAndSanitizeAttributes(tagName, attrText);
        const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
        result += isSelfClosing ? `<${tagName}${attrStr}/>` : `<${tagName}${attrStr}>`;
      }
    }
  }

  return result;
}
