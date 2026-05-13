# JhonyCar Frontend

Frontend SaaS em React + TypeScript + Vite, integrado ao backend Spring Boot.

## Stack

- React + TypeScript
- Vite
- Axios
- React Router DOM
- Zustand
- TailwindCSS
- React Hook Form + Zod

## Rodar local

```powershell
cd frontend
cmd /c npm install
cmd /c npm run dev
```

A aplicacao sobe em `http://localhost:5173`.

## Build

```powershell
cd frontend
cmd /c npm run build
```

## Configuracao da API

Opcionalmente, crie `.env` dentro de `frontend/`:

```bash
VITE_API_BASE_URL=http://localhost:8080
```

## Rotas

- `/login`
- `/dashboard`
- `/clientes`
- `/clientes/:id`
- `/veiculos`
- `/ordens-servico`
- `/financeiro`
- `/agenda`
- `/notas`
