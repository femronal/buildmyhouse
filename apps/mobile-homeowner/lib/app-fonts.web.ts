/**
 * Web loads these families from `global.css` (`/fonts/*.ttf`).
 * Passing the `@expo-google-fonts` files to `useFonts` makes the browser
 * request `/assets/__node_modules/.pnpm/@expo-google-fonts+…ttf`, which the
 * static host does not have.
 */
export const appFonts = {};
