"""Monta index.html: plantilla + motor + fuente Andika (OFL) incrustada."""
import base64, pathlib, sys
aqui = pathlib.Path(__file__).parent
fuentes = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else aqui / 'fuentes'
html = (aqui / 'plantilla.html').read_text(encoding='utf-8')
motor = (aqui / 'motor.js').read_text(encoding='utf-8')
for peso in ('400', '700'):
    b64 = base64.b64encode((fuentes / f'andika-latin-{peso}-normal.woff2').read_bytes()).decode()
    html = html.replace(f'/*FUENTE{peso}*/', b64)
html = html.replace('/*MOTOR*/', motor)
assert '/*' + 'FUENTE' not in html and '/*MOTOR*/' not in html
(aqui / 'index.html').write_text(html, encoding='utf-8')
print('index.html', len(html.encode()) // 1024, 'KB')
