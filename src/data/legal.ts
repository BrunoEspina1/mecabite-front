/** Shared shape of the legal texts (privacy notice, terms) rendered by `LegalDocument`. */

export const RESPONSABLE = 'MecaBite';
/** Fill in before publishing the app. */
export const CONTACTO = '[correo de contacto]';

export type LegalLink = {
  texto: string;
  url: string;
};

export type LegalSection = {
  titulo: string;
  parrafos?: string[];
  puntos?: string[];
  /** Sources and references, opened in the browser. */
  enlaces?: LegalLink[];
  /** Closing line, shown after the bullets. */
  nota?: string;
};

export type LegalText = {
  /** Heading of the screen. */
  titulo: string;
  actualizado: string;
  secciones: LegalSection[];
};
