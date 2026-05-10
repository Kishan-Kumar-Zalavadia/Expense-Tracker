import Script from 'next/script'

// Blocking script injected before React hydrates to prevent theme flash.
export function ThemeScript() {
  return (
    <Script id="theme-init" strategy="beforeInteractive">{`
      (function() {
        try {
          var theme = localStorage.getItem('ledger-theme') || 'light';
          document.documentElement.setAttribute('data-theme', theme);
        } catch(e) {}
      })();
    `}</Script>
  )
}
