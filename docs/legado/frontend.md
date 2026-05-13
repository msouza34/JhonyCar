🚀 📌 PROMPT FRONTEND — JhonyCar (React + TypeScript SaaS)
🧠 PROMPT

Crie um frontend completo para um sistema SaaS de auto elétrica chamado JhonyCar, consumindo uma API backend em Spring Boot (REST).

O sistema deve ser moderno, responsivo, profissional e com experiência semelhante a sistemas SaaS pagos.

🧱 TECNOLOGIAS OBRIGATÓRIAS
React
TypeScript
Vite
Axios
React Router DOM
Zustand (estado global)
TailwindCSS
React Hook Form
Zod (validação)
🎨 DESIGN / UX
Tema dark por padrão
Layout com sidebar fixa à esquerda
Interface limpa e moderna
Componentes reutilizáveis
Botões bem definidos (ações principais)
Tabelas organizadas
🧭 ROTAS DO SISTEMA
/dashboard
/clientes
/clientes/:id
/veiculos
/ordens-servico
/financeiro
/agenda
/notas
/login
📂 ESTRUTURA DE PASTAS
src/
 ├── pages/
 ├── components/
 ├── services/
 ├── store/
 ├── hooks/
 ├── layouts/
 ├── routes/
 ├── types/
🔐 AUTENTICAÇÃO
Tela de login
Consumir endpoint /auth/login
Armazenar JWT no localStorage
Axios interceptor para enviar token automaticamente
Redirecionar usuário não autenticado para login
📊 DASHBOARD

Criar página com:

Cards:
total de clientes
total de veículos
OS em aberto
faturamento mensal
Gráficos simples (opcional)

Consumir endpoints do backend

👤 CLIENTES

Tela com:

Listagem em tabela
Busca por nome
Botões:
Ver Central
Editar
Excluir
Formulário de cadastro/edição
🧠 CENTRAL DO CLIENTE (PRINCIPAL)

Criar página /clientes/:id com abas:

Dados do cliente
Veículos
Ordens de Serviço
Financeiro
Notas fiscais
Agenda

Consumir:

GET /clientes/{id}/central
🚗 VEÍCULOS
Cadastro de veículo
Listagem vinculada ao cliente
🛠️ ORDENS DE SERVIÇO
Listagem em formato Kanban (OBRIGATÓRIO)

Colunas:

Recebido
Em análise
Aguardando aprovação
Em execução
Finalizado
Funcionalidades:
Criar OS
Editar OS
Alterar status (drag and drop)
🧾 NOTAS FISCAIS
Listagem:
Número
Cliente
Valor
Status
Ações:
Emitir nota:
POST /notas/simular/{osId}
Cancelar nota:
PUT /notas/{id}/cancelar
Cancelamento:
Abrir modal
Solicitar motivo
💰 FINANCEIRO
Listagem de lançamentos
Exibir:
valor
status
forma de pagamento
Filtro por status
Marcar como pago
📅 AGENDA
Criar agendamento
Listar por data
Interface simples (calendário ou lista)
📱 WHATSAPP (DIFERENCIAL)

Criar botão:

👉 “Enviar nota”

Gerar link:

https://wa.me/{telefone}?text=Segue sua nota: {link_pdf}
⚡ PERFORMANCE
Lazy loading de páginas
Debounce na busca
Evitar re-render desnecessário
🔥 COMPONENTES REUTILIZÁVEIS

Criar:

Button
Input
Table
Modal
Card
Badge (status)
🧠 TIPAGEM (TypeScript)

Criar interfaces:

Cliente
Veiculo
OrdemServico
NotaFiscal
Financeiro
🌐 SERVICE API

Criar arquivo api.ts com:

baseURL
interceptor JWT
tratamento de erros
🎨 ESTILO
TailwindCSS
Responsivo
Tema escuro
🚀 RESULTADO ESPERADO
Sistema frontend completo
Integrado com backend Spring Boot
Interface profissional
Estrutura escalável
Código limpo
🔥 OBJETIVO FINAL

O sistema deve parecer um produto SaaS pronto para venda.