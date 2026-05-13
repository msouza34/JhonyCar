🚗 JhonyCar — Sistema de Gestão para Auto Elétrica










































































Sistema SaaS profissional para gestão completa de oficinas de auto elétrica, centralizado em atendimento do cliente, ordens de serviço, orçamentos, financeiro, agenda e notas fiscais.




📋 Sumário

•
Visão Geral

•
Características Principais

•
Arquitetura do Sistema

•
Stack Tecnológico

•
Estrutura do Projeto

•
Início Rápido

•
Módulos do Sistema

•
Banco de Dados

•
API REST

•
Autenticação e Segurança

•
Frontend React

•
Cache e Performance

•
Deployment

•
Troubleshooting

•
Roadmap




👀 Visão Geral

Objetivo

O JhonyCar é uma solução SaaS (Software as a Service) completa para oficinas de auto elétrica, eliminando silos de informação e centralizando todo o fluxo operacional em uma plataforma única e intuitiva.

Problema Resolvido

Oficinas de auto elétrica enfrentam desafios operacionais críticos:

•
❌ Informações dispersas em múltiplos sistemas

•
❌ Falta de visibilidade em tempo real do status dos serviços

•
❌ Dificuldade em gerenciar agenda e recursos

•
❌ Controle financeiro inadequado

•
❌ Falta de histórico de atendimento do cliente

Solução Oferecida

✅ Centralização Completa — Todos os dados em um único lugar

✅ Fluxo Integrado — Do cadastro do cliente até a nota fiscal

✅ Dashboard Inteligente — Métricas em tempo real e alertas

✅ Escalabilidade — Suporta múltiplas oficinas (multi-tenant)

✅ Segurança — Autenticação, autorização e criptografia

✅ Performance — Cache distribuído com Redis




⭐ Características Principais

1. Gestão de Clientes

•
Cadastro completo com histórico de atendimentos

•
Segmentação por tipo de cliente (PF/PJ)

•
Histórico de serviços realizados

•
Contatos e endereços múltiplos

•
Sistema de notas e observações

2. Gestão de Veículos

•
Cadastro de veículos por cliente

•
Histórico de manutenções

•
Rastreamento de peças e componentes

•
Alertas de manutenção preventiva

•
Documentação de garantias

3. Ordens de Serviço (OS)

•
Criação rápida de OS com fluxo definido

•
Estados: Entrada → Diagnóstico → Aguardando Aprovação → Em Execução → Finalizado

•
Atribuição de técnicos

•
Acompanhamento em tempo real

•
Histórico completo de ações

4. Orçamentos

•
Geração automática de orçamentos

•
Vinculação com OS

•
Aprovação/Rejeição de clientes

•
Histórico de revisões

•
Comparação com orçamentos anteriores

5. Financeiro

•
Controle de receitas e despesas

•
Integração com OS e orçamentos

•
Relatórios de faturamento

•
Gestão de pagamentos

•
Análise de lucratividade por serviço

6. Agenda

•
Calendário integrado

•
Agendamento de serviços

•
Bloqueio de horários

•
Notificações de compromissos

•
Sincronização com Google Calendar (opcional)

7. Notas Fiscais Simuladas

•
Geração de NF-e simuladas

•
Integração com OS

•
Histórico de emissões

•
Reemissão de NF

•
Conformidade fiscal

8. Dashboard Executivo

•
KPIs em tempo real

•
Ordens em aberto

•
Faturamento do dia/semana/mês

•
Tempo médio de serviço

•
Taxa de ocupação

•
Alertas importantes

•
Gráficos de tendências




🏗️ Arquitetura do Sistema

Visão Geral em Camadas

Plain Text


┌─────────────────────────────────────────────┐
│         Frontend (React + TypeScript)        │
│  Dashboard | Clientes | Veículos | OS | etc │
└────────────────┬────────────────────────────┘
                 │ HTTPS
┌────────────────▼────────────────────────────┐
│      API Gateway & Security (Spring)        │
│  JWT Auth | CORS | Rate Limiting | Logs     │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│    Business Logic Layer (Spring Services)   │
│  ClientService | OSService | FinanceService │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  Data Access Layer (Spring Data JPA)        │
│  ClientRepository | OSRepository | etc      │
└────────────────┬────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼──────┐  ┌──────▼────────┐
│  PostgreSQL  │  │  Redis Cache  │
│   (Primary)  │  │  (Secondary)  │
└──────────────┘  └───────────────┘



Fluxo de Requisição

Plain Text


1. Cliente faz requisição HTTP
    ↓
2. API Gateway valida CORS
    ↓
3. JWT Authentication Filter valida token
    ↓
4. Authorization Filter verifica permissões
    ↓
5. Controller recebe requisição
    ↓
6. Service executa lógica de negócio
    ↓
7. Repository acessa dados (Redis ou PostgreSQL)
    ↓
8. Resposta formatada em JSON
    ↓
9. Cliente recebe dados



Padrões Arquiteturais

Padrão
Aplicação
Benefício
MVC
Separação de Controller, Service, Repository
Manutenibilidade
DTO
Transferência de dados entre camadas
Segurança e performance
Repository
Abstração do acesso a dados
Testabilidade
Service Layer
Lógica de negócio centralizada
Reutilização
Dependency Injection
Spring IoC Container
Desacoplamento
Cache-Aside
Redis para dados frequentes
Performance
Multi-Tenant
Isolamento por tenantId
Escalabilidade







🛠️ Stack Tecnológico

Backend

Componente
Versão
Propósito
Java
17 LTS
Linguagem, estabilidade
Spring Boot
3.x
Framework web
Spring Web
3.x
REST API
Spring Data JPA
3.x
ORM e persistência
Spring Data Redis
3.x
Cache distribuído
Spring Security
3.x
Autenticação JWT
PostgreSQL
16
Banco de dados relacional
Redis
7
Cache em memória
Flyway
9.x
Migrações versionadas
Lombok
1.18.x
Redução de boilerplate
Validation
3.x
Validação de dados




Frontend

Componente
Versão
Propósito
React
19
UI library
TypeScript
5.x
Type safety
Vite
5.x
Build tool
Tailwind CSS
4.x
Styling
React Router
6.x
Roteamento
Axios
1.x
HTTP client
React Query
5.x
State management
Zustand
4.x
Global state
Recharts
2.x
Gráficos
shadcn/ui
-
Componentes UI




Infraestrutura

Componente
Versão
Propósito
Docker
Latest
Containerização
Docker Compose
2.x
Orquestração local
Nginx
Latest
Reverse proxy







📁 Estrutura do Projeto

Diretório Backend

Plain Text


backend/
├── src/
│   ├── main/
│   │   ├── java/com/jhonycar/
│   │   │   ├── config/
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   ├── RedisConfig.java
│   │   │   │   └── AppConfig.java
│   │   │   ├── controller/
│   │   │   │   ├── ClientController.java
│   │   │   │   ├── VehicleController.java
│   │   │   │   ├── OSController.java
│   │   │   │   ├── BudgetController.java
│   │   │   │   ├── FinanceController.java
│   │   │   │   ├── ScheduleController.java
│   │   │   │   └── DashboardController.java
│   │   │   ├── service/
│   │   │   │   ├── ClientService.java
│   │   │   │   ├── VehicleService.java
│   │   │   │   ├── OSService.java
│   │   │   │   ├── BudgetService.java
│   │   │   │   ├── FinanceService.java
│   │   │   │   ├── ScheduleService.java
│   │   │   │   └── AuthService.java
│   │   │   ├── repository/
│   │   │   │   ├── ClientRepository.java
│   │   │   │   ├── VehicleRepository.java
│   │   │   │   ├── OSRepository.java
│   │   │   │   ├── BudgetRepository.java
│   │   │   │   ├── FinanceRepository.java
│   │   │   │   └── UserRepository.java
│   │   │   ├── entity/
│   │   │   │   ├── Client.java
│   │   │   │   ├── Vehicle.java
│   │   │   │   ├── ServiceOrder.java
│   │   │   │   ├── Budget.java
│   │   │   │   ├── Finance.java
│   │   │   │   └── User.java
│   │   │   ├── dto/
│   │   │   │   ├── ClientDTO.java
│   │   │   │   ├── VehicleDTO.java
│   │   │   │   ├── OSDTO.java
│   │   │   │   ├── BudgetDTO.java
│   │   │   │   └── FinanceDTO.java
│   │   │   ├── exception/
│   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   ├── ResourceNotFoundException.java
│   │   │   │   └── BusinessException.java
│   │   │   ├── security/
│   │   │   │   ├── JwtTokenProvider.java
│   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   └── AuthenticationController.java
│   │   │   └── JhonyCarApplication.java
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       └── db/migration/
│   │           ├── V1__init_schema.sql
│   │           ├── V2__add_tables.sql
│   │           └── V3__add_indexes.sql
│   └── test/
│       └── java/com/jhonycar/
│           ├── service/
│           ├── controller/
│           └── repository/
├── pom.xml
├── Dockerfile
└── docker-compose.yml



Diretório Frontend

Plain Text


frontend/
├── src/
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Clients.tsx
│   │   ├── Vehicles.tsx
│   │   ├── ServiceOrders.tsx
│   │   ├── Budgets.tsx
│   │   ├── Finance.tsx
│   │   ├── Schedule.tsx
│   │   └── Settings.tsx
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Card.tsx
│   │   ├── Table.tsx
│   │   ├── Modal.tsx
│   │   └── Form.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── clientService.ts
│   │   ├── vehicleService.ts
│   │   ├── osService.ts
│   │   └── authService.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useClients.ts
│   │   └── useFetch.ts
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── appStore.ts
│   │   └── uiStore.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── api.ts
│   │   └── entities.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
│   └── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── package.json






🚀 Início Rápido

Pré-requisitos

•
Docker e Docker Compose instalados

•
Git

•
Node.js 18+ (opcional, para desenvolvimento frontend)

•
Java 17 e Maven (opcional, para desenvolvimento backend)

Execução com Docker Compose











1. Clonar repositório:

Bash


git clone https://github.com/seu-usuario/jhonycar.git
cd jhonycar



2. Subir ambiente completo:

Bash


docker compose up --build -d



3. Acessar aplicação:

•
Frontend: http://localhost:5173

•
Backend API: http://localhost:8080

•
PostgreSQL: localhost:5432

•
Redis: localhost:6379

4. Credenciais iniciais:

Usuário
Senha
Perfil
admin
[CONFIGURE_NO_ENV]
ADMIN
funcionario
[CONFIGURE_NO_ENV]
FUNCIONARIO




⚠️ Segurança: Nunca commite credenciais no repositório. Use variáveis de ambiente ou .env (não versionado ).

Execução Local (Desenvolvimento)

Backend:

Bash


cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev



Frontend:

Bash


cd frontend
npm install
npm run dev






📦 Módulos do Sistema

1. Módulo de Clientes

Funcionalidades:

•
Cadastro de clientes (PF/PJ)

•
Histórico de atendimentos

•
Múltiplos contatos e endereços

•
Notas e observações

•
Segmentação por tipo

Endpoints:

Plain Text


POST   /api/clients              # Criar cliente
GET    /api/clients              # Listar clientes
GET    /api/clients/{id}         # Buscar cliente
PUT    /api/clients/{id}         # Atualizar cliente
DELETE /api/clients/{id}         # Deletar cliente
GET    /api/clients/{id}/history # Histórico de atendimentos



2. Módulo de Veículos

Funcionalidades:

•
Cadastro de veículos

•
Associação com cliente

•
Histórico de manutenções

•
Rastreamento de peças

•
Alertas de manutenção preventiva

Endpoints:

Plain Text


POST   /api/vehicles              # Criar veículo
GET    /api/vehicles              # Listar veículos
GET    /api/vehicles/{id}         # Buscar veículo
PUT    /api/vehicles/{id}         # Atualizar veículo
DELETE /api/vehicles/{id}         # Deletar veículo
GET    /api/vehicles/{id}/history # Histórico de manutenções



3. Módulo de Ordens de Serviço

Funcionalidades:

•
Criação de OS com fluxo definido

•
Estados: Entrada → Diagnóstico → Aguardando Aprovação → Em Execução → Finalizado

•
Atribuição de técnicos

•
Acompanhamento em tempo real

•
Histórico completo

Endpoints:

Plain Text


POST   /api/orders                # Criar OS
GET    /api/orders                # Listar OS
GET    /api/orders/{id}           # Buscar OS
PUT    /api/orders/{id}           # Atualizar OS
DELETE /api/orders/{id}           # Deletar OS
PUT    /api/orders/{id}/status    # Alterar status
GET    /api/orders/{id}/history   # Histórico de alterações



4. Módulo de Orçamentos

Funcionalidades:

•
Geração de orçamentos

•
Vinculação com OS

•
Aprovação/Rejeição

•
Histórico de revisões

•
Comparação com anteriores

Endpoints:

Plain Text


POST   /api/budgets              # Criar orçamento
GET    /api/budgets              # Listar orçamentos
GET    /api/budgets/{id}         # Buscar orçamento
PUT    /api/budgets/{id}         # Atualizar orçamento
DELETE /api/budgets/{id}         # Deletar orçamento
PUT    /api/budgets/{id}/approve # Aprovar orçamento
PUT    /api/budgets/{id}/reject  # Rejeitar orçamento



5. Módulo Financeiro

Funcionalidades:

•
Controle de receitas e despesas

•
Integração com OS e orçamentos

•
Relatórios de faturamento

•
Gestão de pagamentos

•
Análise de lucratividade

Endpoints:

Plain Text


GET    /api/finance/dashboard    # Dashboard financeiro
GET    /api/finance/revenue      # Receitas
GET    /api/finance/expenses     # Despesas
GET    /api/finance/reports      # Relatórios
POST   /api/finance/payments     # Registrar pagamento
GET    /api/finance/profitability # Análise de lucratividade



6. Módulo de Agenda

Funcionalidades:

•
Calendário integrado

•
Agendamento de serviços

•
Bloqueio de horários

•
Notificações

•
Sincronização (opcional)

Endpoints:

Plain Text


GET    /api/schedule/calendar    # Calendário
POST   /api/schedule/appointments # Agendar
GET    /api/schedule/appointments # Listar agendamentos
PUT    /api/schedule/appointments/{id} # Atualizar agendamento
DELETE /api/schedule/appointments/{id} # Cancelar agendamento



7. Módulo Dashboard

Funcionalidades:

•
KPIs em tempo real

•
Gráficos de tendências

•
Alertas importantes

•
Resumo financeiro

•
Ações rápidas

Endpoints:

Plain Text


GET    /api/dashboard/kpis       # KPIs
GET    /api/dashboard/orders     # Resumo de OS
GET    /api/dashboard/finance    # Resumo financeiro
GET    /api/dashboard/alerts     # Alertas
GET    /api/dashboard/metrics    # Métricas






💾 Banco de Dados

Schema Principal

SQL


-- Usuários
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clientes
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  type VARCHAR(20), -- PF, PJ
  document VARCHAR(20) UNIQUE,
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Veículos
CREATE TABLE vehicles (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  client_id UUID NOT NULL,
  plate VARCHAR(10) UNIQUE NOT NULL,
  brand VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  color VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Ordens de Serviço
CREATE TABLE service_orders (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  client_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  status VARCHAR(50) NOT NULL, -- ENTRADA, DIAGNOSTICO, AGUARDANDO_APROVACAO, EM_EXECUCAO, FINALIZADO
  description TEXT,
  assigned_to UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Orçamentos
CREATE TABLE budgets (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  order_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL, -- PENDING, APPROVED, REJECTED
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (order_id) REFERENCES service_orders(id)
);

-- Financeiro
CREATE TABLE finance (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  order_id UUID,
  type VARCHAR(20) NOT NULL, -- REVENUE, EXPENSE
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (order_id) REFERENCES service_orders(id)
);

-- Agenda
CREATE TABLE schedule (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  order_id UUID,
  user_id UUID,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  title VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (order_id) REFERENCES service_orders(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);



Migrações Flyway

Localização: backend/src/main/resources/db/migration/

•
V1__init_schema.sql — Schema inicial

•
V2__add_indexes.sql — Índices para performance

•
V3__add_audit_tables.sql — Tabelas de auditoria




🔐 Autenticação e Segurança

Fluxo de Autenticação

Plain Text


1. Usuário faz login com email/senha
    ↓
2. Backend valida credenciais
    ↓
3. JWT token é gerado (válido por 24h)
    ↓
4. Token é retornado ao cliente
    ↓
5. Cliente armazena token no localStorage
    ↓
6. Requisições posteriores incluem token no header Authorization
    ↓
7. JwtAuthenticationFilter valida token
    ↓
8. Requisição é processada se válida



Endpoints de Autenticação

Plain Text


POST   /api/auth/login           # Login
POST   /api/auth/refresh         # Renovar token
POST   /api/auth/logout          # Logout
GET    /api/auth/me              # Dados do usuário



Segurança Implementada

✅ JWT (JSON Web Token) — Autenticação stateless

✅ BCrypt — Hashing de senhas

✅ CORS — Controle de origem

✅ HTTPS — Criptografia em trânsito

✅ Rate Limiting — Proteção contra brute force

✅ Multi-Tenant — Isolamento de dados por tenantId

✅ Validação de Entrada — Sanitização de dados

✅ Logs de Auditoria — Rastreamento de ações




⚡ Cache e Performance

Estratégia de Cache

•
Padrão: Cache-Aside (Lazy Loading)

•
Armazenamento: Redis

•
TTL: Configurável por tipo de dado

Dados em Cache

Dados
TTL
Chave
Clientes
1h
client:{id}
Veículos
1h
vehicle:{id}
Ordens
30min
order:{id}
Usuários
2h
user:{id}
Dashboard
5min
dashboard:{tenantId}




Invalidação de Cache

Cache é invalidado automaticamente em:

1.
Criação de novo registro

2.
Atualização de registro

3.
Exclusão de registro

4.
Alteração de status




🚀 Deployment

Docker Compose (Produção)

YAML


version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: jhonycar
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    environment:
      SPRING_DATASOURCE_URL: ${DB_URL}
      SPRING_DATASOURCE_USERNAME: ${DB_USERNAME}
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      SPRING_REDIS_HOST: redis
      SPRING_REDIS_PORT: 6379
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend

  nginx:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend

volumes:
  postgres_data:



⚠️ Segurança: Todas as credenciais são injetadas via variáveis de ambiente. Nunca commite valores sensíveis.

Variáveis de Ambiente

Backend (.env.example):

Plain Text


SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/jhonycar
SPRING_DATASOURCE_USERNAME=jhonycar_user
SPRING_DATASOURCE_PASSWORD=[CONFIGURE_SENHA_SEGURA]
SPRING_REDIS_HOST=localhost
SPRING_REDIS_PORT=6379
JWT_SECRET=[CONFIGURE_CHAVE_SECRETA_ALEATORIA]
JWT_EXPIRATION=86400000
APP_NAME=JhonyCar
APP_VERSION=1.0.0



⚠️ IMPORTANTE: Nunca commite o arquivo .env com valores reais. Use .env.example como template.

Frontend (.env.example):

Plain Text


VITE_API_URL=http://localhost:8080/api
VITE_APP_NAME=JhonyCar
VITE_APP_VERSION=1.0.0






🔧 Troubleshooting

Erro: Connection refused ao PostgreSQL

Bash


# Verificar se está rodando
docker ps | grep postgres

# Reiniciar
docker compose restart postgres

# Ver logs
docker compose logs postgres



Erro: Redis connection failed

Bash


# Verificar se está rodando
docker ps | grep redis

# Testar conexão
redis-cli -h localhost ping

# Reiniciar
docker compose restart redis



Erro: 401 Unauthorized

Bash


# Verificar token JWT
# Confirmar que token está no header Authorization: Bearer {token}
# Verificar se token não expirou
# Fazer novo login se necessário



Erro: CORS blocked

Bash


# Verificar configuração de CORS no backend
# Adicionar origem do frontend em SecurityConfig
# Exemplo: http://localhost:5173



Aplicação lenta

Bash


# Verificar cache Redis
redis-cli INFO stats

# Verificar queries do PostgreSQL
# Adicionar índices se necessário

# Verificar logs de performance
docker compose logs backend | grep "took"






📈 Roadmap

Versão 1.0 (Atual )

✅ Gestão de clientes
✅ Gestão de veículos
✅ Ordens de serviço
✅ Orçamentos
✅ Financeiro básico
✅ Agenda
✅ Dashboard

Versão 1.1 (Próxima)

🔄 Integração com NF-e real
🔄 Relatórios avançados
🔄 Integração com Google Calendar
🔄 Notificações por email/SMS
🔄 App mobile (React Native)

Versão 2.0 (Futuro)

🔮 Integração com sistemas de pagamento
🔮 IA para previsão de demanda
🔮 Análise preditiva de manutenção
🔮 Marketplace de serviços
🔮 Integração com IoT para diagnóstico remoto




📄 Licença

Este projeto está licenciado sob a MIT License — veja o arquivo LICENSE para detalhes.




🙏 Contribuindo

Contribuições são bem-vindas! Por favor, leia nosso CONTRIBUTING.md para detalhes sobre nosso código de conduta e processo de submissão de pull requests.



📚 Referências

•
Spring Boot Documentation

•
React Documentation

•
PostgreSQL Documentation

•
Redis Documentation

•
Docker Documentation


