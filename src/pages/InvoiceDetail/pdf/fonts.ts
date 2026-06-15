// Registers the Inter font family with @react-pdf/renderer.
//
// PDF standard fonts (Helvetica…) use WinAnsi/CP1252 and do NOT cover Czech
// diacritics (č š ř ž ě ů …), so a Unicode TTF/WOFF must be embedded. The Inter
// `.woff` files are bundled in src/assets/fonts so the output is self-contained.
//
// PORTING TO BACKEND: on Node, swap the imported asset URLs below for absolute
// file paths to the same .woff files, e.g. `path.join(__dirname, 'fonts/Inter-Regular.woff')`.
// Everything else (the data model + <InvoicePdfDocument>) is environment-agnostic.
import { Font } from '@react-pdf/renderer';
import InterRegular from '@/assets/fonts/Inter-Regular.woff';
import InterMedium from '@/assets/fonts/Inter-Medium.woff';
import InterSemiBold from '@/assets/fonts/Inter-SemiBold.woff';
import InterBold from '@/assets/fonts/Inter-Bold.woff';

let registered = false;

export const registerPdfFonts = () => {
  if (registered) return;
  registered = true;

  Font.register({
    family: 'Inter',
    fonts: [
      { src: InterRegular, fontWeight: 400 },
      { src: InterMedium, fontWeight: 500 },
      { src: InterSemiBold, fontWeight: 600 },
      { src: InterBold, fontWeight: 700 },
    ],
  });

  // Invoice text should never be hyphenated mid-word.
  Font.registerHyphenationCallback((word) => [word]);
};
