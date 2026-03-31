/* ============================================================
   sanitizer.js — HTML sanitizer for fetched .txt / .html game pages
   Load ORDER: 7th (no dependencies — pure function)
   ============================================================ */

"use strict";

function sanitizeHTML(html) {
  // GTM / gtag
  html = html.replace(/<script[^>]*googletagmanager[^>]*>[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<script[^>]*>[\s\S]*?window\.dataLayer[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<script[^>]*>[\s\S]*?gtag\([\s\S]*?<\/script>/gi, "");
  // Sidebar ad divs
  html = html.replace(/<div[^>]*id=["']sidebarad[12]["'][^>]*>[\s\S]*?<\/div>/gi, "");
  // Ad CSS
  html = html.replace(/#sidebarad1\s*,[\s\S]{0,20}#sidebarad2\s*\{[\s\S]*?\}/gi, "");
  html = html.replace(/#sidebarad[12]\s*\{[\s\S]*?\}/gi, "");
  html = html.replace(/\.sidebar-(?:close|frame)\s*\{[\s\S]*?\}/gi, "");
  // Obfuscated injectors
  html = html.replace(/<script>\s*\(function\s*\(_0x[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<script>\s*\(function\s*\(\s*\)[\s\S]*?<\/script>/gi, "");
  // External ad/analytics scripts
  html = html.replace(/<script[^>]*src=["'][^"']*(ads|analytics|tracker|doubleclick|adsbygoogle|pagead)[^"']*["'][^>]*><\/script>/gi, "");
  // Ad iframes + stylesheets
  html = html.replace(/<iframe[^>]*ads?[^>]*>[\s\S]*?<\/iframe>/gi, "");
  html = html.replace(/<link[^>]*rel=["']stylesheet["'][^>]*href=["'][^"']*(ads|adservice|doubleclick|pagead|analytics)[^"']*["'][^>]*\/?>/gi, "");
  html = html.replace(/<link[^>]*href=["'][^"']*(ads|adservice|doubleclick|pagead|analytics)[^"']*["'][^>]*rel=["']stylesheet["'][^>]*\/?>/gi, "");
  return html;
}
