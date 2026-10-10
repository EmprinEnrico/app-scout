# Scout Journey

Scout Journey aiuta a scrivere obiettivi, organizzarli in aree e fasi e segnare i progressi. L’app è sviluppata in React, TypeScript e Vite. La stessa build web alimenta la PWA e i progetti Capacitor per iOS e Android.

Il codice attivo si trova in [`web/`](web/). La ricostruzione vive nel branch `rebuild/react-capacitor`; la versione precedente rimane recuperabile nella cronologia Git. Per le decisioni tecniche e le regole del prodotto, consulta [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) e [`docs/PRODUCT.md`](docs/PRODUCT.md).

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

Gli obiettivi sono salvati localmente sul dispositivo. Nelle impostazioni è disponibile l'esportazione/importazione dei dati. La vecchia versione resta disponibile nel branch principale fino alla decisione sul merge.
