# Créditos de medios

## Animaciones 3D de letras dinámicas (J, Ñ, Q, X, Z)

`assets/signs/anim/dynamic.json` contiene puntos 3D de la mano extraídos con MediaPipe de:

> Navarrete-López, J. A.; Lopez-Nava, I. H. (CICESE). *Mexican Sign Language Alphabet (dynamic signs only)*,
> vistas frontal y de perfil (45°). Zenodo. https://doi.org/10.5281/zenodo.14689869
> Licencia: Creative Commons Attribution 4.0 International (CC BY 4.0) — https://creativecommons.org/licenses/by/4.0/

Cambios realizados: extracción de 21 puntos 3D de la mano por cuadro en ambas vistas, selección de la
ejecución más representativa por letra (medoide entre ~100 ejecuciones de 20 personas), eliminación de
detecciones falsas, interpolación de huecos, suavizado y reconstrucción de la trayectoria.

Regenerar: `scripts/landmarks/extract_dynamic.py`.
