

// @ts-nocheck
"use server";

import type { ScrapedItemData } from '@/types';

// WARNING: This is a very basic and fragile HTML parser. 
// It's highly dependent on the specific structure of the Amazon URL provided in the example.
// It will likely break if Amazon changes its HTML structure or for other websites.
// A more robust solution would require libraries like Cheerio or JSDOM, or a headless browser.

// Helper function to decode HTML entities
function decodeHtmlEntities(text: string): string {
  if (typeof text !== 'string') return '';
  // Expanded list of HTML entities
  const entities: {[key: string]: string} = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&#160;': ' ',
    '&iexcl;': '¡',
    '&cent;': '¢',
    '&pound;': '£',
    '&curren;': '¤',
    '&yen;': '¥',
    '&brvbar;': '¦',
    '&sect;': '§',
    '&uml;': '¨',
    '&copy;': '©',
    '&ordf;': 'ª',
    '&laquo;': '«',
    '&not;': '¬',
    '&shy;': '­',
    '&reg;': '®',
    '&macr;': '¯',
    '&deg;': '°',
    '&plusmn;': '±',
    '&sup2;': '²',
    '&sup3;': '³',
    '&acute;': '´',
    '&micro;': 'µ',
    '&para;': '¶',
    '&middot;': '·',
    '&cedil;': '¸',
    '&sup1;': '¹',
    '&ordm;': 'º',
    '&raquo;': '»',
    '&frac14;': '¼',
    '&frac12;': '½',
    '&frac34;': '¾',
    '&iquest;': '¿',
    '&Agrave;': 'À',
    '&Aacute;': 'Á',
    '&Acirc;': 'Â',
    '&Atilde;': 'Ã',
    '&Auml;': 'Ä',
    '&Aring;': 'Å',
    '&AElig;': 'Æ',
    '&Ccedil;': 'Ç',
    '&Egrave;': 'È',
    '&Eacute;': 'É',
    '&Ecirc;': 'Ê',
    '&Euml;': 'Ë',
    '&Igrave;': 'Ì',
    '&Iacute;': 'Í',
    '&Icirc;': 'Î',
    '&Iuml;': 'Ï',
    '&ETH;': 'Ð',
    '&Ntilde;': 'Ñ',
    '&Ograve;': 'Ò',
    '&Oacute;': 'Ó',
    '&Ocirc;': 'Ô',
    '&Otilde;': 'Õ',
    '&Ouml;': 'Ö',
    '&times;': '×',
    '&Oslash;': 'Ø',
    '&Ugrave;': 'Ù',
    '&Uacute;': 'Ú',
    '&Ucirc;': 'Û',
    '&Uuml;': 'Ü',
    '&Yacute;': 'Ý',
    '&THORN;': 'Þ',
    '&szlig;': 'ß',
    '&agrave;': 'à',
    '&aacute;': 'á',
    '&acirc;': 'â',
    '&atilde;': 'ã',
    '&auml;': 'ä',
    '&aring;': 'å',
    '&aelig;': 'æ',
    '&ccedil;': 'ç',
    '&egrave;': 'è',
    '&eacute;': 'é',
    '&ecirc;': 'ê',
    '&euml;': 'ë',
    '&igrave;': 'ì',
    '&iacute;': 'í',
    '&icirc;': 'î',
    '&iuml;': 'ï',
    '&eth;': 'ð',
    '&ntilde;': 'ñ',
    '&ograve;': 'ò',
    '&oacute;': 'ó',
    '&ocirc;': 'ô',
    '&otilde;': 'õ',
    '&ouml;': 'ö',
    '&divide;': '÷',
    '&oslash;': 'ø',
    '&ugrave;': 'ù',
    '&uacute;': 'ú',
    '&ucirc;': 'û',
    '&uuml;': 'ü',
    '&yacute;': 'ý',
    '&thorn;': 'þ',
    '&yuml;': 'ÿ',
    '&ndash;': '–',
    '&mdash;': '—',
    '&lsquo;': '‘',
    '&rsquo;': '’',
    '&sbquo;': '‚',
    '&ldquo;': '“',
    '&rdquo;': '”',
    '&bdquo;': '„',
    '&dagger;': '†',
    '&Dagger;': '‡',
    '&bull;': '•',
    '&hellip;': '…',
    '&permil;': '‰',
    '&prime;': '′',
    '&Prime;': '″',
    '&lsaquo;': '‹',
    '&rsaquo;': '›',
    '&oline;': '‾',
    '&frasl;': '⁄',
    '&euro;': '€',
    '&trade;': '™',
    '&larr;': '←',
    '&uarr;': '↑',
    '&rarr;': '→',
    '&darr;': '↓',
    '&harr;': '↔',
    '&crarr;': '↵',
    '&forall;': '∀',
    '&part;': '∂',
    '&exist;': '∃',
    '&empty;': '∅',
    '&nabla;': '∇',
    '&isin;': '∈',
    '&notin;': '∉',
    '&ni;': '∋',
    '&prod;': '∏',
    '&sum;': '∑',
    '&minus;': '−',
    '&lowast;': '∗',
    '&radic;': '√',
    '&prop;': '∝',
    '&infin;': '∞',
    '&ang;': '∠',
    '&and;': '∧',
    '&or;': '∨',
    '&cap;': '∩',
    '&cup;': '∪',
    '&int;': '∫',
    '&there4;': '∴',
    '&sim;': '∼',
    '&cong;': '≅',
    '&asymp;': '≈',
    '&ne;': '≠',
    '&equiv;': '≡',
    '&le;': '≤',
    '&ge;': '≥',
    '&sub;': '⊂',
    '&sup;': '⊃',
    '&nsub;': '⊄',
    '&sube;': '⊆',
    '&supe;': '⊇',
    '&oplus;': '⊕',
    '&otimes;': '⊗',
    '&perp;': '⊥',
    '&sdot;': '⋅',
  };
  return text.replace(/(&[a-z#0-9]+;)/g, (entity) => entities[entity] || entity);
}

// Helper function to extract text content between tags, removing inner tags
function extractTextContent(html: string, tagId?: string, className?: string, tagName?: string): string {
  let regex;
  if (tagId) {
    regex = new RegExp(`<[^>]+id=["']${tagId}["'][^>]*>([\\s\\S]*?)<\/[^>]+>`, 'i');
  } else if (className) {
    // This is a simplified regex and might not catch all cases for class names
    regex = new RegExp(`<[^>]+class=["'][^"']*${className}[^"']*["'][^>]*>([\\s\\S]*?)<\/[^>]+>`, 'i');
  } else if (tagName) {
    regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, 'i');
  } else {
    return "";
  }

  const match = html.match(regex);
  if (match && match[1]) {
    // Remove inner HTML tags and excessive whitespace
    return decodeHtmlEntities(match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  }
  return "";
}

function extractAuthor(html: string): string {
  // 1. Try to parse the new bylineInfo structure (as per user's latest example)
  // This structure often contains multiple authors with their specific roles.
  const bylineInfoBlockMatch = html.match(/<div id=["']bylineInfo(?:_feature_div)?["'][^>]*>([\s\S]*?)<\/div>/i);
  if (bylineInfoBlockMatch && bylineInfoBlockMatch[1]) {
    const bylineHtml = bylineInfoBlockMatch[1];
    const authorEntries = [];
    // Regex to capture each author name and their roles list from within the bylineInfo block.
    // Example HTML for one author: <span class="author notFaded"...><a...>NAME</a> <span class="contribution"><span class="a-color-secondary">(ROLES), </span></span></span>
    const authorDetailRegex = /<span class="author notFaded"[^>]*>\s*<a class="a-link-normal"[^>]*>([^<]+)<\/a>\s*(?:<span class="contribution"[^>]*>\s*<span class="a-color-secondary">\s*\(([^)]+)\)\s*,?\s*<\/span>\s*<\/span>)?\s*<\/span>/gi;
    
    let match;
    while ((match = authorDetailRegex.exec(bylineHtml)) !== null) {
      const name = decodeHtmlEntities(match[1].trim());
      const roles = match[2] ? decodeHtmlEntities(match[2].trim().split(',').map(r => r.trim()).filter(r => r).join(', ')) : "Author"; // Decode, trim, and rejoin roles
      authorEntries.push(`${name} (${roles})`);
    }

    if (authorEntries.length > 0) {
      return authorEntries.join(', '); // Format: "Name (Role1, Role2), Name (Role1)"
    }
  }

  // 2. Fallback: Original pattern for authors specifically marked with "(Author)" in a certain span structure.
  let authorMatchFallback = html.match(/<span class="author notFaded"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>[\s\S]*?\(Author\)/i);
  if (authorMatchFallback && authorMatchFallback[1]) {
    return decodeHtmlEntities(authorMatchFallback[1].trim());
  }

  // 3. Fallback: Simpler pattern looking for an element with class "authorName" containing an <a> tag.
  authorMatchFallback = html.match(/class="authorName"[^>]*><a[^>]*>([^<]+)<\/a>/i);
  if (authorMatchFallback && authorMatchFallback[1]) {
    return decodeHtmlEntities(authorMatchFallback[1].trim());
  }
  
  // 4. Fallback: Contribution list format - extracts names if "(author" (case-insensitive) is present in the contribution text.
  const contributorMatchesFallback = html.matchAll(/<span class='a-declarative'[^>]*>\s*<a class="a-link-normal contributorNameID"[^>]+>([^<]+)<\/a>\s*<span class="a-color-secondary contribution">([^<]+)<\/span>/gi);
  let authorsFromContributionsFallback = [];
  for (const contribMatch of contributorMatchesFallback) {
    if (contribMatch[2] && contribMatch[2].toLowerCase().includes('(author')) { 
        authorsFromContributionsFallback.push(decodeHtmlEntities(contribMatch[1].trim()));
    }
  }
  if (authorsFromContributionsFallback.length > 0) {
    return authorsFromContributionsFallback.join(', ');
  }

  return "Author not found";
}

function extractPublicationDate(html: string): string {
  // 1. Try new carousel structure for publication date
  const carouselPubDateMatch = html.match(/<div id=["']rpi-attribute-book_details-publication_date["'][^>]*>[\s\S]*?<div class=["'][^"']*rpi-attribute-value[^"']*["'][^>]*>\s*<span>([^<]+)<\/span>\s*<\/div>[\s\S]*?<\/div>/i);
  if (carouselPubDateMatch && carouselPubDateMatch[1]) {
    return decodeHtmlEntities(carouselPubDateMatch[1].trim());
  }

  // 2. Fallback: Look for "Publication date" specifically in bold
  const boldPubDateMatch = html.match(/<b>Publication date<\/b>\s*:\s*([^<]+)</i);
  if (boldPubDateMatch && boldPubDateMatch[1]) {
    return decodeHtmlEntities(boldPubDateMatch[1].trim());
  }

  // 3. Fallback: Common pattern for book details (publisher date in parens)
  const detailMatch = html.match(/<div id="detailBullets_feature_div">[\s\S]*?<li><b>Publisher<\/b>:\s*[^<]+<span>\s*\(([^<]+)\)<\/span><\/li>[\s\S]*?<\/div>/i);
  if (detailMatch && detailMatch[1]) {
     return decodeHtmlEntities(detailMatch[1].trim());
  }
  return "Publication date not found";
}

function extractPrintLength(html: string): string {
    // 1. Try flexible carousel structure first, looking for any id ending in `_pages`.
    const printLengthMatch = html.match(/<div id=["']rpi-attribute-book_details-[^"']*_pages["'][^>]*>[\s\\S]*?<div class=["'][^"']*rpi-attribute-value[^"']*["'][^>]*>[\s\\S]*?<span>([^<]+)<\/span>/i);
    if (printLengthMatch && printLengthMatch[1]) {
        let lengthText = decodeHtmlEntities(printLengthMatch[1].trim());
        if (/^\d+$/.test(lengthText)) {
            lengthText += " pages";
        }
        return lengthText;
    }
    // 2. Fallback for "Print length" in detail bullets. This is a very common pattern.
    const detailPrintLengthMatch = html.match(/<li><b>Print length<\/b>\s*:\s*<span[^>]*>\s*([^<]+)\s*<\/span><\/li>/i);
    if (detailPrintLengthMatch && detailPrintLengthMatch[1]) {
        return decodeHtmlEntities(detailPrintLengthMatch[1].trim());
    }

    // 3. Fallback for "Product Details" section.
    const productDetailsMatch = html.match(/<div id=["']productDetails_feature_div["'][^>]*>([\s\S]*?)<\/div>/i);
    if (productDetailsMatch && productDetailsMatch[1]) {
        const productDetailsHtml = productDetailsMatch[1];
        const detailMatch = productDetailsHtml.match(/(?:Print length|Hardcover|Paperback)\s*<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/i);
        if (detailMatch && detailMatch[1]) {
            return decodeHtmlEntities(detailMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
        }
    }
    
    return "Print length not found";
}

function extractFileSize(html: string): string {
  // 1. Try carousel structure first
  const carouselFileSizeMatch = html.match(/<div id=["']rpi-attribute-book_details-file_size["'][^>]*>[\s\S]*?<div class=["'][^"']*rpi-attribute-value[^"']*["'][^>]*>\s*<span>([^<]+)<\/span>\s*<\/div>[\s\S]*?<\/div>/i);
  if (carouselFileSizeMatch && carouselFileSizeMatch[1]) {
    return decodeHtmlEntities(carouselFileSizeMatch[1].trim());
  }

  // 2. Fallback for "detailBullets" list where label and value are in sibling spans.
  const detailFileSizeMatch = html.match(/<span class=["']a-text-bold["']>\s*File size\s*[^<]*<\/span>\s*<span>([^<]+)<\/span>/i);
  if (detailFileSizeMatch && detailFileSizeMatch[1]) {
    return decodeHtmlEntities(detailFileSizeMatch[1].trim());
  }

  // 3. Fallback for "Product Details" section (table format).
  const productDetailsMatch = html.match(/<div id=["']productDetails_feature_div["'][^>]*>([\s\S]*?)<\/div>/i);
  if (productDetailsMatch && productDetailsMatch[1]) {
      const productDetailsHtml = productDetailsMatch[1];
      const detailMatch = productDetailsHtml.match(/File size\s*<\/th>\s*<td[^>]*>([^<]+)<\/td>/i);
      if (detailMatch && detailMatch[1]) {
          return decodeHtmlEntities(detailMatch[1].trim());
      }
  }

  // 4. Generic fallback looking for the label and capturing subsequent text.
  const genericFileSizeMatch = html.match(/(?:<b>File size<\/b>|File size\s*<\/span>\s*<span[^>]*>)([^<]+)<\/span>/i);
  if (genericFileSizeMatch && genericFileSizeMatch[1]) {
      return decodeHtmlEntities(genericFileSizeMatch[1].trim());
  }


  return "File size not found";
}


function extractDescription(html: string): string {
  let descriptionHtml = '';
  // 1. Try #bookDescription_feature_div first
  let descMatch = html.match(/<div id=["']bookDescription_feature_div["'][^>]*>([\s\S]*?)(?:<div class=["']a-expander-header|<div id=["']outer_postBodyPS")/i);
  if (descMatch && descMatch[1]) {
      descriptionHtml = descMatch[1];
  } else {
    // 2. Fallback for a simpler description structure within product-description-full-width
    descMatch = html.match(/<div class=["'][^"']*product-description-full-width[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    if(descMatch && descMatch[1]) {
        descriptionHtml = descMatch[1];
    }
  }

  if (descriptionHtml) {
    // Clean up common amazon description formatting
    // Replace <br> and <p> with newlines for paragraph breaks
    // Remove common formatting tags like b, i, em, strong, span
    // Then remove any remaining HTML tags and decode entities
    return decodeHtmlEntities(
        descriptionHtml
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<p[^>]*>/gi, '\n\n')
            .replace(/<\/?(h[1-6]|b|i|em|strong|span|blockquote)[^>]*>/gi, '') // Remove more formatting tags
            .replace(/<[^>]+>/g, ' ') // remove any leftover tags
            .replace(/\s+/g, ' ') // collapse whitespace
            .trim()
    );
  }
  
  // 3. Fallback to OpenGraph description meta tag if no description block found
  const ogDescMatch = html.match(/<meta property=["']og:description["'] content=["'](.*?)["']/i);
  if (ogDescMatch && ogDescMatch[1]) {
    return decodeHtmlEntities(ogDescMatch[1].trim());
  }

  return "Description not found";
}

function extractImageUrl(html: string): string {
  // 1. Try to get from 'data-a-dynamic-image' for higher quality options
  const dynamicImageMatch = html.match(/data-a-dynamic-image=["'](.*?)["']/i);
  if (dynamicImageMatch && dynamicImageMatch[1]) {
    try {
      const dynamicImageData = JSON.parse(decodeHtmlEntities(dynamicImageMatch[1]));
      let bestUrl = "";
      let maxSize = 0;
      for (const url in dynamicImageData) {
        const dimensions = dynamicImageData[url]; // [width, height]
        if (dimensions && dimensions.length === 2) {
          const size = dimensions[0] * dimensions[1];
          if (size > maxSize) {
            maxSize = size;
            bestUrl = url;
          }
        }
      }
      if (bestUrl) return bestUrl;
    } catch (e) {
      // Parsing JSON failed, continue to other methods
    }
  }

  // 2. Try to find an <img> tag with class="fullscreen" (often high-res, may be dynamically loaded)
  const fullscreenImageMatch = html.match(/<img[^>]+class=["'][^"']*fullscreen[^"']*["'][^>]*src=["'](.*?)["']/i);
  if (fullscreenImageMatch && fullscreenImageMatch[1]) {
    return decodeHtmlEntities(fullscreenImageMatch[1]);
  }

  // 3. Fallback to #landingImage (often a good quality primary image)
  let imageMatch = html.match(/<img id=["']landingImage["'][^>]*src=["'](.*?)["']/i);
  if (imageMatch && imageMatch[1]) return decodeHtmlEntities(imageMatch[1]);
  
  // 4. Fallback to #imgBlkFront (another common ID for main product image)
  imageMatch = html.match(/<img id=["']imgBlkFront["'][^>]*src=["'](.*?)["']/i);
  if (imageMatch && imageMatch[1]) return decodeHtmlEntities(imageMatch[1]);
  
  // 5. Try OpenGraph image meta tag
  const ogImageMatch = html.match(/<meta property=["']og:image["'] content=["'](.*?)["']/i);
  if (ogImageMatch && ogImageMatch[1]) {
    return decodeHtmlEntities(ogImageMatch[1].trim());
  }
  
  // 6. Generic image search if others fail (less reliable for *main* image)
  // This is broad, might pick up thumbnails or unrelated images if not careful
  imageMatch = html.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*alt=["'][^"']*book[^"']*["']/i); // try to find "book" in alt
  if (imageMatch && imageMatch[1]) return decodeHtmlEntities(imageMatch[1]);

  return ""; // Return empty if no suitable image is found
}

function parseHtmlContent(html: string, sourceIdentifier: string): { data?: ScrapedItemData; error?: string } {
    const title = extractTextContent(html, 'productTitle') || extractTextContent(html, undefined, 'a-size-extra-large', 'h1') || "Title not found";
    const author = extractAuthor(html);
    const year = extractPublicationDate(html);
    const description = extractDescription(html);
    const imageUrl = extractImageUrl(html);
    const printLength = extractPrintLength(html);
    const fileSize = extractFileSize(html);
    
    if (title === "Title not found" && author === "Author not found" && year === "Publication date not found") {
        const titleTagMatch = html.match(/<title>([^<]+)<\/title>/i);
        const pageTitle = titleTagMatch && titleTagMatch[1] ? decodeHtmlEntities(titleTagMatch[1].trim()) : "Possible Error Page";
        
        if (html.toLowerCase().includes("captcha") || html.toLowerCase().includes("are you a robot") || pageTitle.toLowerCase().includes("captcha")) {
             return { error: `Failed to parse content. The HTML appears to be a CAPTCHA or security check page.` };
        }
        return { error: `Failed to parse critical content (title, author, year). The website structure might be different, unsupported, or it's not a recognized product page. Page title: ${pageTitle}` };
    }


    return {
      data: {
        title,
        author,
        year,
        description,
        imageUrl: imageUrl || 'https://placehold.co/600x400.png', 
        sourceUrl: sourceIdentifier,
        printLength,
        fileSize,
      },
    };
}


export async function scrapeUrl(url: string): Promise<{ data?: ScrapedItemData; error?: string }> {
  if (!url) {
    return { error: "URL is required." };
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        // It might be beneficial to mimic more browser headers if CAPTCHAs are frequent
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-User': '?1',
        'Sec-Fetch-Dest': 'document',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (!response.ok) {
      return { error: `Failed to fetch URL: ${response.status} ${response.statusText}` };
    }

    const html = await response.text();
    return parseHtmlContent(html, url);

  } catch (e: any) {
    // Check for specific fetch errors if possible, e.g., network errors
    if (e.message && e.message.toLowerCase().includes('failed to fetch')) {
        return { error: `Network error: Failed to fetch the URL. Please check your internet connection and the URL. (${e.message})` };
    }
    return { error: `An error occurred during scraping: ${e.message}` };
  }
}

export async function scrapeHtmlContent(htmlContent: string, fileName: string): Promise<{ data?: ScrapedItemData; error?: string }> {
    if (!htmlContent) {
        return { error: "HTML content is empty." };
    }

    try {
        return parseHtmlContent(htmlContent, `File: ${fileName}`);
    } catch (e: any) {
        return { error: `An error occurred during HTML parsing: ${e.message}` };
    }
}
    
