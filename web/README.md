# Scout Journey web

App React e TypeScript di Scout Journey. Esegui `npm ci`, poi `npm run dev` per lo sviluppo locale oppure `npm run check` per lint, test e build. La build va in `../dist` per la pubblicazione privata e per Capacitor.

La logica degli obiettivi e della persistenza vive in `src/domain/`. Le schermate la utilizzano attraverso `GoalsProvider` e `useGoals`. Le istruzioni per agenti e l'architettura sono nella radice del repository.
