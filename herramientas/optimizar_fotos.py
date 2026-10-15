"""Prepara el contenido antes de cada commit.

1. Revisa que los archivos de data/*.json no tengan errores (una coma de más rompe la página).
2. Toma las fotos nuevas de fotos-originales/ y las deja en assets/fotos/ como WebP:
   - achicadas a 1200 px del lado más largo,
   - con la rotación del celular corregida,
   - SIN metadatos (se borra la ubicación GPS, el modelo del celular, etc.).
3. Avisa si un recuerdo nombra una foto que no existe.
4. Recuerda cuántos textos de ejemplo [REEMPLAZAR] quedan (no frena el commit).

Lo corre solo el hook de git (herramientas/hooks/pre-commit). También se puede correr a mano:
    python herramientas/optimizar_fotos.py
"""

import json
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ORIGINALES = RAIZ / "fotos-originales"
DESTINO = RAIZ / "assets" / "fotos"
DATOS = RAIZ / "data"

LADO_MAXIMO = 1200
CALIDAD = 78
EXTENSIONES = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}


def revisar_json():
    errores = []
    for archivo in sorted(DATOS.glob("*.json")):
        try:
            json.loads(archivo.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            errores.append(f"  {archivo.relative_to(RAIZ)}: linea {e.lineno}, columna {e.colno} ({e.msg})")
    return errores


def fotos_pendientes():
    if not ORIGINALES.exists():
        return []
    pendientes = []
    for original in sorted(ORIGINALES.iterdir()):
        if original.suffix.lower() not in EXTENSIONES:
            continue
        destino = DESTINO / f"{original.stem}.webp"
        if not destino.exists() or destino.stat().st_mtime < original.stat().st_mtime:
            pendientes.append((original, destino))
    return pendientes


def optimizar(original, destino, Image, ImageOps):
    with Image.open(original) as foto:
        foto = ImageOps.exif_transpose(foto)
        foto.thumbnail((LADO_MAXIMO, LADO_MAXIMO), Image.LANCZOS)
        if foto.mode not in ("RGB", "RGBA"):
            foto = foto.convert("RGB")
        # Solo se conserva el perfil de color; todo lo demás (EXIF, GPS, XMP) se descarta.
        foto.info = {k: v for k, v in foto.info.items() if k == "icc_profile"}
        foto.save(destino, "WEBP", quality=CALIDAD, method=6, exif=b"", xmp=b"")


def avisar_fotos_faltantes():
    try:
        recuerdos = json.loads((DATOS / "recuerdos.json").read_text(encoding="utf-8")).get("recuerdos", [])
    except (OSError, json.JSONDecodeError):
        return
    for recuerdo in recuerdos:
        nombre = recuerdo.get("foto")
        if not nombre or recuerdo.get("_placeholder"):
            continue
        # Puede estar como <nombre>.webp (script) o con su nombre tal cual (subida desde el admin).
        if not (DESTINO / f"{Path(nombre).stem}.webp").exists() and not (DESTINO / nombre).exists():
            print(f"Aviso: el recuerdo \"{recuerdo.get('titulo')}\" usa la foto {nombre}, "
                  f"pero no esta en fotos-originales/. Se va a ver un dibujo de flor en su lugar.")


def avisar_placeholders():
    pendientes = []
    for archivo in sorted(DATOS.glob("*.json")):
        cantidad = archivo.read_text(encoding="utf-8").count("[REEMPLAZAR]")
        if cantidad:
            pendientes.append(f"{archivo.name} ({cantidad})")
    if pendientes:
        print("Recordatorio: quedan textos de ejemplo [REEMPLAZAR] en " + ", ".join(pendientes))


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    agregar_a_git = "--git-add" in sys.argv

    errores = revisar_json()
    if errores:
        print("Hay un error en un archivo de datos:")
        print("\n".join(errores))
        print("Arreglalo y volve a intentar el commit. (Suele ser una coma de mas o de menos.)")
        return 1

    pendientes = fotos_pendientes()
    if pendientes:
        try:
            from PIL import Image, ImageOps
        except ImportError:
            print("Hay fotos nuevas pero falta Pillow. Instalalo una vez con:  python -m pip install pillow")
            return 1
        if any(o.suffix.lower() in (".heic", ".heif") for o, _ in pendientes):
            try:
                from pillow_heif import register_heif_opener
                register_heif_opener()
            except ImportError:
                print("Hay fotos HEIC (iPhone). Instala el soporte una vez con:  python -m pip install pillow-heif")
                return 1

        DESTINO.mkdir(parents=True, exist_ok=True)
        for original, destino in pendientes:
            try:
                optimizar(original, destino, Image, ImageOps)
            except Exception as e:  # noqa: BLE001 — queremos un mensaje claro, sea cual sea el error
                print(f"No pude procesar {original.name}: {e}")
                return 1
            antes = original.stat().st_size // 1024
            despues = destino.stat().st_size // 1024
            print(f"Foto lista: {original.name} -> assets/fotos/{destino.name} ({antes} KB -> {despues} KB)")

        if agregar_a_git:
            subprocess.run(["git", "add", "--", *[str(d) for _, d in pendientes]], cwd=RAIZ, check=True)

    avisar_fotos_faltantes()
    avisar_placeholders()
    return 0


if __name__ == "__main__":
    sys.exit(main())
