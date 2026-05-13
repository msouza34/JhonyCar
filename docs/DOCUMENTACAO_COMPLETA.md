# Documentacao Completa do Sistema JhonyCar

Data desta documentacao: 2026-05-11

## 1. Visao geral

JhonyCar e um sistema SaaS para gestao de auto eletrica com foco em:

- Cadastro de clientes e veiculos
- Fluxo de ordem de servico (OS)
- Orcamentos com itens de servico e peca
- Financeiro (manual e automatico por OS finalizada)
- Nota fiscal simulada com geracao de PDF
- Agenda de atendimentos
- Dashboard gerencial
- Integracao de links para WhatsApp
- Catalogo de modelos de veiculo com suporte FIPE

## 2. Arquitetura e stack

## 2.1 Backend

- Java 17
- Spring Boot 3.4.5
- Spring Web
- Spring Data JPA
- Spring Security + JWT
- Redis (cache)
- PostgreSQL
- Springdoc OpenAPI
- PDFBox

Padrao arquitetural:

- Controller
- Service
- Repository
- DTO
- Entity
- Config/Security/Exception handling

## 2.2 Frontend

- React 18 + TypeScript
- Vite
- React Router
- Axios
- Zustand
- React Hook Form + Zod
- Tailwind CSS

## 2.3 Infra e operacao

- Dockerfile backend (multi-stage Maven -> JRE)
- Dockerfile frontend (Node build -> Nginx)
- Docker Compose com backend + frontend + postgres + redis
- Colecao Postman e runner Newman

## 3. Estrutura de pastas

```text
.
|-- src/main/java/com/jhonycar/backend
|   |-- config
|   |-- controller
|   |-- dto
|   |-- entity
|   |-- exception
|   |-- integration
|   |-- repository
|   |-- security
|   `-- service
|-- src/main/resources/application.yml
|-- frontend
|   |-- src
|   |   |-- components
|   |   |-- hooks
|   |   |-- layouts
|   |   |-- pages
|   |   |-- routes
|   |   |-- services
|   |   |-- store
|   |   `-- types
|   |-- Dockerfile
|   `-- nginx.conf
|-- postman
|   |-- JhonyCar-API.postman_collection.json
|   |-- JhonyCar-Local.postman_environment.json
|   |-- run-newman.ps1
|   `-- README-newman.md
|-- docker-compose.yml
|-- Dockerfile
`-- pom.xml
```

## 4. Como rodar o sistema

## 4.1 Requisitos

- Java 17+
- Maven 3.9+
- Node 22+ (frontend)
- npm
- Docker + Docker Compose (opcional, recomendado)

## 4.2 Rodar com Docker (recomendado)

Na raiz do projeto:

```powershell
docker compose up --build -d
```

Servicos:

- Frontend: `http://localhost:5173`
- API (proxy pelo frontend): `http://localhost:5173/api`
- Backend: interno (sem exposicao de porta no host)
- Postgres: interno (sem exposicao de porta no host)
- Redis: interno (sem exposicao de porta no host)

Parar:

```powershell
docker compose down
```

Parar e remover volumes:

```powershell
docker compose down -v
```

## 4.3 Rodar local sem Docker

Backend:

```powershell
mvn spring-boot:run
```

Frontend:

```powershell
cd frontend
cmd /c npm install
cmd /c npm run dev
```

## 5. Variaveis de ambiente

## 5.1 Backend (application.yml)

| Variavel | Default | Uso |
|---|---|---|
| `PORT` | `8080` | Porta HTTP do backend |
| `DB_URL` | `jdbc:postgresql://localhost:5432/jhonycar` | Conexao PostgreSQL |
| `DB_USERNAME` | `postgres` | Usuario DB |
| `DB_PASSWORD` | sem default | Senha DB (obrigatoria via ambiente) |
| `REDIS_HOST` | `localhost` | Host Redis |
| `REDIS_PORT` | `6379` | Porta Redis |
| `APP_BASE_URL` | `http://localhost:5173/api` (via compose) | Base URL usada em links de resposta |
| `APP_CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Origins permitidas |
| `APP_PDF_STORAGE_DIR` | `storage/notas` | Diretorio dos PDFs de notas |
| `APP_VEICULOS_IMAGE_STORAGE_DIR` | `storage/veiculos` | Diretorio de imagens de veiculos |
| `APP_VEICULOS_CACHE_TTL_SECONDS` | `300` | TTL cache local de catalogo veicular |
| `APP_FIPE_ENABLED` | `false` | Liga consulta FIPE online |
| `APP_FIPE_BASE_URL` | `https://parallelum.com.br/fipe/api/v1` | URL base FIPE |
| `APP_OS_ARCHIVE_CRON` | `0 0 0 * * *` | Cron de arquivamento automatico de OS |
| `APP_OS_ARCHIVE_ZONE` | `America/Sao_Paulo` | Timezone do arquivamento |
| `APP_ASYNC_FIPE_IMPORT_CORE_POOL_SIZE` | `2` | Thread pool async FIPE |
| `APP_ASYNC_FIPE_IMPORT_MAX_POOL_SIZE` | `4` | Thread pool async FIPE |
| `APP_ASYNC_FIPE_IMPORT_QUEUE_CAPACITY` | `100` | Fila async FIPE |
| `JWT_SECRET` | sem default | Segredo JWT (obrigatorio via ambiente) |
| `JWT_EXPIRATION_MS` | `86400000` | Expiracao JWT em ms |

Observacao:

- `springdoc.api-docs` e `springdoc.swagger-ui` podem ser desabilitados por ambiente.
- No compose seguro, ambos ficam desabilitados por default.

## 5.2 Frontend

| Variavel | Default | Uso |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` (compose seguro) | URL base do backend no Axios |

## 6. Autenticacao e autorizacao

## 6.1 Login

Endpoint publico:

- `POST /auth/login`

Request:

```json
{
  "username": "*",
  "password": "*"
}
```

Response (exemplo):

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "type": "Bearer",
  "expiresIn": 86400,
  "username": "admin",
  "role": "ADMIN"
}
```

## 6.2 Credenciais seed

Criadas no startup (se nao existirem):

- `admin` / `*` com role `ADMIN`
- `funcionario` / `func123` com role `FUNCIONARIO`

## 6.3 Envio do token

Use header:

```http
Authorization: Bearer <JWT>
```

No frontend, o token e salvo em `localStorage`:

- `jhonycar_token`
- `jhonycar_user`

## 6.4 Endpoints publicos

- `POST /auth/login`
- `GET /veiculos/imagens/**`
- `GET /actuator/health`

## 7. API REST completa

Base URL padrao (compose seguro): `http://localhost:5173/api`

Convencao de permissao:

- `PUBLICO`: sem JWT
- `ADMIN`: JWT role ADMIN
- `ADMIN/FUNCIONARIO`: JWT role ADMIN ou FUNCIONARIO

Convencao de paginacao (Spring Data `Page`):

- Query params padrao: `page`, `size`, `sort`

## 7.1 Auth

| Metodo | Endpoint | Permissao | Observacao |
|---|---|---|---|
| POST | `/auth/login` | PUBLICO | Retorna JWT |

## 7.2 Clientes

| Metodo | Endpoint | Permissao | Observacao |
|---|---|---|---|
| POST | `/clientes` | ADMIN | Criar cliente |
| PUT | `/clientes/{id}` | ADMIN | Atualizar cliente |
| GET | `/clientes/{id}` | ADMIN/FUNCIONARIO | Buscar por id |
| GET | `/clientes` | ADMIN/FUNCIONARIO | Lista paginada |
| DELETE | `/clientes/{id}` | ADMIN | Excluir (com regras de bloqueio) |
| GET | `/clientes/{id}/central` | ADMIN/FUNCIONARIO | Dados consolidados completos |
| GET | `/clientes/{id}/detalhes` | ADMIN/FUNCIONARIO | Dados integrados sem notas/agenda |

## 7.3 Veiculos e catalogo

| Metodo | Endpoint | Permissao | Observacao |
|---|---|---|---|
| GET | `/veiculos/marcas` | ADMIN/FUNCIONARIO | Header opcional `X-Tenant-Id` |
| GET | `/veiculos/modelos?marca=...` | ADMIN/FUNCIONARIO | Header opcional `X-Tenant-Id` |
| POST | `/veiculos/modelos` | ADMIN | Cadastra/atualiza modelo |
| POST | `/veiculos/modelos/{id}/imagem-upload` | ADMIN | Multipart (`file`) |
| GET | `/veiculos/imagens/{fileName}` | PUBLICO | Serve imagem/placeholder |
| POST | `/veiculos` | ADMIN | Criar veiculo |
| PUT | `/veiculos/{id}` | ADMIN | Atualizar veiculo |
| GET | `/veiculos/{id}` | ADMIN/FUNCIONARIO | Buscar por id |
| GET | `/veiculos` | ADMIN/FUNCIONARIO | Lista paginada |
| DELETE | `/veiculos/{id}` | ADMIN | Excluir (com regras de bloqueio) |

## 7.4 Ordens de servico

| Metodo | Endpoint | Permissao | Observacao |
|---|---|---|---|
| POST | `/ordens-servico` | ADMIN | Criar OS |
| PUT | `/ordens-servico/{id}` | ADMIN | Atualizar OS |
| GET | `/ordens-servico/{id}` | ADMIN/FUNCIONARIO | Buscar por id |
| GET | `/ordens-servico` | ADMIN/FUNCIONARIO | Lista paginada; query opcional `archived=true/false` |
| DELETE | `/ordens-servico/{id}` | ADMIN | Excluir OS |

## 7.5 Orcamentos

| Metodo | Endpoint | Permissao | Observacao |
|---|---|---|---|
| POST | `/orcamentos` | ADMIN | Criar orcamento |
| PUT | `/orcamentos/{id}` | ADMIN | Atualizar orcamento |
| GET | `/orcamentos/{id}` | ADMIN/FUNCIONARIO | Buscar por id |
| GET | `/orcamentos` | ADMIN/FUNCIONARIO | Lista; query opcional `clienteId` |
| DELETE | `/orcamentos/{id}` | ADMIN | Excluir |
| PATCH | `/orcamentos/{id}/status?status=...` | ADMIN | Atualiza status |
| POST | `/orcamentos/{id}/converter` | ADMIN | Marca como convertido em OS |
| POST | `/orcamentos/{id}/duplicar` | ADMIN | Duplicar orcamento |

## 7.6 Financeiro

| Metodo | Endpoint | Permissao | Observacao |
|---|---|---|---|
| POST | `/financeiro` | ADMIN | Lancamento manual |
| PUT | `/financeiro/{id}` | ADMIN | Atualizar lancamento |
| GET | `/financeiro/{id}` | ADMIN/FUNCIONARIO | Buscar por id |
| GET | `/financeiro` | ADMIN/FUNCIONARIO | Lista paginada |
| DELETE | `/financeiro/{id}` | ADMIN | Excluir |

## 7.7 Notas fiscais simuladas

| Metodo | Endpoint | Permissao | Observacao |
|---|---|---|---|
| POST | `/notas/simular/{osId}` | ADMIN/FUNCIONARIO | So para OS FINALIZADA |
| PUT | `/notas/{id}/cancelar` | ADMIN | Exige body com `motivoCancelamento` |
| GET | `/notas/{id}` | ADMIN/FUNCIONARIO | Buscar por id |
| GET | `/notas/{id}/pdf` | ADMIN/FUNCIONARIO | Retorna `application/pdf` |
| GET | `/notas` | ADMIN/FUNCIONARIO | Lista paginada |

## 7.8 Agenda

| Metodo | Endpoint | Permissao | Observacao |
|---|---|---|---|
| POST | `/agendamentos` | ADMIN | Criar agendamento |
| PUT | `/agendamentos/{id}` | ADMIN | Atualizar agendamento |
| GET | `/agendamentos/{id}` | ADMIN/FUNCIONARIO | Buscar por id |
| GET | `/agendamentos` | ADMIN/FUNCIONARIO | Lista paginada |
| DELETE | `/agendamentos/{id}` | ADMIN | Excluir |

## 7.9 Dashboard

| Metodo | Endpoint | Permissao | Observacao |
|---|---|---|---|
| GET | `/dashboard` | ADMIN/FUNCIONARIO | Resumo gerencial |

## 7.10 Integracoes WhatsApp

| Metodo | Endpoint | Permissao | Observacao |
|---|---|---|---|
| GET | `/integracoes/whatsapp/orcamento/{financeiroId}` | ADMIN/FUNCIONARIO | Link WhatsApp de orcamento |
| GET | `/integracoes/whatsapp/nota/{notaId}` | ADMIN/FUNCIONARIO | Link WhatsApp de nota |

## 7.11 Admin FIPE

| Metodo | Endpoint | Permissao | Observacao |
|---|---|---|---|
| POST | `/admin/importar-fipe` | ADMIN | Dispara importacao async; header opcional `X-Tenant-Id` |
| GET | `/admin/importar-fipe/status` | ADMIN | Consulta status; header opcional `X-Tenant-Id` |

## 8. DTOs principais

## 8.1 Requests relevantes

- `LoginRequest`: `username`, `password`
- `ClienteRequest`: dados cadastrais + endereco + observacoes
- `VeiculoRequest`: `placa`, `modelo`, `marca`, `ano`, `clienteId`
- `OrdemServicoRequest`: `clienteId`, `veiculoId`, `problemaRelatado`, `diagnostico`, `valorTotal`, `status`, `dataEntrada`, `dataSaida`
- `OrcamentoRequest`: cliente/veiculo, dados comerciais e listas `servicos` e `pecas`
- `FinanceiroRequest`: `clienteId`, `ordemServicoId`, `tipo`, `valor`, `formaPagamento`, `status`, `data`
- `AgendamentoRequest`: `clienteId`, `veiculoId`, `dataHora`, `descricao`, `status`
- `CancelarNotaRequest`: `motivoCancelamento`
- `VeiculoModeloCadastroRequest`: `marca`, `modelo`, `imagemUrl`, `ativo`

## 8.2 Responses relevantes

- `AuthResponse`: token JWT + role
- `DashboardResponse`: totais + faturamento mensal + agrupamento OS por status
- `ClienteCentralResponse`: cliente + veiculos + ordens + orcamentos + financeiro + notas + agendamentos
- `NotaFiscalResponse`: dados da nota + `linkPdf` + `linkWhatsapp`
- `FinanceiroResponse`: inclui `linkWhatsapp`

## 9. Modelo de dados

## 9.1 Entidades

- `AppUser`
- `Cliente`
- `Veiculo`
- `VeiculoModelo`
- `OrdemServico`
- `Orcamento`
- `OrcamentoItem`
- `Financeiro`
- `NotaFiscalSimulada`
- `Agendamento`

## 9.2 Enums

- `Role`: `ADMIN`, `FUNCIONARIO`
- `OrdemServicoStatus`: `RECEBIDO`, `EM_ANALISE`, `AGUARDANDO_APROVACAO`, `EM_EXECUCAO`, `FINALIZADO`
- `OrcamentoStatus`: `PENDENTE`, `APROVADO`, `RECUSADO`
- `OrcamentoItemTipo`: `SERVICO`, `PECA`
- `FinanceiroStatus`: `PENDENTE`, `PAGO`, `ESTORNADO`
- `FinanceiroTipo`: `SERVICO`, `ORCAMENTO`, `OUTROS`
- `NotaFiscalStatus`: `SIMULADA`, `EMITIDA`, `CANCELADA`
- `AgendamentoStatus`: `AGENDADO`, `CONCLUIDO`, `CANCELADO`

## 9.3 Relacionamentos principais

- Cliente 1:N Veiculos
- Cliente 1:N OrdensServico
- Cliente 1:N Orcamentos
- Cliente 1:N Financeiro
- Cliente 1:N Agendamentos
- Veiculo 1:N OrdensServico
- Veiculo 1:N Agendamentos
- OrdemServico 1:N Financeiro
- OrdemServico 1:1 NotaFiscalSimulada
- Orcamento 1:N OrcamentoItem
- Financeiro 1:1 NotaFiscalSimulada (opcional)

## 10. Regras de negocio principais

## 10.1 Clientes

- Nao permite CPF/CNPJ duplicado.
- Nao permite exclusao se houver vinculo com veiculos, OS, orcamentos, financeiro ou agendamentos.

## 10.2 Veiculos

- Nao permite placa duplicada.
- Marca/modelo devem existir e estar ativos no catalogo.
- Ao validar catalogo, o sistema tenta hidratar modelos por FIPE se necessario.
- Nao permite exclusao com OS ou agendamento vinculados.

## 10.3 Ordens de servico

- Veiculo deve pertencer ao cliente informado.
- Se OS for criada/atualizada como `FINALIZADO`, e criado financeiro automatico se ainda nao existir.
- Se OS estiver `FINALIZADO` e `dataSaida` vazia, o sistema define automaticamente.
- Campo `archived` e controlado para separar OS arquivadas.

## 10.4 Arquivamento automatico de OS

- Job agendado por cron (`app.os.archive-cron`) roda no timezone (`app.os.archive-zone`).
- Arquiva OS `FINALIZADO` com `archived=false` quando sao anteriores ao inicio do dia atual.
- Criterio de data usa `updatedAt`; fallback para `dataSaida`; fallback para `dataEntrada`.

## 10.5 Orcamentos

- Gera numero sequencial (`ORC-0001`, `ORC-0002`, ...).
- Exige pelo menos um item em `servicos`.
- Total = soma de itens (quantidade x valorUnitario) - desconto.
- Apenas `APROVADO` pode ser convertido em OS.
- Duplicacao gera novo numero e status `PENDENTE`.

## 10.6 Notas fiscais simuladas

- So podem ser geradas para OS `FINALIZADO`.
- Uma nota por OS.
- Numero sequencial: `NF-0001`, `NF-0002`, ...
- Gera PDF e guarda caminho em `pdfPath`.
- Cancelamento muda status para `CANCELADA`, registra motivo/data e atualiza PDF.

## 10.7 Financeiro

- Pode ser criado manualmente ou automaticamente por OS finalizada.
- Vincula nota ao registro financeiro da OS.
- Cancelamento de nota estorna financeiro (`ESTORNADO`).
- Se financeiro tiver OS vinculada, OS deve pertencer ao cliente informado.

## 10.8 Agendamentos

- Veiculo deve pertencer ao cliente informado.
- Status padrao da entidade e `AGENDADO` quando nao informado.

## 11. Cache, async e scheduler

## 11.1 Cache Redis

- Cache manager Redis com prefixo `v2::`.
- TTL default de 10 minutos.
- Cache resiliente com `CacheErrorHandler` (erro de cache nao derruba request).
- Principais caches:
- `dashboardResumo`
- `clienteCentral`
- `clientes`

## 11.2 Cache em memoria (catalogo veicular)

- `VeiculoModeloService` usa cache local em memoria por tenant:
- cache de marcas
- cache de modelos por marca
- TTL controlado por `APP_VEICULOS_CACHE_TTL_SECONDS`

## 11.3 Processamento async

- Importacao FIPE em background com executor `fipeImportExecutor`.
- Pool configuravel por variaveis `APP_ASYNC_FIPE_IMPORT_*`.
- Status de importacao por tenant com estados: `IDLE`, `PROCESSANDO`, `CONCLUIDO`, `CONCLUIDO_COM_ERROS`, `FALHA`.

## 11.4 Scheduler

- `@EnableScheduling` ativo na aplicacao.
- Job de arquivamento automatico de OS roda por cron configuravel.

## 12. Integracao FIPE

Comportamento:

- `APP_FIPE_ENABLED=false` usa client desabilitado (retorna lista vazia).
- `APP_FIPE_ENABLED=true` ativa consultas HTTP para FIPE.
- Endpoints admin permitem importacao completa do catalogo em background.

Observacao:

- Header `X-Tenant-Id` e opcional e prepara o sistema para isolamento futuro por tenant.

## 13. Geracao de arquivos

## 13.1 PDF de nota

- Gerado pelo `NotaFiscalPdfService` usando PDFBox.
- Diretorio configuravel por `APP_PDF_STORAGE_DIR`.
- Endpoint de leitura: `GET /notas/{id}/pdf`.

## 13.2 Imagens de modelos

- Upload via `POST /veiculos/modelos/{id}/imagem-upload`.
- Armazenamento configuravel por `APP_VEICULOS_IMAGE_STORAGE_DIR`.
- Entrega via `GET /veiculos/imagens/{fileName}`.

## 14. Padrao de erros da API

Erros sao retornados como `ApiErrorResponse`:

```json
{
  "timestamp": "2026-05-11T20:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Erro de validacao",
  "path": "/clientes",
  "validationErrors": {
    "email": "Email invalido"
  }
}
```

Handlers cobertos:

- Validacao (`MethodArgumentNotValidException`, `ConstraintViolationException`)
- Recurso nao encontrado (`ResourceNotFoundException`, `NoResourceFoundException`)
- Regras de negocio (`BadRequestException`)
- Integridade de dados (`DataIntegrityViolationException`)
- Acesso negado (`403`)
- Nao autenticado (`401` pela camada de seguranca)

## 15. Frontend

## 15.1 Rotas principais

- `/login`
- `/dashboard`
- `/clientes`
- `/clientes/:id`
- `/veiculos`
- `/ordens`
- `/ordens-servico`
- `/financeiro`
- `/agenda`
- `/notas`
- `/orcamentos`
- `/estoque`
- `/configuracoes`

## 15.2 Comportamento de autenticacao

- Token JWT no `localStorage`.
- Axios envia `Authorization: Bearer <token>`.
- Em `401`, frontend limpa sessao e redireciona para `/login`.

## 15.3 Observacao do modulo Estoque

- Implementado no frontend com `localStorage` (`jhonycar_estoque_items_v1`).
- Nao existe API backend dedicada para estoque neste momento.

## 16. Testes de API (Postman/Newman)

Arquivos:

- `postman/JhonyCar-API.postman_collection.json`
- `postman/JhonyCar-Local.postman_environment.json`
- `postman/run-newman.ps1`

Executar:

```powershell
powershell -ExecutionPolicy Bypass -File .\postman\run-newman.ps1
```

Com base URL customizada:

```powershell
powershell -ExecutionPolicy Bypass -File .\postman\run-newman.ps1 -BaseUrl "http://localhost:8080"
```

Relatorios:

- `postman/reports/newman.<timestamp>.junit.xml`
- `postman/reports/newman.<timestamp>.report.json`
- `postman/reports/JhonyCar-Local.final.<timestamp>.json`

## 17. Operacao e monitoramento

## 17.1 Endpoints uteis

- OpenAPI JSON: `GET /v3/api-docs` (quando habilitado por ambiente e com autenticacao)
- Swagger UI: desabilitado por default no compose seguro

## 17.2 Observacao sobre `/actuator/health`

- O endpoint esta liberado na seguranca.
- O projeto inclui `spring-boot-starter-actuator`.
- O healthcheck do backend usa `/actuator/health`.

## 18. Troubleshooting rapido

## 18.1 401 em endpoints protegidos

- Verifique se o token JWT foi enviado no header `Authorization`.
- Faca login novamente para renovar token expirado.

## 18.2 403 em operacoes de escrita

- Verifique role do usuario (`ADMIN` exigido em create/update/delete da maior parte dos modulos).

## 18.3 Erro de CORS no frontend

- Ajuste `APP_CORS_ALLOWED_ORIGINS`.
- Confirme URL real do frontend.

## 18.4 PDF nao abre

- Verifique `APP_PDF_STORAGE_DIR`.
- Verifique permissao de escrita no diretorio.

## 18.5 Modelos de veiculo nao aparecem

- Verifique dados existentes em `veiculos_modelos`.
- Se FIPE estiver desativada, habilite `APP_FIPE_ENABLED=true` para hidratacao online.
- Use endpoint admin de importacao FIPE.

## 18.6 Docker sobe, mas backend nao fica saudavel

- Verifique logs do backend e conectividade com Postgres/Redis.
- O healthcheck usa `GET /actuator/health`.

## 19. Melhorias recomendadas para producao

- Externalizar segredos (`JWT_SECRET`, credenciais DB, REDIS_PASSWORD) em secret manager.
- Aplicar migracoes versionadas de schema (Flyway/Liquibase).
- Adicionar suite de testes automatizados backend/frontend.
- Criar API backend para estoque e remover dependencia de `localStorage`.
- Habilitar observabilidade completa (metrics, tracing, logs estruturados).
