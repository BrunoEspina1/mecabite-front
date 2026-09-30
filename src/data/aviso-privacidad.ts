/**
 * Privacy notice shown in Ajustes → Aviso de privacidad.
 * It must describe what the app really does: update it whenever the data sent to the backend
 * (`ObservationMessage`, `CreateSessionRequest`) or stored on the device changes.
 */

/** Fill in before publishing the app. */
const RESPONSABLE = '[Nombre del responsable]';
const CONTACTO = '[correo de contacto]';

export const AVISO_ACTUALIZADO = '30 de septiembre de 2026';

export type AvisoSeccion = {
  titulo: string;
  parrafos?: string[];
  puntos?: string[];
  /** Closing line, shown after the bullets. */
  nota?: string;
};

/** The three things people ask first, shown at the top of the screen. */
export const AVISO_RESUMEN: string[] = [
  'Tu video nunca sale del teléfono ni se guarda.',
  'Solo se envían puntos de tus manos y de tu cuerpo para revisar la seña.',
  'No usamos publicidad ni vendemos tus datos.',
];

export const AVISO_SECCIONES: AvisoSeccion[] = [
  {
    titulo: '1. Quién es responsable',
    parrafos: [
      `${RESPONSABLE}, responsable de SeñaFácil, es quien decide cómo se usan los datos descritos en este aviso. Para cualquier duda puedes escribir a ${CONTACTO}.`,
    ],
  },
  {
    titulo: '2. Qué datos usamos',
    parrafos: ['Cuando practicas una seña, la app usa la cámara y obtiene de cada imagen:'],
    puntos: [
      'Puntos de la mano: 21 coordenadas por mano y si es la izquierda o la derecha.',
      'Puntos del cuerpo: 33 coordenadas que indican la posición de la cara, los hombros y los brazos.',
      'Datos de la sesión: la seña que practicas, el tamaño de la imagen y el momento de cada captura.',
      'Identificadores: el ID de participante que aparece en Ajustes de conexión, un identificador del dispositivo (modelo del teléfono más un código al azar) y la versión de la app.',
    ],
  },
  {
    titulo: '3. Qué no recopilamos',
    puntos: [
      'Video, fotos o audio: las imágenes de la cámara se analizan dentro del teléfono y se descartan al instante.',
      'Nombre, correo, teléfono, ubicación o contactos.',
      'Datos para publicidad o de seguimiento en otras apps.',
    ],
  },
  {
    titulo: '4. Para qué los usamos',
    puntos: [
      'Revisar tu seña en tiempo real y decirte qué corregir.',
      'Comprobar que tu cara y tus hombros se ven de frente a la cámara.',
      'Distinguir una sesión de práctica de otra.',
    ],
  },
  {
    titulo: '5. Mejora del reconocimiento (opcional)',
    parrafos: [
      'Si activas «Guardar landmarks para entrenamiento» en Ajustes de conexión, los puntos de tus manos y de tu cuerpo se guardan en el servidor para entrenar y mejorar el reconocimiento de señas.',
      'Esta opción está apagada de forma predeterminada y solo debe activarse con tu consentimiento. Puedes apagarla cuando quieras; lo que practiques después ya no se guardará.',
    ],
  },
  {
    titulo: '6. Dónde se procesan y con quién se comparten',
    parrafos: [
      'Los puntos se envían al servidor de SeñaFácil indicado en Ajustes de conexión. Con «Backend simulado» activado, todo ocurre dentro del teléfono y no se envía nada.',
      'No compartimos ni vendemos tus datos a terceros.',
    ],
  },
  {
    titulo: '7. Qué se guarda en tu teléfono',
    puntos: [
      'Tus ajustes de conexión: dirección del servidor, ID de participante y preferencias.',
      'El identificador del dispositivo.',
      'Si ya viste el recorrido de bienvenida.',
    ],
    nota: 'Todo esto se borra al desinstalar la app.',
  },
  {
    titulo: '8. Permisos que pide la app',
    puntos: [
      'Cámara: para ver tus manos mientras practicas.',
      'Red local: para conectarse al servidor que evalúa las señas.',
    ],
    nota: 'Puedes retirar estos permisos desde los ajustes del teléfono; sin la cámara no es posible practicar.',
  },
  {
    titulo: '9. Tus derechos',
    parrafos: [
      `Puedes pedir que te digamos qué datos tuyos tenemos, que los corrijamos o eliminemos, y oponerte a su uso (derechos ARCO), así como retirar tu consentimiento. Escribe a ${CONTACTO} indicando tu ID de participante.`,
    ],
  },
  {
    titulo: '10. Cambios a este aviso',
    parrafos: ['Si este aviso cambia, publicaremos la nueva versión en esta misma pantalla con su fecha de actualización.'],
  },
];
