# SafeCode Frontend

Next.js 16 dashboard for the SafeCode AI Security Swarm.

## Pages

| Route | Description |
|---|---|
| `/` | Dashboard — stats, vulnerability chart, leaderboard, live terminal, model usage |
| `/admin` | Settings — swarm control, AI model selection, API key management |
| `/repositories` | Repository list — all scanned codebases with quality scores |

## Stack

- **Next.js 16** (App Router) with standalone output for Docker
- **React 19** with Framer Motion animations
- **Tailwind CSS v4** with a custom dark design system
- **Recharts** for data visualization
- **Lucide React** for icons
- **Outfit** body font + **JetBrains Mono** for data/code

## Development

```bash
npm install
npx next dev
```

Open [http://localhost:3000](http://localhost:3000).

The frontend expects the backend API at `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000`).

## Docker

```bash
docker build -t safecode-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://localhost:8000 safecode-frontend
```
