#!/usr/bin/env bash
# verificar-url-sembrada.sh — la prueba de la URL sembrada, contra todo lo del curso que
# recibe una dirección.
#
# Por qué existe: el alta aceptaba «http://usuario:clave@127.0.0.1:1/estado?token=SECRETO#x».
# El esquema del navegador (`urlHttp`, lecciones 7 a 9) la daba por buena y la normalizaba con
# la clave dentro, y el servidor de práctica (lecciones 4 a 9) respondía 201. La regla del curso:
# una dirección con usuario o clave se rechaza al leerla, con un mensaje propio que no la repite,
# y ninguna respuesta, error ni bitácora repite sus secretos.
#
# Cómo:
#   * Esquemas: corre herramientas/url-sembrada/sembrada.test.ts con el runner de Node contra
#     el `esquema.ts` de los revisores 7 a 9 y contra la figura 2 de la lección 7 (que tiene su
#     propia copia de `urlHttp`). Las pruebas se cuentan del reporte del runner.
#   * Servidor de práctica (revisores 4 a 9): lo arranca, da de alta la URL sembrada y exige un
#     400 que no repita secretos; luego pide /api/estados y revisa que tampoco estén ahí ni en
#     su bitácora.
#   * Ningún archivo de programas/ trae una URL con usuario o clave.
#
# Es OBLIGATORIA y FALLA CERRADO: la corrida del curso (.github/workflows/verificar.yml) la
# llama y se pone roja si este guion falta, si algo sale rojo, o si corrió en menos piezas de
# las que el curso tiene. Viaja a la copia publicada (git archive) y ahí mide lo mismo: no
# necesita dependencias instaladas, solo Node 24 (que ejecuta .ts sin compilar) y curl.
#
# Uso: herramientas/verificar-url-sembrada.sh   (desde cualquier carpeta).
#      Sale 0 si todo cuadra, 1 si algo no, 2 si no pudo medir.
set -uo pipefail
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ" || exit 2
PRUEBA="$RAIZ/herramientas/url-sembrada/sembrada.test.ts"
ESQUEMAS_ESPERADOS=4
SERVIDORES_ESPERADOS=6
PRUEBAS_POR_ESQUEMA=3
CON_CLAVE='http://usuario:clave@127.0.0.1:1/estado?token=SECRETO#x'
PUERTO="${PUERTO_URL_SEMBRADA:-18093}"

[ -f "$PRUEBA" ] || { echo "❌ falta herramientas/url-sembrada/sembrada.test.ts: la prueba de la URL sembrada es obligatoria"; exit 1; }
command -v node >/dev/null || { echo "❌ falta node"; exit 2; }
command -v curl >/dev/null || { echo "❌ falta curl"; exit 2; }

TEMPORAL="$(mktemp -d)"
PID_SERVIDOR=""
limpiar() { [ -n "$PID_SERVIDOR" ] && kill "$PID_SERVIDOR" 2>/dev/null; rm -rf "$TEMPORAL"; }
trap limpiar EXIT

tiene_secreto() { grep -qF -e 'usuario:clave' -e 'SECRETO' -e 'token=' -e '#x' "$1"; }
esquemas=0; servidores=0; rojas=0

# ─── los esquemas ───────────────────────────────────────────────────────────────────────
probar_esquema() { # $1 etiqueta, $2 módulo que exporta urlHttp
  echo "esquema: $1"
  ( cd "$TEMPORAL" && URL_SEMBRADA_MODULO="$2" node --test --test-reporter=spec "$PRUEBA" ) >"$TEMPORAL/prueba.log" 2>&1
  local pasan fallan
  pasan=$(sed -n 's/^ℹ pass \([0-9]*\)$/\1/p' "$TEMPORAL/prueba.log")
  fallan=$(sed -n 's/^ℹ fail \([0-9]*\)$/\1/p' "$TEMPORAL/prueba.log")
  echo "  runner: pasan ${pasan:-?} · fallan ${fallan:-?} (de $PRUEBAS_POR_ESQUEMA)"
  esquemas=$((esquemas + 1))
  if [ "${pasan:-0}" != "$PRUEBAS_POR_ESQUEMA" ] || [ "${fallan:-1}" != "0" ]; then
    grep -E '✖|aceptó|repite' "$TEMPORAL/prueba.log" | head -6 | sed 's/^/        /'
    echo "  ❌ la prueba de la URL sembrada no pasó completa"; rojas=$((rojas + 1))
  fi
}

for esquema in programas/0[789]-*/revisor/src/compartido/esquema.ts; do
  [ -f "$esquema" ] || continue
  probar_esquema "$esquema" "$RAIZ/$esquema"
done
for figura in programas/07-*/fig07_02.ts; do
  [ -f "$figura" ] || continue
  # La figura es un programa suelto: se copia y se le agrega la exportación que la prueba lee.
  mkdir -p "$TEMPORAL/fig"; printf '{"type":"module"}\n' > "$TEMPORAL/fig/package.json"
  { cat "$figura"; printf '\nexport { urlHttp };\n'; } > "$TEMPORAL/fig/fig07_02.ts"
  probar_esquema "$figura" "$TEMPORAL/fig/fig07_02.ts"
done

# ─── el servidor de práctica ────────────────────────────────────────────────────────────
for servidor in programas/0[4-9]-*/revisor/servidor/practica.ts; do
  [ -f "$servidor" ] || continue
  echo "servidor: $servidor"
  servidores=$((servidores + 1))
  rojo=0; log="$TEMPORAL/servidor.log"
  PUERTO="$PUERTO" node "$servidor" >"$log" 2>&1 &
  PID_SERVIDOR=$!
  for _ in $(seq 1 50); do curl -fsS "http://127.0.0.1:$PUERTO/salud" >/dev/null 2>&1 && break; sleep 0.1; done
  codigo=$(curl -sS -o "$TEMPORAL/alta.json" -w '%{http_code}' -H 'content-type: application/json' \
    -d "{\"nombre\":\"sembrado\",\"url\":\"$CON_CLAVE\",\"timeoutMs\":1000}" \
    "http://127.0.0.1:$PUERTO/api/servicios" 2>/dev/null)
  curl -sS "http://127.0.0.1:$PUERTO/api/estados" >"$TEMPORAL/estados.json" 2>/dev/null
  kill "$PID_SERVIDOR" 2>/dev/null; wait "$PID_SERVIDOR" 2>/dev/null; PID_SERVIDOR=""
  echo "  alta: HTTP $codigo $(cat "$TEMPORAL/alta.json")"
  [ "$codigo" = 400 ] || { echo "  ❌ el alta con usuario y clave respondió $codigo, y debía ser 400"; rojo=1; }
  grep -qF '"url"' "$TEMPORAL/alta.json" || { echo "  ❌ el 400 no señala el campo url"; rojo=1; }
  for f in alta.json estados.json servidor.log; do
    tiene_secreto "$TEMPORAL/$f" && { echo "  ❌ $f repite un secreto"; rojo=1; }
  done
  [ "$rojo" -eq 0 ] || rojas=$((rojas + 1))
done

# ─── ningún programa publicado trae una URL con usuario o clave ─────────────────────────
echo "programas/ (URLs con usuario o clave escritas en el código o en los datos)"
if grep -rInE --exclude-dir=node_modules --exclude-dir=dist \
     '[a-z][a-z0-9+.-]*://[^/[:space:]"'"'"'@]+@' programas >"$TEMPORAL/urls" 2>/dev/null; then
  sed 's/^/  ❌ /' "$TEMPORAL/urls" | head -5
  rojas=$((rojas + 1))
fi

echo
if [ "$esquemas" -ne "$ESQUEMAS_ESPERADOS" ] || [ "$servidores" -ne "$SERVIDORES_ESPERADOS" ]; then
  echo "❌ URL sembrada: probé $esquemas esquemas y $servidores servidores; el curso tiene $ESQUEMAS_ESPERADOS y $SERVIDORES_ESPERADOS"
  exit 1
fi
if [ "$rojas" -ne 0 ]; then
  echo "❌ URL sembrada: $rojas comprobación(es) en rojo: algo acepta una URL con usuario o clave, o repite sus secretos"
  exit 1
fi
echo "✅ URL sembrada: $esquemas esquemas y $servidores servidores la rechazan y no repiten sus secretos"
