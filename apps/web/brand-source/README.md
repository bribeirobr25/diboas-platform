# Brand source files (NOT served)

The four official brand PNGs (~900 KB each), moved out of `public/` on 2026-07-16
(F-BRAND) so no heavy source is fetchable. All shipped brand assets are pre-optimized
derivatives committed under `public/assets/logos/` + `public/icons/`, generated with
sharp (background-keyed transparent wordmarks, quantized icon set, 256px monogram).
Regeneration: see the F-BRAND entry in `docs/tech/implementation-notes.md`.
Naming caution: "light-palette" = FOR light surfaces (dark ink); derivatives use the
unambiguous `-onlight` / `-ondark` suffixes.
