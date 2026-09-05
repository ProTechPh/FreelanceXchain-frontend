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

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * Validate a URL attribute (href, src) to prevent javascript: and dangerous schemes
 */
function isSafeUrl(url: string, allowImageData = false): boolean {
  const trimmed = url.trim().toLowerCase();
  if (!trimmed) return false;

  if (trimmed.startsWith('javascript:') || trimmed.startsWith('vbscript:')) {
    return false;
  }

  if (trimmed.startsWith('data:')) {
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
      // Fall through to regex sanitizer
    }
  }

  let clean = dirtyHtml;

  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  clean = clean.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  clean = clean.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  clean = clean.replace(/\s+on[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');
  clean = clean.replace(/href\s*=\s*['"]?\s*javascript:[^'">\s]*/gi, 'href="#"');
  clean = clean.replace(/src\s*=\s*['"]?\s*javascript:[^'">\s]*/gi, 'src=""');

  return clean;
}
