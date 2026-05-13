🚀 📌 PROMPT PROFISSIONAL COMPLETO — JhonyCar (Auto Elétrica SaaS)

Copia e usa direto:

🧠 PROMPT

Crie um sistema backend completo para um SaaS de gestão para auto elétrica chamado JhonyCar, utilizando Java 17 + Spring Boot + PostgreSQL + Redis + Docker.

O sistema deve ser profissional, escalável, seguro e seguir boas práticas de desenvolvimento.

🏗️ TECNOLOGIAS OBRIGATÓRIAS
Java 17+
Spring Boot
Spring Web
Spring Data JPA
Spring Security
PostgreSQL
Redis (cache)
Docker + Docker Compose
Lombok
Bean Validation
🧱 ARQUITETURA

O sistema deve seguir:

Arquitetura em camadas:
Controller
Service
Repository
DTO
Entity
Padrões:
REST API
DTO Pattern
Clean Code
SOLID
Separation of Concerns
Implementar:
Tratamento global de exceções (@ControllerAdvice)
Validações com @Valid
🔐 SEGURANÇA

Implementar autenticação completa com:

JWT (login e geração de token)
Spring Security configurado
Criptografia de senha com BCrypt
Controle de acesso por roles:
ADMIN
FUNCIONARIO
Proteção de endpoints
Endpoint de autenticação (/auth/login)
🧱 MÓDULOS DO SISTEMA
👤 CLIENTE

Criar entidade Cliente com:

id
nome
cpfCnpj
telefone
email

Relacionamentos:

Cliente possui vários veículos
Cliente possui várias ordens de serviço
🚗 VEÍCULO
id
placa
modelo
marca
ano
cliente (ManyToOne)
🛠️ ORDEM DE SERVIÇO (CORE)
id
cliente
veículo
problemaRelatado
diagnostico
valorTotal
status (ENUM):
RECEBIDO
EM_ANALISE
AGUARDANDO_APROVACAO
EM_EXECUCAO
FINALIZADO
dataEntrada
dataSaida

Relacionamentos:

OS pertence a Cliente
OS pertence a Veículo
💰 FINANCEIRO
id
ordemServico
valor
formaPagamento
status (PAGO / PENDENTE)
data
📅 AGENDA DE CARROS
id
cliente
veículo
dataHora
descricao
status
🧾 NOTA FISCAL (SIMULAÇÃO)

Implementar sistema de nota fiscal simulada:

id
numero automático (ex: NF-0001)
clienteNome
cpfCnpj
descricaoServico
valor
status: SIMULADA
dataEmissao

Funcionalidades:

gerar nota baseada na Ordem de Serviço
endpoint: POST /notas/simular/{osId}
📊 DASHBOARD

Criar endpoints para:

total de clientes
total de veículos
quantidade de OS em aberto
faturamento mensal
lista de OS agrupadas por status
🧠 CENTRAL DO CLIENTE (DIFERENCIAL)

Criar endpoint:

GET /clientes/{id}/central

Retornar:

dados do cliente
veículos
ordens de serviço
financeiro
notas fiscais
agendamentos

Tudo consolidado em um único JSON

⚡ PERFORMANCE
Implementar cache com Redis:
dashboard
consultas frequentes
Implementar paginação em todas listagens
🐳 DOCKER

Criar:

Dockerfile
docker-compose contendo:
backend
postgres
redis
📂 ESTRUTURA DO PROJETO
src/
 ├── controller/
 ├── service/
 ├── repository/
 ├── dto/
 ├── entity/
 ├── security/
 ├── config/
 ├── exception/
📱 INTEGRAÇÕES

Implementar funcionalidade de geração de link para WhatsApp:

enviar orçamento
enviar nota simulada

Formato:
https://wa.me/{telefone}?text={mensagem}

🧠 FRONTEND (SUGESTÃO)

O backend deve ser preparado para consumo por frontend em:

👉 React + TypeScript

🔥 REGRAS IMPORTANTES
Código limpo e organizado
Uso de DTOs (não expor entidades diretamente)
Tratamento de erros padronizado
Logs básicos
Preparar sistema para futura integração com API real de nota fiscal (ex: Focus NFe)
🚀 RESULTADO ESPERADO

Gerar:

Projeto completo Spring Boot
Entidades, Repositories, Services, Controllers
Segurança JWT funcional
Estrutura pronta para escalar
Código pronto para rodar
