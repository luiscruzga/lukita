/** En nativo la transición la dibuja ThemeProvider; aquí solo se aplica el cambio. */
export async function runWebThemeTransition(_origin: { x: number; y: number }, apply: () => void, _duration: number) {
  apply();
}
