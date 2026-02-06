# Lokal Utvikling - Biltrio

## Metode 1: Vercel CLI (Anbefalt)

Vercel CLI simulerer Vercel-miljøet lokalt og kjører serverless functions.

### Installasjon:
```bash
npm install -g vercel
```

### Kjør lokalt:
```bash
vercel dev
```

Dette starter en lokal server på `http://localhost:3000` som:
- ✅ Kjører alle HTML/CSS/JS-filer
- ✅ Kjører `/api/proxy` serverless function
- ✅ Simulerer produksjonsmiljøet nøyaktig

---

## Metode 2: Alternativ med Node.js lokal server

Hvis du ikke vil bruke Vercel CLI, kan du bruke den lokale proxy-serveren.

### Kjør lokal proxy:
```bash
node local-dev-server.js
```

Dette starter en enkel server på `http://localhost:3000`.

---

## Testing

1. **Start utviklingsserver** (metode 1 eller 2)
2. **Åpne nettleseren** på `http://localhost:3000`
3. **Test bilsidene:**
   - Forsiden: `http://localhost:3000/`
   - Alle biler: `http://localhost:3000/biler.html`
   - Bildetaljer: Klikk på en bil fra oversikten

---

## Feilsøking

### Problem: `/api/proxy` gir 404
**Løsning:** Du må bruke `vercel dev`, ikke vanlig HTTP-server.

### Problem: CORS-feil
**Løsning:** Sjekk at proxy-serveren kjører og at `/api/proxy` responderer.

### Problem: Ingen biler vises
**Løsning:**
1. Åpne Console i nettleseren (F12)
2. Sjekk for feilmeldinger
3. Verifiser at Billink API er tilgjengelig

---

## Deployment

Når du er klar for å deploye:
```bash
git add .
git commit -m "Dine endringer"
git push
```

Vercel deployer automatisk fra GitHub! 🚀
