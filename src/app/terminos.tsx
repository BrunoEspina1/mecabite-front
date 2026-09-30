import { LegalDocument } from '@/components/legal-document';
import { TERMINOS } from '@/data/terminos';

/** Terms and conditions, opened from Ajustes. The text lives in `@/data/terminos`. */
export default function TerminosScreen() {
  return <LegalDocument header="Términos y condiciones" text={TERMINOS} />;
}
