# VTuber Wishes ✦

Gacha web gratuito de cinco VTubers, con Vite, Three.js y @pixiv/three-vrm.

## Ejecutar

Requiere Node.js 22 o 24 y npm.

```sh
npm ci
npm run dev
```

`npm run build` compila a `dist/`. `npm test` verifica recompensas, garantía, duplicados y recuperación del guardado.

## Tus modelos

Coloca estos archivos en **public/models/**, respetando mayúsculas:

| Personaje | Archivo |
| --- | --- |
| Gabu Yml | Modelo_01.vrm |
| AntiliaVT | Modelo_02.vrm |
| DuraznoKyun | Modelo_03.vrm |
| NadaLaPiñata | Modelo_04.vrm |
| Yuzu | Modelo_05.vrm |

Se interpretó `Modelo_03vrm` como `Modelo_03.vrm`. El visor carga modelos VRM 0.x y 1.0 al abrir un personaje o conseguirlo. Incluye iluminación, control orbital y animación de respiración/brazos con variación por personaje. Si falta el modelo, muestra un placeholder. Las animaciones no son archivos de motion capture ni clips VRMA.

## Banner y miniaturas

Guarda la imagen adjunta de tu mensaje como **public/images/banner.png**. Esta sesión no recibió una ruta descargable de esa imagen, por lo que el juego incluye arte provisional y carga automáticamente ese archivo cuando lo añadas.

Puedes sustituir las cinco miniaturas provisionales añadiendo `gabu.webp`, `antilia.webp`, `durazno.webp`, `nada.webp` y `yuzu.webp` en **public/images/**. Usa imágenes que tengas permiso para utilizar. La configuración de personajes está en `src/gacha.js`.

## Reglas

- Un único banner permanente con los cinco personajes de 5 estrellas.
- 160 cristales por deseo, 1600 por diez. El botón + regala 1600; no hay dinero real.
- 5 % de personaje por deseo, con igual probabilidad entre los cinco. Máximo 80 deseos entre personajes; la garantía se reinicia al obtener cualquiera.
- Fuera de la garantía: 57 % de materiales de 3 estrellas y 38 % de materiales de 4 estrellas.
- Los duplicados se acumulan. Colección, saldo, garantía y últimas 100 recompensas se guardan en localStorage de este navegador.
- Es una demo local: no tiene cuentas, servidor, pagos ni protección contra editar el guardado.

La interfaz usa fuentes de Google con alternativas locales si no hay conexión. Los modelos reales deben verificarse al subirlos; no se incluyen en el repositorio.
