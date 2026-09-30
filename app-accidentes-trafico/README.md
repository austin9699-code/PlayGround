# RECON · App de cálculos de accidentes de tráfico

App web estática (sin dependencias, funciona offline en campo) para reconstrucción pericial.

## Uso
Abre `index.html` en el navegador, o sirve la carpeta:
```bash
python3 -m http.server 8000 --directory app-accidentes-trafico
```

## Módulos
1. **Huella de frenado** → `v = 3,6·√(2·g·d·(μ·k ± i))` (+ inversa distancia).
2. **Atropello** → Searle `v = 3,6·√(2·μ·g·d/(1+μ²))` (mínima) y método simple.
3. **Curva crítica** → con/sin peralte `Vc = 3,6·√(g·R·(μ+e)/(1−μ·e))`.
4. **Caída / proyección** → `t=√(2h/g)`, `v=√(2gh)`, `v₀=L/t`.
5. **Detención** → reacción + frenada, con inversa (velocidad máx. para una distancia).
6. **Colisión** → cantidad de movimiento inelástica + energía cinética.
7. **Ayuda** → tablas de μ y tiempos de reacción.

## Notas
- g = 9,81 m/s². Historial en `localStorage`, informe copiable e imprimible a PDF.
- Valores orientativos: justificar μ y método en el dictamen pericial.
