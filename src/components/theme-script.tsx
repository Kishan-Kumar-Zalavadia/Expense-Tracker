'use client'

// Injected as a blocking script in <head> to prevent theme flash on first paint.
// Reads from localStorage and applies data-theme before React hydrates.
export function ThemeScript() {
  const script = `
    (function() {
      try {
        var theme = localStorage.getItem('ledger-theme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);
      } catch(e) {}
    })();
  `
  // eslint-disable-next-line react/no-danger
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
