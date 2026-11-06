# Operaciones combinadas

Operaciones combinadas paso a paso, respetando la jerarquía de las operaciones, tal como se explica en clase en el CEPA Tetuán (Enseñanzas Iniciales II):

> En cada paso se hace la operación u operaciones que tienen prioridad, y las demás no se tocan.

**Abrir la app:** https://yowahesp.github.io/Operaciones_combinadas/

## Cómo trabaja

1. Mientras haya paréntesis o corchetes, solo se trabaja dentro de los más internos. Lo de fuera no se toca, aunque sea una multiplicación.
2. Entre ellos se hace lo que tiene más prioridad: primero multiplicaciones y divisiones; después, sumas y restas. Lo demás espera su turno.
3. Una cadena del mismo nivel (`24 : 4 · 2`, `20 − 15 + 5`) se resuelve en un solo paso, de izquierda a derecha.
4. Cuando un paréntesis o corchete queda en un solo número, sus signos desaparecen en ese mismo paso.
5. Sin agrupaciones: multiplicaciones y divisiones, y por último sumas y restas.

Cada paso tiene su color: lo que se opera se recuadra, una flecha lleva al resultado y el resultado se escribe en ese color.

Esta versión trabaja con números naturales, paréntesis y corchetes. Avisa si una resta da negativo, si una división no es exacta o si la operación está mal escrita.

## Archivos

- `index.html`: la app completa en un solo archivo, sin dependencias externas. Es lo que publica GitHub Pages.
- `motor.js`: el motor que calcula los pasos.
- `plantilla.html`: la interfaz.
- `construir.py`: monta `index.html` a partir de la plantilla, el motor y la fuente (`python3 construir.py`).
- `pruebas.js`: pruebas del motor (`node pruebas.js`), con los ejercicios de la pizarra.
- `fuentes/`: fuente Andika, de SIL International, bajo la licencia SIL Open Font License 1.1 (`fuentes/OFL.txt`).
