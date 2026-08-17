// Escape a string for safe interpolation into an HTML document (e.g. for
// document.write in a print preview window). Prevents DOM-based XSS when
// user-controlled values (item names, QR codes) are embedded in HTML.
export function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}