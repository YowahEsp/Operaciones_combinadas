const M = require('./motor.js');
let fallos = 0, total = 0;
const plano = s => s.replace(/\s+/g, '');

function lineas(src) { return M.resolver(src).lineas.map(l => plano(M.texto(l))); }
function cajas(src) {   // por paso: textos de lo recuadrado
  return M.resolver(src).pasos.map(p => p.ops.map(o => plano(M.texto(o.nodo))));
}
function igual(nombre, a, b) {
  total++;
  const ok = JSON.stringify(a) === JSON.stringify(b);
  if (!ok) { fallos++; console.log('✗', nombre, '\n   obtenido:', JSON.stringify(a), '\n   esperado:', JSON.stringify(b)); }
  else console.log('✓', nombre);
}
function error(nombre, src, trozo) {
  total++;
  try { M.resolver(src); fallos++; console.log('✗', nombre, '— no dio error'); }
  catch (e) {
    if (!(e instanceof M.ErrorMates) || !e.message.includes(trozo)) { fallos++; console.log('✗', nombre, '—', e.message); }
    else console.log('✓', nombre, '→', e.message);
  }
}

/* ---- Pizarrón 1, ejercicio d ---- */
const d = '3·(12−7) − [15 − 2·(7−4)]';
igual('d) líneas', lineas(d), ['3·(12−7)−[15−2·(7−4)]', '3·5−[15−2·3]', '3·5−[15−6]', '3·5−9', '15−9', '6']);
igual('d) recuadros', cajas(d), [['(12−7)', '(7−4)'], ['2·3'], ['[15−6]'], ['3·5'], ['15−9']]);

/* ---- Pizarrones 2 y 3, ejercicio e ---- */
const e = '40 − [5·4 − 3·(2+3) + 5]·3';
igual('e) líneas', lineas(e), ['40−[5·4−3·(2+3)+5]·3', '40−[5·4−3·5+5]·3', '40−[20−15+5]·3', '40−10·3', '40−30', '10']);
igual('e) recuadros', cajas(e), [['(2+3)'], ['5·4', '3·5'], ['[20−15+5]'], ['10·3'], ['40−30']]);

/* ---- Respuestas de Yowah ---- */
// 2: lo de menos prioridad espera aunque esté en otro paréntesis
igual('prioridad entre paréntesis', lineas('(2+3·4) − (9−5)'), ['(2+3·4)−(9−5)', '(2+12)−(9−5)', '14−4', '10']);
igual('prioridad: cajas', cajas('(2+3·4) − (9−5)'), [['3·4'], ['(2+12)', '(9−5)'], ['14−4']]);
// 3: cadena del mismo nivel en un paso
igual('24:4·2 en un paso', lineas('24:4·2'), ['24:4·2', '12']);
igual('20−15+5 en un paso', lineas('20-15+5'), ['20−15+5', '10']);
// Lo de fuera espera aunque sea multiplicación
igual('fuera espera', lineas('2·3 + (4+1)'), ['2·3+(4+1)', '2·3+5', '6+5', '11']);
igual('fuera espera dentro de corchete', lineas('[2·3 + (4−1)]·2'), ['[2·3+(4−1)]·2', '[2·3+3]·2', '[6+3]·2', '9·2', '18']);
// Corchete que queda en un número al multiplicar: desaparece en ese paso
igual('[2·3] desaparece', lineas('10 − [2·3]'), ['10−[2·3]', '10−6', '4']);
igual('[2·3] caja incluye corchete', cajas('10 − [2·3]'), [['[2·3]'], ['10−6']]);
// Corchete sin paréntesis dentro
igual('corchete simple', lineas('[8 − 3]·2 + 1'), ['[8−3]·2+1', '5·2+1', '10+1', '11']);
// Signos alternativos
igual('signos alternativos', lineas('3*(12-7) - [15 - 2x(7-4)]'), lineas(d));
igual('división con /', lineas('12/3+1'), ['12:3+1', '4+1', '5']);
// Varios términos de mult. a la vez
igual('varias multiplicaciones', cajas('2·3 + 4·5 − 6:2'), [['2·3', '4·5', '6:2'], ['6+20−3']]);

/* ---- Errores ---- */
error('resta negativa', '3 − 5 + 4', 'naturales');
error('división no exacta', '7 : 2', 'no es exacta');
error('división entre cero', '5 : (3−3)', 'entre 0');
error('falta signo', '3(4+1)', 'Falta un signo');
error('paréntesis dentro de paréntesis', '((1+2)·3)', 'Dentro de un paréntesis');
error('corchete dentro de paréntesis', '([1+2]·3)', 'corchete no puede ir dentro');
error('corchete dentro de corchete', '[[1+2]·3]', 'otro corchete');
error('paréntesis de un número', '2 + (3)', 'solo tiene un número');
error('corchete con solo un paréntesis', '[(2+3)]', 'sobra uno');
error('mal cerrado', '[2+3)', 'debe cerrarse');
error('sin cerrar', '(2+3', 'Falta cerrar');
error('sobra cierre', '2+3)', 'Sobra');
error('empieza por signo', '−3+5', 'empezar por un signo');
error('dos signos', '3++5', 'dos signos');
error('acaba en signo', '3+', 'Falta un número');
error('decimales', '3,5+1', 'naturales');
error('llaves', '{2+3}', 'llaves'.length ? 'corchetes' : '');
error('vacío', '   ', 'Escribe');
error('solo un número', '25', 'solo hay un número');
error('paréntesis vacío', '3+()', 'vacío');
error('letras', '3+a', 'No entiendo');

/* ---- Explicaciones ---- */
for (const src of [d, e, '(2+3·4) − (9−5)', '24:4·2 + 1', '10 − [2·3]']) {
  console.log('\n' + src);
  M.resolver(src).pasos.forEach((p, i) => console.log(`  Paso ${i + 1}: ${p.texto}`));
}

console.log(`\n${total - fallos}/${total} pruebas correctas`);
process.exit(fallos ? 1 : 0);
