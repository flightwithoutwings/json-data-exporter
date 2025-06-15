
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
  return text.replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#039;/g, "'")
             .replace(/&nbsp;/g, " ");
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
  // Try carousel structure first for ebook_pages or paperback_pages
  const printLengthMatch = html.match(/<div id=["']rpi-attribute-book_details-(?:ebook_pages|paperback_pages)["'][^>]*>[\s\S]*?<div class=["'][^"']*rpi-attribute-value[^"']*["'][^>]*>\s*(?:<a[^>]*>)?\s*<span>([^<]+)<\/span>/i);
  if (printLengthMatch && printLengthMatch[1]) {
    // Ensure "pages" is appended if just a number
    let lengthText = decodeHtmlEntities(printLengthMatch[1].trim());
    if (/^\d+$/.test(lengthText)) {
        lengthText += " pages";
    }
    return lengthText;
  }
  // Fallback for "Print length" in detail bullets
  const detailPrintLengthMatch = html.match(/<li><b>Print length<\/b>\s*:\s*<span[^>]*>\s*([^<]+)\s*<\/span><\/li>/i);
  if (detailPrintLengthMatch && detailPrintLengthMatch[1]) {
    return decodeHtmlEntities(detailPrintLengthMatch[1].trim());
  }
  return "Print length not found";
}

function extractFileSize(html: string): string {
  // Try carousel structure first
  const fileSizeMatch = html.match(/<div id=["']rpi-attribute-book_details-file_size["'][^>]*>[\s\S]*?<div class=["'][^"']*rpi-attribute-value[^"']*["'][^>]*>\s*<span>([^<]+)<\/span>\s*<\/div>[\s\S]*?<\/div>/i);
  if (fileSizeMatch && fileSizeMatch[1]) {
    return decodeHtmlEntities(fileSizeMatch[1].trim());
  }
   // Fallback for "File size" in detail bullets
  const detailFileSizeMatch = html.match(/<li><b>File size<\/b>\s*:\s*<span[^>]*>\s*([^<]+)\s*<\/span><\/li>/i);
  if (detailFileSizeMatch && detailFileSizeMatch[1]) {
    return decodeHtmlEntities(detailFileSizeMatch[1].trim());
  }
  return "File size not found";
}


function extractDescription(html: string): string {
  // Try #bookDescription_feature_div first
  let descMatch = html.match(/<div id=["']bookDescription_feature_div["'][^>]*>([\s\S]*?)<div class=["']a-expander-header/i);
  if (descMatch && descMatch[1]) {
    const descContent = descMatch[1];
    let innerDescMatch = descContent.match(/<noscript>[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>[\s\S]*?<\/noscript>/i);
    if (innerDescMatch && innerDescMatch[1]) {
       return decodeHtmlEntities(innerDescMatch[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    }
    // Try to get content from within a data-a-expander-name="book_description_expander"
    innerDescMatch = descContent.match(/<div[^>]*data-a-expander-name=["']book_description_expander["'][^>]*>([\s\S]*?)<\/div>/i);
     if (innerDescMatch && innerDescMatch[1]) {
       // Further clean up common amazon description formatting
       return decodeHtmlEntities(innerDescMatch[1].replace(/<br\s*\/?>/gi, '\n').replace(/<p[^>]*>/gi, '\n\n').replace(/<\/?(?:b|i|em|strong|span)[^>]*>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    }
  }
  
  // Fallback for a simpler description structure within product-description-full-width
  descMatch = html.match(/<div class=["'][^"']*product-description-full-width[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  if (descMatch && descMatch[1]) {
    return decodeHtmlEntities(descMatch[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  }
  
  // Fallback to OpenGraph description meta tag
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
             return { error: "Failed to parse content. CAPTCHA or security check encountered on the target page. Try a different URL or check the page in your browser." };
        }
        // If still not found, it's likely parsing failed significantly or it's not a product page
        return { error: `Failed to parse critical content (title, author, year). The website structure might be different, unsupported, or it's not a recognized product page. Page title: ${pageTitle}` };
    }


    return {
      data: {
        title,
        author,
        year,
        description,
        imageUrl: imageUrl || 'https://placehold.co/600x400.png', 
        sourceUrl: url,
        printLength,
        fileSize,
      },
    };
  } catch (e: any) {
    // Check for specific fetch errors if possible, e.g., network errors
    if (e.message && e.message.toLowerCase().includes('failed to fetch')) {
        return { error: `Network error: Failed to fetch the URL. Please check your internet connection and the URL. (${e.message})` };
    }
    return { error: `An error occurred during scraping: ${e.message}` };
  }
}

    