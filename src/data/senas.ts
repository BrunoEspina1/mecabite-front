/**
 * Mock data until the backend exists. Replace these helpers with API calls later.
 * IDs match the backend catalog (`GET /catalog/signs`): ASCII, e.g. `enie`, `por_favor`.
 */

import type { SymbolViewProps } from 'expo-symbols';

export type SymbolName = SymbolViewProps['name'];

export type NivelId = '1' | '2' | '3';

export type Nivel = {
  id: NivelId;
  titulo: string;
  subtitulo: string;
  /** Hand drawing that stands for the level, from the same set as the signs. `icon` is the fallback. */
  image: number;
  icon: SymbolName;
};

export type Sena = {
  id: string;
  nivel: NivelId;
  etiqueta: string;
  tipo: 'Letra' | 'Palabra';
  descripcion: string;
  configuracion: string;
  orientacion: string;
  localizacion: string;
  movimiento?: string;
  icon: SymbolName;
  /** Hand drawing (PNG asset): the letter's handshape, or one/two plain hands for words. `icon` is the fallback. */
  image?: number;
  /**
   * YouTube id of the sign's video in the INDISCAPACIDAD CDMX glossary of LSM, played from YouTube.
   * Letters: https://lsm.indiscapacidad.cdmx.gob.mx/ejes/educacion/
   * Words: the `saludos`, `expresiones-cotidianas` and `familia` sections of the same site.
   */
  video?: string;
  /** Made with both hands: both are evaluated and the person's chosen hand doesn't apply. */
  dosManos?: boolean;
};

const HAND_STATIC: SymbolName = { ios: 'hand.raised', android: 'back_hand', web: 'back_hand' };
const HAND_POINT: SymbolName = { ios: 'hand.point.up', android: 'pan_tool', web: 'pan_tool' };
const HAND_WAVE: SymbolName = { ios: 'hand.wave', android: 'waving_hand', web: 'waving_hand' };
const HAND_SIGN: SymbolName = { ios: 'hands.sparkles', android: 'sign_language', web: 'sign_language' };

export const NIVELES: Nivel[] = [
  {
    id: '1',
    titulo: 'Letras estáticas',
    subtitulo: 'A B C L Y',
    image: require('../../assets/images/signs/a.png'),
    icon: HAND_STATIC,
  },
  {
    id: '2',
    titulo: 'Letras con movimiento',
    subtitulo: 'J Ñ Q X Z',
    image: require('../../assets/images/signs/j.png'),
    icon: HAND_WAVE,
  },
  {
    id: '3',
    titulo: 'Palabras',
    subtitulo: 'Hola · Gracias · Por favor · Ayuda · Mamá',
    image: require('../../assets/images/signs/hand-two.png'),
    icon: HAND_SIGN,
  },
];

export const SENAS: Sena[] = [
  // Nivel 1
  {
    id: 'a',
    nivel: '1',
    etiqueta: 'A',
    tipo: 'Letra',
    descripcion: 'Mano en puño con el pulgar hacia afuera.',
    configuracion: 'Puño cerrado, pulgar extendido al costado del índice.',
    orientacion: 'Palma hacia el frente.',
    localizacion: 'A la altura del hombro.',
    icon: HAND_STATIC,
    image: require('../../assets/images/signs/a.png'),
    video: 'UIdCFNf_Udc',
  },
  {
    id: 'b',
    nivel: '1',
    etiqueta: 'B',
    tipo: 'Letra',
    descripcion: 'Dedos juntos y extendidos, pulgar doblado sobre la palma.',
    configuracion: 'Cuatro dedos rectos y unidos, pulgar sobre la palma.',
    orientacion: 'Palma hacia el frente.',
    localizacion: 'A la altura del hombro.',
    icon: HAND_STATIC,
    image: require('../../assets/images/signs/b.png'),
    video: 'Ub3BVznewp8',
  },
  {
    id: 'c',
    nivel: '1',
    etiqueta: 'C',
    tipo: 'Letra',
    descripcion: 'La mano forma una letra C curvando los dedos y el pulgar.',
    configuracion: 'Dedos y pulgar curvados formando un semicírculo.',
    orientacion: 'Palma hacia un lado.',
    localizacion: 'A la altura del hombro.',
    icon: HAND_STATIC,
    image: require('../../assets/images/signs/c.png'),
    video: 'wxmyvk8yjsQ',
  },
  {
    id: 'l',
    nivel: '1',
    etiqueta: 'L',
    tipo: 'Letra',
    descripcion: 'Índice hacia arriba y pulgar hacia el lado, formando una L.',
    configuracion: 'Índice y pulgar extendidos en ángulo recto.',
    orientacion: 'Palma hacia el frente.',
    localizacion: 'A la altura del hombro.',
    icon: HAND_POINT,
    image: require('../../assets/images/signs/l.png'),
    video: 'ViQ_CDYqhi8',
  },
  {
    id: 'y',
    nivel: '1',
    etiqueta: 'Y',
    tipo: 'Letra',
    descripcion: 'Pulgar y meñique extendidos, el resto de los dedos cerrados.',
    configuracion: 'Pulgar y meñique abiertos, demás dedos en puño.',
    orientacion: 'Palma hacia el frente.',
    localizacion: 'A la altura del hombro.',
    icon: HAND_STATIC,
    image: require('../../assets/images/signs/y.png'),
    video: '6EfodoGAJAE',
  },
  // Nivel 2
  {
    id: 'j',
    nivel: '2',
    etiqueta: 'J',
    tipo: 'Letra',
    descripcion: 'Con el meñique extendido, dibuja una J en el aire.',
    configuracion: 'Meñique extendido, demás dedos cerrados.',
    orientacion: 'Palma hacia el frente.',
    localizacion: 'A la altura del hombro.',
    movimiento: 'Curva hacia abajo y hacia adentro.',
    icon: HAND_WAVE,
    image: require('../../assets/images/signs/j.png'),
    video: 'jFVrrJxdAIM',
  },
  {
    id: 'enie',
    nivel: '2',
    etiqueta: 'Ñ',
    tipo: 'Letra',
    descripcion: 'Configuración de N con un movimiento ondulado.',
    configuracion: 'Índice y medio extendidos hacia abajo.',
    orientacion: 'Palma hacia abajo.',
    localizacion: 'Frente al pecho.',
    movimiento: 'Oscilación lateral de la muñeca.',
    icon: HAND_WAVE,
    image: require('../../assets/images/signs/enie.png'),
    video: 'K3nddBE4iO8',
  },
  {
    id: 'q',
    nivel: '2',
    etiqueta: 'Q',
    tipo: 'Letra',
    descripcion: 'Índice y pulgar en forma de pinza que se mueven hacia abajo.',
    configuracion: 'Índice y pulgar curvados, demás cerrados.',
    orientacion: 'Palma hacia abajo.',
    localizacion: 'Frente al pecho.',
    movimiento: 'Giro de muñeca hacia abajo.',
    icon: HAND_WAVE,
    image: require('../../assets/images/signs/q.png'),
    video: 'Wq75muS-EmY',
  },
  {
    id: 'x',
    nivel: '2',
    etiqueta: 'X',
    tipo: 'Letra',
    descripcion: 'Índice en gancho con movimiento en diagonal.',
    configuracion: 'Índice flexionado en forma de gancho.',
    orientacion: 'Palma hacia un lado.',
    localizacion: 'A la altura del hombro.',
    movimiento: 'Trazo diagonal corto.',
    icon: HAND_WAVE,
    image: require('../../assets/images/signs/x.png'),
    video: 'yNWC9DjTMTU',
  },
  {
    id: 'z',
    nivel: '2',
    etiqueta: 'Z',
    tipo: 'Letra',
    descripcion: 'Con el índice extendido, dibuja una Z en el aire.',
    configuracion: 'Índice extendido, demás dedos cerrados.',
    orientacion: 'Palma hacia el frente.',
    localizacion: 'A la altura del hombro.',
    movimiento: 'Trazo en zigzag.',
    icon: HAND_POINT,
    image: require('../../assets/images/signs/z.png'),
    video: 'ipefyBV4iuk',
  },
  // Nivel 3
  {
    id: 'hola',
    nivel: '3',
    etiqueta: 'Hola',
    tipo: 'Palabra',
    descripcion: 'Mano abierta que se aleja de la frente como un saludo.',
    configuracion: 'Mano abierta con dedos juntos.',
    orientacion: 'Palma hacia abajo, junto a la sien.',
    localizacion: 'Junto a la frente.',
    movimiento: 'Hacia afuera, alejándose de la cabeza.',
    icon: HAND_WAVE,
    image: require('../../assets/images/signs/hand-one.png'),
    video: 'lhrN2iaPdaM',
  },
  {
    id: 'gracias',
    nivel: '3',
    etiqueta: 'Gracias',
    tipo: 'Palabra',
    dosManos: true,
    descripcion: 'El dedo medio de una mano toca la palma de la otra y la mano se levanta.',
    configuracion: 'Una mano abierta con el dedo medio doblado; la otra abierta como apoyo.',
    orientacion: 'Palma de apoyo hacia arriba.',
    localizacion: 'Frente al pecho.',
    movimiento: 'La mano sube y se aleja de la palma de apoyo.',
    icon: HAND_SIGN,
    image: require('../../assets/images/signs/hand-two.png'),
    video: 'jAvN4wvvpgY',
  },
  {
    id: 'por_favor',
    nivel: '3',
    etiqueta: 'Por favor',
    tipo: 'Palabra',
    dosManos: true,
    descripcion: 'Las palmas juntas se frotan una contra la otra.',
    configuracion: 'Ambas manos abiertas, palma con palma.',
    orientacion: 'Palmas enfrentadas.',
    localizacion: 'Frente al pecho.',
    movimiento: 'Las palmas se frotan entre sí.',
    icon: HAND_SIGN,
    image: require('../../assets/images/signs/hand-two.png'),
    video: 'M5FowymHDx8',
  },
  {
    id: 'ayuda',
    nivel: '3',
    etiqueta: 'Ayuda',
    tipo: 'Palabra',
    dosManos: true,
    descripcion: 'Puño sobre la palma contraria, ambas manos suben juntas.',
    configuracion: 'Una mano en puño, la otra abierta debajo.',
    orientacion: 'Palma de apoyo hacia arriba.',
    localizacion: 'Frente al pecho.',
    movimiento: 'Ambas manos suben.',
    icon: HAND_SIGN,
    image: require('../../assets/images/signs/hand-two.png'),
  },
  {
    id: 'mama',
    nivel: '3',
    etiqueta: 'Mamá',
    tipo: 'Palabra',
    descripcion: 'La mano en M toca los labios dos veces.',
    configuracion: 'Índice, medio y anular extendidos y juntos, como la letra M.',
    orientacion: 'Dedos hacia la boca.',
    localizacion: 'Labios.',
    movimiento: 'Dos toques cortos.',
    icon: HAND_POINT,
    image: require('../../assets/images/signs/hand-one.png'),
    video: 'osNRQD_qxXw',
  },
];

export function getNivel(id: string | undefined): Nivel {
  return NIVELES.find((n) => n.id === id) ?? NIVELES[0];
}

export function getSenasByNivel(id: string | undefined): Sena[] {
  return SENAS.filter((s) => s.nivel === getNivel(id).id);
}

export function getSena(id: string | undefined): Sena | undefined {
  return SENAS.find((s) => s.id === id);
}
