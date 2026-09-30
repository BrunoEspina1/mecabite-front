/**
 * Terms and conditions shown in Ajustes → Términos y condiciones.
 * A working draft: have it reviewed before publishing the app, and keep the sources in section 5 in step
 * with the content the app really uses.
 */

import { CONTACTO, RESPONSABLE, type LegalText } from '@/data/legal';

export const TERMINOS: LegalText = {
  titulo: 'Términos y condiciones de EnSeñas',
  actualizado: '30 de septiembre de 2026',
  secciones: [
    {
      titulo: '1. Aceptación',
      parrafos: [
        `Estos términos regulan el uso de EnSeñas, una aplicación de ${RESPONSABLE}. Al usar la app aceptas estos términos; si no estás de acuerdo, por favor no la uses.`,
      ],
    },
    {
      titulo: '2. Qué es EnSeñas',
      parrafos: [
        'EnSeñas es una herramienta educativa para aprender y practicar señas de la Lengua de Señas Mexicana (LSM): muestra cómo se hace cada seña y revisa con la cámara cómo la haces tú.',
      ],
      puntos: [
        'Es un apoyo para practicar. No sustituye un curso de LSM, a una persona intérprete ni la convivencia con la comunidad sorda.',
        'No otorga certificados ni acredita ningún nivel de dominio de la LSM.',
      ],
    },
    {
      titulo: '3. Uso de la app',
      puntos: [
        'La app es para uso personal y educativo.',
        'Para practicar necesitas dar permiso de cámara y tener conexión a la red.',
        'No debes usar la app para fines ilícitos, ni intentar alterar o interferir con su funcionamiento o con el servicio que evalúa las señas.',
        'Si eres menor de edad, úsala con el conocimiento de tu madre, padre o tutor.',
      ],
    },
    {
      titulo: '4. Cámara y datos',
      parrafos: [
        'La cámara se usa únicamente mientras practicas. EnSeñas no recolecta imágenes, fotos, video ni audio: cada imagen se analiza dentro de tu teléfono y se descarta al instante.',
        'Lo único que se utiliza son datos: los puntos de referencia de tus manos y de tu cuerpo (coordenadas numéricas) y datos técnicos de la sesión de práctica. Con esos puntos no es posible reconstruir tu imagen.',
      ],
      nota: 'El detalle de qué datos se usan y para qué está en el Aviso de privacidad, disponible en Ajustes.',
    },
    {
      titulo: '5. Fuentes del contenido',
      parrafos: [
        'Las señas que enseña EnSeñas están basadas en la Lengua de Señas Mexicana tal como la documenta el Gobierno de la Ciudad de México en el Glosario Digital de LSM del Instituto de las Personas con Discapacidad (INDISCAPACIDAD). Los videos de las señas pertenecen a ese glosario y se reproducen desde el canal de YouTube de INDISCAPACIDAD CDMX.',
        'El reconocimiento de señas se apoya en bases de datos públicas del alfabeto de la LSM, publicadas en Zenodo con licencia Creative Commons Atribución 4.0 (CC BY 4.0):',
      ],
      puntos: [
        '«Mexican Sign Language Alphabet (static signs only)», de Ricardo Morfín (2023). DOI: 10.5281/zenodo.10067509.',
        '«Mexican Sign Language Alphabet (dynamic signs only)», de Jesús Antonio Navarrete-López e Irvin Hussein Lopez-Nava (2025). DOI: 10.5281/zenodo.14689869.',
        'Ilustraciones de manos: Designed by Freepik.',
      ],
      enlaces: [
        { texto: 'Glosario Digital de LSM · INDISCAPACIDAD CDMX', url: 'https://lsm.indiscapacidad.cdmx.gob.mx/ejes/educacion/' },
        { texto: 'Alfabeto de la LSM, señas estáticas · Zenodo', url: 'https://zenodo.org/records/10067509' },
        { texto: 'Alfabeto de la LSM, señas dinámicas · Zenodo', url: 'https://zenodo.org/records/14689869' },
      ],
      nota: 'EnSeñas es un proyecto independiente: no está afiliada al Gobierno de la Ciudad de México, a INDISCAPACIDAD ni a las personas autoras de esas bases de datos, ni cuenta con su aval.',
    },
    {
      titulo: '6. Evaluación automática',
      puntos: [
        'La revisión de tus señas la hace un sistema automático y puede equivocarse: puede dar por buena una seña mal hecha o marcar como incorrecta una bien hecha.',
        'La LSM tiene variantes regionales. Una seña distinta a la que muestra la app no es necesariamente incorrecta.',
        'La iluminación, el encuadre y la cámara de tu teléfono influyen en el resultado.',
      ],
    },
    {
      titulo: '7. Tu progreso',
      parrafos: [
        'La app no tiene cuentas ni perfiles. Tu progreso se muestra mientras la app está abierta y se reinicia cada vez que la cierras.',
      ],
    },
    {
      titulo: '8. Propiedad intelectual',
      parrafos: [
        `El diseño, el código y los textos propios de EnSeñas pertenecen a ${RESPONSABLE}. Los videos, las bases de datos, las ilustraciones y demás materiales de terceros pertenecen a sus titulares y se usan conforme a sus licencias.`,
      ],
    },
    {
      titulo: '9. Disponibilidad y responsabilidad',
      puntos: [
        'La app se ofrece «tal cual». Hacemos lo posible por que funcione bien, pero no garantizamos que esté disponible en todo momento ni libre de errores.',
        'Los videos dependen de YouTube y del glosario de origen: pueden dejar de estar disponibles sin previo aviso.',
        'En la medida que la ley lo permita, no somos responsables de los daños que resulten del uso de la app o de no poder usarla.',
      ],
    },
    {
      titulo: '10. Cambios a estos términos',
      parrafos: ['Si estos términos cambian, publicaremos la nueva versión en esta misma pantalla con su fecha de actualización.'],
    },
    {
      titulo: '11. Contacto y ley aplicable',
      parrafos: [
        `Para cualquier duda sobre estos términos puedes escribir a ${CONTACTO}. Estos términos se rigen por las leyes aplicables en México.`,
      ],
    },
  ],
};
