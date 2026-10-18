import { flushSync } from 'react-dom';

const STYLE_ID = 'lukita-theme-vt';

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    ::view-transition-old(root), ::view-transition-new(root) { animation: none; mix-blend-mode: normal; }
    ::view-transition-old(root) { z-index: 1; }
    ::view-transition-new(root) { z-index: 2; }
  `;
  document.head.appendChild(style);
}

/**
 * Transición "wow" del tema en web: View Transitions API + clip-path circular que se expande
 * desde el botón pulsado, con un breve destello dorado. Si el navegador no la soporta o el usuario
 * prefiere menos movimiento, el cambio es instantáneo.
 */
export async function runWebThemeTransition(origin: { x: number; y: number }, apply: () => void, duration: number) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } };
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!doc.startViewTransition || reduce) {
    apply();
    return;
  }
  ensureStyles();
  const { x, y } = origin;
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const transition = doc.startViewTransition(() => {
    flushSync(apply);
  });
  await transition.ready;
  document.documentElement.animate(
    {
      clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`],
      filter: ['saturate(1.8) brightness(1.15)', 'saturate(1) brightness(1)'],
    },
    { duration, easing: 'cubic-bezier(.7,0,.2,1)', pseudoElement: '::view-transition-new(root)' },
  );
  document.documentElement.animate(
    { transform: ['scale(1)', 'scale(0.965)'], opacity: [1, 0.6] },
    { duration, easing: 'cubic-bezier(.7,0,.2,1)', pseudoElement: '::view-transition-old(root)' },
  );
  await transition.finished;
}
