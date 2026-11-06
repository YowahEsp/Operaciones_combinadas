/* ==========================================================================
   Motor de operaciones combinadas — método de Yowah (CEPA Tetuán)
   «En cada paso se hace la operación u operaciones que tienen prioridad
    y las demás no se tocan.»

   Reglas implementadas:
   1. Mientras haya paréntesis o corchetes, solo se trabaja dentro de los
      más internos (los que no contienen otro). Lo de fuera no se toca.
   2. Entre todos esos, se hace el nivel de jerarquía más alto que haya:
      primero multiplicaciones y divisiones; si no hay, sumas y restas.
      Lo que tenga menos prioridad espera su turno.
   3. Una cadena del mismo nivel (24 : 4 · 2, o 20 − 15 + 5) se resuelve
      en un solo paso, de izquierda a derecha.
   4. Si un paréntesis o corchete queda en un solo número, sus signos
      desaparecen en ese mismo paso.
   5. Sin agrupaciones: multiplicaciones y divisiones, y por último
      sumas y restas.
   Versión 1: números naturales, paréntesis y corchetes, + − · :
   ========================================================================== */
const Motor = (() => {
  'use strict';

  const MAX_DIGITOS = 9;
  const MAX_PASOS = 60;

  class ErrorMates extends Error {
    constructor(msg, pos) { super(msg); this.pos = pos; }
  }

  /* ---------- Análisis léxico ---------- */
  function tokenizar(src) {
    const toks = [];
    for (let i = 0; i < src.length; i++) {
      const c = src[i];
      if (/\s/.test(c)) continue;
      if (/[0-9]/.test(c)) {
        let j = i;
        while (j < src.length && /[0-9]/.test(src[j])) j++;
        const txt = src.slice(i, j);
        if (txt.length > MAX_DIGITOS)
          throw new ErrorMates(`El número ${txt} es demasiado largo (máximo ${MAX_DIGITOS} cifras).`, i);
        toks.push({ t: 'num', v: parseInt(txt, 10), pos: i });
        i = j - 1;
        continue;
      }
      if (c === '+') { toks.push({ t: 'op', v: '+', pos: i }); continue; }
      if ('-−–—'.includes(c)) { toks.push({ t: 'op', v: '−', pos: i }); continue; }
      if ('*xX×·⋅•∙'.includes(c)) { toks.push({ t: 'op', v: '·', pos: i }); continue; }
      if (':/÷∶'.includes(c)) { toks.push({ t: 'op', v: ':', pos: i }); continue; }
      if (c === '(' || c === '[') { toks.push({ t: 'abre', v: c, pos: i }); continue; }
      if (c === ')' || c === ']') { toks.push({ t: 'cierra', v: c, pos: i }); continue; }
      if (c === '{' || c === '}')
        throw new ErrorMates('En esta versión solo se usan paréntesis ( ) y corchetes [ ].', i);
      if (c === '.' || c === ',' || c === "'")
        throw new ErrorMates('Solo números naturales: sin puntos ni comas. Para multiplicar usa · , * o x.', i);
      if (c === '^' || c === '√')
        throw new ErrorMates('En esta versión no hay potencias ni raíces.', i);
      throw new ErrorMates(`No entiendo el signo «${c}».`, i);
    }
    return toks;
  }

  /* ---------- Análisis sintáctico ----------
     Expr  = Term { (+|−) Term }
     Term  = Factor { (·|:) Factor }
     Factor = número | ( Expr ) | [ Expr ]
     Nodos:
       {t:'num', v}
       {t:'grp', k:'('|'[', e:Expr}
       {t:'expr', terms:[Term], ops:[...]}
       {t:'term', fs:[Factor], ops:[...]}                                  */
  const CIERRE = { '(': ')', '[': ']' };
  const NOMBRE = { '(': 'paréntesis', '[': 'corchete' };

  function analizar(src) {
    if (!src || !src.trim()) throw new ErrorMates('Escribe una operación.', 0);
    const toks = tokenizar(src);
    let p = 0;
    const ver = () => toks[p];
    const fin = () => p >= toks.length;

    function describir(tok) {
      if (!tok) return 'el final';
      if (tok.t === 'num') return `el ${tok.v}`;
      return `«${tok.v}»`;
    }

    function expr(ctx) {
      const e = { t: 'expr', terms: [term(ctx)], ops: [] };
      while (!fin() && ver().t === 'op' && (ver().v === '+' || ver().v === '−')) {
        e.ops.push(toks[p++].v);
        if (fin()) throw new ErrorMates(`Falta un número después de «${e.ops[e.ops.length - 1]}».`, toks[p - 1].pos);
        e.terms.push(term(ctx));
      }
      return e;
    }

    function term(ctx) {
      const t = { t: 'term', fs: [factor(ctx)], ops: [] };
      while (!fin() && ver().t === 'op' && (ver().v === '·' || ver().v === ':')) {
        t.ops.push(toks[p++].v);
        if (fin()) throw new ErrorMates(`Falta un número después de «${t.ops[t.ops.length - 1]}».`, toks[p - 1].pos);
        t.fs.push(factor(ctx));
      }
      return t;
    }

    function factor(ctx) {
      const tok = ver();
      if (!tok) throw new ErrorMates('La operación está incompleta.', src.length);
      let f;
      if (tok.t === 'num') {
        p++;
        f = { t: 'num', v: tok.v };
      } else if (tok.t === 'abre') {
        if (ctx === '(')
          throw new ErrorMates(tok.v === '('
            ? 'Dentro de un paréntesis no puede ir otro paréntesis: el de fuera debe ser un corchete [ ].'
            : 'Un corchete no puede ir dentro de un paréntesis: el corchete va por fuera.', tok.pos);
        if (ctx === '[' && tok.v === '[')
          throw new ErrorMates('Dentro de un corchete no puede ir otro corchete. En esta versión solo hay paréntesis y corchetes.', tok.pos);
        p++;
        if (!fin() && ver().t === 'cierra')
          throw new ErrorMates(`Hay un ${NOMBRE[tok.v]} vacío.`, tok.pos);
        const e = expr(tok.v);
        const c = ver();
        if (!c || c.t !== 'cierra')
          throw new ErrorMates(`Falta cerrar el ${NOMBRE[tok.v]} con «${CIERRE[tok.v]}».`, c ? c.pos : src.length);
        if (c.v !== CIERRE[tok.v])
          throw new ErrorMates(`El ${NOMBRE[tok.v]} que se abre con «${tok.v}» debe cerrarse con «${CIERRE[tok.v]}», no con «${c.v}».`, c.pos);
        p++;
        if (e.terms.length === 1 && e.terms[0].fs.length === 1) {
          const solo = e.terms[0].fs[0];
          throw new ErrorMates(solo.t === 'num'
            ? `El ${NOMBRE[tok.v]} «${tok.v}${solo.v}${CIERRE[tok.v]}» solo tiene un número: sobra.`
            : `El corchete solo contiene un paréntesis: sobra uno de los dos.`, tok.pos);
        }
        f = { t: 'grp', k: tok.v, e };
      } else if (tok.t === 'op') {
        throw new ErrorMates(p === 0
          ? 'La operación no puede empezar por un signo.'
          : `Hay dos signos seguidos: falta un número antes de «${tok.v}».`, tok.pos);
      } else {
        throw new ErrorMates(`Sobra «${tok.v}»: no hay nada que cerrar.`, tok.pos);
      }
      // Detrás de un factor debe venir un signo, un cierre o el final.
      const sig = ver();
      if (sig && (sig.t === 'num' || sig.t === 'abre'))
        throw new ErrorMates(`Falta un signo entre ${f.t === 'num' ? 'el ' + f.v : 'el ' + NOMBRE[f.k]} y ${describir(sig)}. Para multiplicar hay que escribir «·».`, sig.pos);
      return f;
    }

    const raiz = expr(null);
    if (!fin()) {
      const tok = ver();
      if (tok.t === 'cierra') throw new ErrorMates(`Sobra «${tok.v}»: no hay nada que cerrar.`, tok.pos);
      throw new ErrorMates(`No entiendo lo que hay a partir de ${describir(tok)}.`, tok.pos);
    }
    return raiz;
  }

  /* ---------- Utilidades ---------- */
  function texto(n) {           // texto plano de un nodo
    switch (n.t) {
      case 'num': return String(n.v);
      case 'grp': return n.k + texto(n.e) + CIERRE[n.k];
      case 'term': return n.fs.map((f, i) => (i ? ' ' + n.ops[i - 1] + ' ' : '') + texto(f)).join('');
      case 'expr': return n.terms.map((t, i) => (i ? ' ' + n.ops[i - 1] + ' ' : '') + texto(t)).join('');
    }
  }

  function seguro(v, desc) {
    if (!Number.isSafeInteger(v)) throw new ErrorMates(`El resultado de ${desc} es demasiado grande.`);
    return v;
  }

  function calcularTerm(t) {    // cadena de · y : de izquierda a derecha
    let v = t.fs[0].v;
    for (let i = 1; i < t.fs.length; i++) {
      const f = t.fs[i].v, op = t.ops[i - 1];
      if (op === '·') v = seguro(v * f, `${v} · ${f}`);
      else {
        if (f === 0) throw new ErrorMates(`No se puede dividir entre 0 (${v} : 0).`);
        if (v % f !== 0) throw new ErrorMates(`La división ${v} : ${f} no es exacta. En esta versión solo hay números naturales.`);
        v = v / f;
      }
    }
    return v;
  }

  function calcularExpr(e) {    // cadena de + y − de izquierda a derecha
    let v = e.terms[0].fs[0].v;
    for (let i = 1; i < e.terms.length; i++) {
      const s = e.terms[i].fs[0].v, op = e.ops[i - 1];
      if (op === '+') v = seguro(v + s, `${v} + ${s}`);
      else {
        if (s > v) throw new ErrorMates(`La resta ${v} − ${s} no se puede hacer con números naturales (el resultado sería negativo).`);
        v = v - s;
      }
    }
    return v;
  }

  function grupos(n, out = []) {
    if (n.t === 'expr') n.terms.forEach(t => grupos(t, out));
    else if (n.t === 'term') n.fs.forEach(f => grupos(f, out));
    else if (n.t === 'grp') { out.push(n); grupos(n.e, out); }
    return out;
  }
  const esInterno = g => grupos(g.e).length === 0;
  const esNumero = e => e.terms.length === 1 && e.terms[0].fs.length === 1 && e.terms[0].fs[0].t === 'num';

  // Copia el árbol aplicando sustituciones (Map nodo → nodo nuevo)
  function copiar(n, sust) {
    if (sust.has(n)) return sust.get(n);
    switch (n.t) {
      case 'num': return { t: 'num', v: n.v };
      case 'grp': return { t: 'grp', k: n.k, e: copiar(n.e, sust) };
      case 'term': return { t: 'term', fs: n.fs.map(f => copiar(f, sust)), ops: n.ops.slice() };
      case 'expr': return { t: 'expr', terms: n.terms.map(t => copiar(t, sust)), ops: n.ops.slice() };
    }
  }

  /* ---------- Un paso ----------
     Marca con .caja = id lo que se opera en `raiz` y devuelve la línea
     siguiente, donde los resultados llevan .res = id.                     */
  function paso(raiz, nPaso) {
    const todos = grupos(raiz);
    const ambito = todos.length ? 'grupo' : 'global';
    // Objetivos: [{expr, grupo|null}]
    const objetivos = ambito === 'grupo'
      ? todos.filter(esInterno).map(g => ({ e: g.e, g }))
      : [{ e: raiz, g: null }];

    const hayMul = objetivos.some(o => o.e.terms.some(t => t.fs.length > 1));
    const nivel = hayMul ? 'mul' : 'suma';
    const sust = new Map();
    const ops = [];
    let k = 0;
    const nuevoId = () => `${nPaso}-${k++}`;

    for (const o of objetivos) {
      if (nivel === 'mul') {
        for (const t of o.e.terms) {
          if (t.fs.length < 2) continue;
          const v = calcularTerm(t);
          const id = nuevoId();
          const num = { t: 'num', v, res: id };
          const desaparece = o.g && o.e.terms.length === 1;
          const marcado = desaparece ? o.g : t;
          marcado.caja = id;
          sust.set(marcado, desaparece ? num : { t: 'term', fs: [num], ops: [] });
          ops.push({ id, nodo: marcado, termino: t, v, ops: t.ops.slice(), g: o.g, grupo: o.g ? o.g.k : null, desaparece: !!desaparece });
        }
      } else {
        if (o.e.terms.length < 2) continue;
        const v = calcularExpr(o.e);
        const id = nuevoId();
        const num = { t: 'num', v, res: id };
        const marcado = o.g || o.e;
        marcado.caja = id;
        sust.set(marcado, o.g ? num : { t: 'expr', terms: [{ t: 'term', fs: [num], ops: [] }], ops: [] });
        ops.push({ id, nodo: marcado, termino: o.e, v, ops: o.e.ops.slice(), g: o.g, grupo: o.g ? o.g.k : null, desaparece: !!o.g });
      }
    }
    if (!ops.length) throw new ErrorMates('Error interno: no hay nada que hacer en este paso.');
    const siguiente = copiar(raiz, sust);
    return { ambito, nivel, ops, siguiente, completo: ops.length === 1 && ops[0].nodo === raiz };
  }

  /* ---------- Explicación de cada paso ---------- */
  function lista(xs) {
    return xs.length === 1 ? xs[0] : xs.slice(0, -1).join(', ') + ' y ' + xs[xs.length - 1];
  }
  function nombreOperacion(nivel, simbolos) {
    const set = new Set(simbolos);
    const plural = simbolos.length > 1;
    if (nivel === 'mul') {
      if (set.size > 1) return 'multiplicaciones y divisiones, de izquierda a derecha';
      return set.has('·') ? (plural ? 'las multiplicaciones' : 'la multiplicación')
                          : (plural ? 'las divisiones' : 'la división');
    }
    if (set.size > 1) return 'sumas y restas, de izquierda a derecha';
    return set.has('+') ? (plural ? 'las sumas' : 'la suma')
                        : (plural ? 'las restas' : 'la resta');
  }
  function explicar(p, habiaGrupos, unico) {
    const simbolos = p.ops.flatMap(o => o.ops);
    const que = nombreOperacion(p.nivel, simbolos);
    const resto = p.completo ? '' : ' Lo demás no se toca.';
    if (p.ambito === 'grupo') {
      const kinds = new Set(p.ops.map(o => o.grupo));
      const varios = new Set(p.ops.map(o => o.g)).size > 1;
      let donde;
      if (kinds.size > 1) donde = { s: 'los paréntesis y corchetes', d: 'de los paréntesis y corchetes' };
      else if ([...kinds][0] === '(') donde = varios ? { s: 'los paréntesis', d: 'de los paréntesis' } : { s: 'el paréntesis', d: 'del paréntesis' };
      else donde = varios ? { s: 'los corchetes', d: 'de los corchetes' } : { s: 'el corchete', d: 'del corchete' };
      if (p.nivel === 'mul')
        return `Dentro ${donde.d}, primero ${que}: ${lista(p.ops.map(o => texto(o.termino)))}.${resto}`;
      const izq = simbolos.length > p.ops.length ? ', de izquierda a derecha' : '';
      return `${varios ? 'Se resuelven' : 'Se resuelve'} ${donde.s}${izq}: ${lista(p.ops.map(o => texto(o.nodo)))}.${resto}`;
    }
    const exprs = lista(p.ops.map(o => texto(o.termino)));
    const intro = habiaGrupos ? 'Ya no quedan paréntesis ni corchetes. ' : '';
    if (p.nivel === 'mul')
      return `${intro}Primero ${que}: ${exprs}.${resto}`;
    if (unico) return `${que[0].toUpperCase() + que.slice(1)}: ${exprs}.`;
    return `Por último, ${que}: ${exprs}.`;
  }

  /* ---------- Resolución completa ---------- */
  function resolver(src) {
    const raiz = analizar(src);
    if (esNumero(raiz)) throw new ErrorMates('Escribe una operación: solo hay un número.');
    const lineas = [raiz];
    const pasos = [];
    let actual = raiz;
    while (!esNumero(actual)) {
      if (pasos.length >= MAX_PASOS) throw new ErrorMates('La operación tiene demasiados pasos.');
      const p = paso(actual, pasos.length);
      p.texto = explicar(p, grupos(raiz).length > 0, pasos.length === 0 && p.completo);
      pasos.push(p);
      actual = p.siguiente;
      lineas.push(actual);
    }
    return { lineas, pasos, resultado: actual.terms[0].fs[0].v };
  }

  return { resolver, analizar, texto, ErrorMates, NOMBRE, CIERRE };
})();

if (typeof module !== 'undefined') module.exports = Motor;
