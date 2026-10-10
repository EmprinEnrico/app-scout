# Scout Journey

Scout Journey aiuta a scrivere obiettivi, organizzarli in aree e fasi e segnare i progressi. L’app è sviluppata in React, TypeScript e Vite. La stessa build web alimenta la PWA e i progetti Capacitor per iOS e Android.

Il codice attivo si trova in [`web/`](web/), nel branch `main`. La versione precedente rimane recuperabile nella cronologia Git. Per le decisioni tecniche consulta [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md); per la direzione del prodotto e le sue basi di ricerca, consulta [`docs/PRODUCT.md`](docs/PRODUCT.md) e [`docs/RESEARCH.md`](docs/RESEARCH.md).

## Avvio

```bash
cd web
npm ci
npm run dev
```

## Verifica e build

```bash
cd web
npm run check
```

La build statica viene scritta in `dist/` alla radice del repository. `.openai/hosting.json` collega tale directory alla Site privata.

## Dati

Gli obiettivi sono salvati localmente sul dispositivo. Nelle impostazioni è disponibile l'esportazione/importazione dei dati. La vecchia versione resta recuperabile dalla cronologia Git.
