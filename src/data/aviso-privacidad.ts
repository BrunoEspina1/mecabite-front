/**
 * Privacy notice shown in Ajustes → Aviso de privacidad.
 * It is written for the person using the app, not for whoever sets it up: it says what happens to
 * their data, not where each option lives. Update it whenever the data sent to the backend
 * (`ObservationMessage`, `CreateSessionRequest`) or stored on the device changes.
 */

import { CONTACTO, RESPONSABLE, type LegalText } from '@/data/legal';

export const AVISO_PRIVACIDAD: LegalText = {
  titulo: 'Tu privacidad en EnSeñas',
  actualizado: '30 de septiembre de 2026',
  secciones: [
    {
      titulo: '1. Quién es responsable',
      parrafos: [
        `${RESPONSABLE}, responsable de EnSeñas, es quien decide cómo se usan los datos descritos en este aviso. Para cualquier duda puedes escribir a ${CONTACTO}.`,
      ],
    },
    {
      titulo: '2. Qué datos usamos',
      parrafos: ['Cuando practicas una seña, la app usa la cámara y obtiene de cada imagen:'],
      puntos: [
        'Puntos de la mano: 21 coordenadas por mano y si es la izquierda o la derecha.',
        'Puntos del cuerpo: 33 coordenadas que indican la posición de la cara, los hombros y los brazos.',
        'Datos de la sesión: la seña que practicas, el tamaño de la imagen y el momento de cada captura.',
        'Identificadores técnicos: un identificador de participante, un identificador del dispositivo (modelo del teléfono más un código al azar) y la versión de la app.',
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
      titulo: '5. Dónde se procesan y con quién se comparten',
      parrafos: [
        'Los puntos se envían al servicio de EnSeñas, que evalúa la seña y responde al momento.',
        'No compartimos ni vendemos tus datos a terceros.',
        'Los videos de las señas se reproducen desde YouTube. Cuando reproduces uno, tu teléfono se conecta a YouTube, que aplica su propia política de privacidad.',
      ],
    },
    {
      titulo: '6. Qué se guarda en tu teléfono',
      puntos: [
        'Tus preferencias de la app.',
        'El identificador del dispositivo.',
        'Si ya viste el recorrido de bienvenida.',
      ],
      nota: 'Todo esto se borra al desinstalar la app. Tu progreso no se guarda: se reinicia cada vez que cierras la app.',
    },
    {
      titulo: '7. Permisos que pide la app',
      puntos: [
        'Cámara: para ver tus manos mientras practicas.',
        'Red: para conectarse al servicio que evalúa las señas.',
      ],
      nota: 'Puedes retirar estos permisos desde los ajustes del teléfono; sin la cámara no es posible practicar.',
    },
    {
      titulo: '8. Tus derechos',
      parrafos: [
        `Puedes pedir que te digamos qué datos tuyos tenemos, que los corrijamos o eliminemos, y oponerte a su uso (derechos ARCO), así como retirar tu consentimiento. Escribe a ${CONTACTO}.`,
      ],
    },
    {
      titulo: '9. Cambios a este aviso',
      parrafos: ['Si este aviso cambia, publicaremos la nueva versión en esta misma pantalla con su fecha de actualización.'],
    },
  ],
};
