/**
 * Mock data until the backend exists. Replace these helpers with API calls later.
 */

import type { SymbolViewProps } from 'expo-symbols';

export type SymbolName = SymbolViewProps['name'];

export type NivelId = '1' | '2' | '3';

export type Nivel = {
  id: NivelId;
  titulo: string;
  subtitulo: string;
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
};

const HAND_STATIC: SymbolName = { ios: 'hand.raised', android: 'back_hand', web: 'back_hand' };
const HAND_POINT: SymbolName = { ios: 'hand.point.up', android: 'pan_tool', web: 'pan_tool' };
const HAND_WAVE: SymbolName = { ios: 'hand.wave', android: 'waving_hand', web: 'waving_hand' };
const HAND_SIGN: SymbolName = { ios: 'hands.sparkles', android: 'sign_language', web: 'sign_language' };

export const NIVELES: Nivel[] = [
  { id: '1', titulo: 'Letras estáticas', subtitulo: 'A B C L Y', icon: HAND_STATIC },
  { id: '2', titulo: 'Letras con movimiento', subtitulo: 'J Ñ Q X Z', icon: HAND_WAVE },
  { id: '3', titulo: 'Palabras', subtitulo: 'Hola · Gracias · Por favor · Ayuda · Mamá', icon: HAND_SIGN },
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
  },
  // Nivel 3
  {
    id: 'hola',
    nivel: '3',
    etiqueta: 'Hola',
    tipo: 'Palabra',
    descripcion: 'Mano abierta que se aleja de la frente como un saludo.',
    configuracion: 'Mano abierta con dedos juntos.',
    orientacion: 'Palma hacia el frente.',
    localizacion: 'Junto a la frente.',
    movimiento: 'Hacia afuera, alejándose de la cabeza.',
    icon: HAND_WAVE,
  },
  {
    id: 'gracias',
    nivel: '3',
    etiqueta: 'Gracias',
    tipo: 'Palabra',
    descripcion: 'Mano abierta que baja desde la barbilla hacia el frente.',
    configuracion: 'Mano abierta con dedos juntos.',
    orientacion: 'Palma hacia ti.',
    localizacion: 'Barbilla.',
    movimiento: 'Hacia adelante y abajo.',
    icon: HAND_SIGN,
  },
  {
    id: 'por-favor',
    nivel: '3',
    etiqueta: 'Por favor',
    tipo: 'Palabra',
    descripcion: 'Mano abierta que hace círculos sobre el pecho.',
    configuracion: 'Mano abierta.',
    orientacion: 'Palma hacia el pecho.',
    localizacion: 'Pecho.',
    movimiento: 'Circular.',
    icon: HAND_SIGN,
  },
  {
    id: 'ayuda',
    nivel: '3',
    etiqueta: 'Ayuda',
    tipo: 'Palabra',
    descripcion: 'Puño sobre la palma contraria, ambas manos suben juntas.',
    configuracion: 'Una mano en puño, la otra abierta debajo.',
    orientacion: 'Palma de apoyo hacia arriba.',
    localizacion: 'Frente al pecho.',
    movimiento: 'Ambas manos suben.',
    icon: HAND_SIGN,
  },
  {
    id: 'mama',
    nivel: '3',
    etiqueta: 'Mamá',
    tipo: 'Palabra',
    descripcion: 'Pulgar de la mano abierta toca la barbilla dos veces.',
    configuracion: 'Mano abierta con dedos separados.',
    orientacion: 'Palma hacia un lado.',
    localizacion: 'Barbilla.',
    movimiento: 'Dos toques cortos.',
    icon: HAND_SIGN,
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
