/* ============================================================
   sanitizer.js — HTML sanitizer for fetched .txt / .html game pages
   Load ORDER: 3rd (no dependencies — pure function)
   ============================================================ */

"use strict";

// Compiled once at load time so repeated calls share the same RegExp objects.
const _SANITIZE_PATTERNS = [
  // GTM / gtag scripts
  /<script[^>]*googletagmanager[^>]*>[\s\S]*?<\/script>/gi,
  /<script[^>]*>[\s\S]*?window\.dataLayer[\s\S]*?<\/script>/gi,
  /<script[^>]*>[\s\S]*?gtag\([\s\S]*?<\/script>/gi,
  // Sidebar ad divs
  /<div[^>]*id=["']sidebarad[12]["'][^>]*>[\s\S]*?<\/div>/gi,
  // Ad CSS blocks
  /#sidebarad1\s*,[\s\S]{0,20}#sidebarad2\s*\{[\s\S]*?\}/gi,
  /#sidebarad[12]\s*\{[\s\S]*?\}/gi,
  /\.sidebar-(?:close|frame)\s*\{[\s\S]*?\}/gi,
  // Obfuscated injectors
  /<script>\s*\(function\s*\(_0x[\s\S]*?<\/script>/gi,
  /<script>\s*\(function\s*\(\s*\)[\s\S]*?<\/script>/gi,
  // External ad / analytics scripts
  /<script[^>]*src=["'][^"']*(ads|analytics|tracker|doubleclick|adsbygoogle|pagead)[^"']*["'][^>]*><\/script>/gi,
  // Ad iframes
  /<iframe[^>]*ads?[^>]*>[\s\S]*?<\/iframe>/gi,
  // Ad stylesheets (both attribute orders)
  /<link[^>]*rel=["']stylesheet["'][^>]*href=["'][^"']*(ads|adservice|doubleclick|pagead|analytics)[^"']*["'][^>]*\/?>/gi,
  /<link[^>]*href=["'][^"']*(ads|adservice|doubleclick|pagead|analytics)[^"']*["'][^>]*rel=["']stylesheet["'][^>]*\/?>/gi,
];

function sanitizeHTML(html) {
  for (const re of _SANITIZE_PATTERNS) {
    re.lastIndex = 0; // reset stateful global regexes between calls
    html = html.replace(re, "");
  }
  return html;
}
