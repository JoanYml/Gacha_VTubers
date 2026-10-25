# Pon aquí tus cinco imágenes

PNG de 3840 × 3840 píxeles. Respeta estos nombres, incluidas las mayúsculas:

| Personaje | Imagen en esta carpeta | Modelo en public/models/ |
| --- | --- | --- |
| Gabu Yml | Modelo_01.png | Modelo_01.vrm |
| AntiliaVT | Modelo_02.png | Modelo_02.vrm |
| DuraznoKyun | Modelo_03.png | Modelo_03.vrm |
| NadaLaPiñata | Modelo_04.png | Modelo_04.vrm |
| Yuzu | Modelo_05.png | Modelo_05.vrm |

No hace falta convertir las imágenes a WebP ni usar el importador. Guarda los archivos y recarga el juego. Se usan en las miniaturas, la colección, el resumen y como ilustración mientras carga el VRM o si aún no está disponible.

Las miniaturas recortan la imagen al contenedor; el visor muestra la imagen completa sin deformarla. Se conserva el PNG original; si tiene transparencia, se respeta. El banner sigue en public/images/banner.png.

Los archivos de esta carpeta tienen prioridad sobre retratos importados anteriormente en el navegador. Si faltan, se intenta usar el retrato importado o el WebP anterior antes del placeholder.
