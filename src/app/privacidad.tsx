import { LegalDocument } from '@/components/legal-document';
import { AVISO_PRIVACIDAD } from '@/data/aviso-privacidad';

/** Privacy notice, opened from Ajustes. The text lives in `@/data/aviso-privacidad`. */
export default function PrivacidadScreen() {
  return <LegalDocument header="Aviso de privacidad" text={AVISO_PRIVACIDAD} />;
}
