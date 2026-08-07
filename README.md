# Alfabeto Oculto (Next.js)

Site em Next.js (App Router) + TypeScript + Tailwind.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000

## Estrutura de páginas
- `/` — Menu Principal (imagem, cards de navegação, redes sociais)
- `/alfabeto` — tradutor com a fonte Fluxya
- `/calendario` — lista pública dos eventos do Grudge SMP
- `/enigmas` — lista de charadas (edite direto em `app/enigmas/page.tsx`)
- `/admin/login` — login do painel administrativo
- `/admin/calendario` — painel pra adicionar/remover eventos (protegido por login)

## Painel administrativo do calendário

**Login padrão:** usuário `admin`, senha `admin123`.

⚠️ Troque isso antes de publicar o site de verdade! Copie `.env.example` para
`.env.local` e defina `ADMIN_USER` e `ADMIN_PASSWORD` com as suas credenciais.

No painel dá pra:
- **Calendário** (`/admin/calendario`) — adicionar eventos com título, data, descrição e imagem, e remover os que já existem
- **Enigmas** (`/admin/enigmas`) — adicionar, editar (clique no título pra expandir) e remover charadas
- **Logs** (`/admin/logs`) — ver o histórico de tudo que foi feito no painel (login, logout, eventos e enigmas adicionados/editados/removidos), com data e hora

Os dados ficam salvos em `data/events.json`, `data/riddles.json` e
`data/logs.json`, e as imagens em `public/uploads/events/`.

**Importante sobre hospedagem:** esse sistema salva os dados como arquivos no
próprio servidor. Funciona bem em hospedagens com sistema de arquivos
persistente, como o Discloud (mesmo lugar do painel-discord). **Não funciona**
em hospedagens serverless (como a Vercel), porque lá o sistema de arquivos é
apagado a cada novo deploy — nesse caso seria preciso migrar pra um banco de
dados (dá pra reaproveitar o Supabase que você já usa no painel-discord, é só
avisar que eu adapto).

## Terminando a personalização

### 1. Fonte
Já está usando a fonte real `Fluxya-Regular.ttf` (`public/assets/custom-font.ttf`).
Se quiser trocar por outra, é só substituir esse arquivo.

### 2. Música
- Áudio em `public/assets/musica.mp3`, capa em `public/assets/cover.jpg`.
- Nome da música: editável em `components/Player.tsx`, constante `songName`.

### 3. Imagem principal e redes sociais (Menu Principal)
- Troque `public/assets/hero-placeholder.svg` pela sua imagem (pode ser
  `.jpg`/`.png` — só atualize o `src` em `app/page.tsx`).
- Troque os links `#` pelos perfis reais em `components/SocialIcons.tsx`
  (Instagram, Discord, TikTok, X).

### 4. Enigmas
Edite o array `RIDDLES` em `app/enigmas/page.tsx` com as charadas de vocês.

## Deploy
Publique do mesmo jeito que o painel-discord (Discloud) ou em qualquer host
Next.js com sistema de arquivos persistente. 
