# JhonyCar - Sistema de Gestao para Auto Eletrica

O JhonyCar e um sistema SaaS para oficinas de auto eletrica, criado para centralizar o atendimento do cliente do inicio ao fim: cadastro, veiculos, ordens de servico, orcamentos, financeiro, agenda e notas fiscais simuladas.

Stack principal:

- Backend: Java 17 + Spring Boot + PostgreSQL + Redis
- Frontend: React + TypeScript + Vite
- Infra: Docker Compose

## Documentacao completa

Leia o guia completo em:

- [docs/DOCUMENTACAO_COMPLETA.md](docs/DOCUMENTACAO_COMPLETA.md)

## Execucao rapida

```powershell
docker compose up --build -d
```

URLs principais:

- Frontend: `http://localhost:5173`
- API (via proxy seguro): `http://localhost:5173/api`

Credenciais iniciais:

- `admin` / `admin123` (ADMIN)
- `funcionario` / `func123` (FUNCIONARIO)
