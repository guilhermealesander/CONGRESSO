# 🏛️ CONGRESSO - Sistema de Gestão de Arenas e Participantes

![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green)
![License](https://img.shields.io/badge/License-Private-red)

## 📋 Sobre o Projeto

O **CONGRESSO** é uma plataforma web desenvolvida para gerenciamento de eventos de grande porte, permitindo a administração centralizada de participantes, arenas, usuários e processos operacionais.

O sistema foi criado para automatizar tarefas que normalmente seriam realizadas manualmente, proporcionando maior controle, organização e eficiência durante a realização de congressos, encontros e eventos institucionais.

---

## 🚀 Principais Funcionalidades

### 👥 Gestão de Participantes (Arenados)

* Cadastro de participantes
* Importação em lote através de planilhas
* Consulta rápida por nome
* Visualização detalhada dos dados
* Edição de informações
* Controle de presença

### 🏟️ Gestão de Arenas

* Criação de múltiplas arenas
* Controle de capacidade
* Distribuição automática dos participantes
* Busca por arena
* Visualização dos participantes vinculados

### 📊 Dashboard Gerencial

* Total de participantes
* Total de arenas
* Indicadores operacionais
* Estatísticas em tempo real
* Monitoramento da ocupação das arenas

### 🔐 Controle de Usuários

* Login seguro
* Gestão de usuários
* Controle de permissões
* Perfis administrativos
* Proteção de rotas

### 📥 Importação de Dados

* Upload de planilhas
* Processamento automatizado
* Validação de registros
* Tratamento de inconsistências
* Distribuição automática dos participantes

---

## 🏗️ Arquitetura da Solução

### Frontend

* React
* TypeScript
* Vite
* Context API
* Tailwind CSS

### Backend

* Supabase
* PostgreSQL
* Authentication
* Row Level Security (RLS)

### DevOps

* Git
* GitHub
* Node.js
* NPM

---

## 📁 Estrutura do Projeto

```text
src/
│
├── app/
│   ├── components/
│   ├── lib/
│   ├── App.tsx
│   └── data-context.tsx
│
├── supabase/
│   └── schema.sql
│
└── public/
```

---

## ⚙️ Instalação

### Clonar o repositório

```bash
git clone https://github.com/guilhermealesander/CONGRESSO.git
```

### Entrar no projeto

```bash
cd CONGRESSO
```

### Instalar dependências

```bash
npm install
```

### Configurar variáveis de ambiente

Crie um arquivo `.env`:

```env
VITE_SUPABASE_URL=YOUR_URL
VITE_SUPABASE_ANON_KEY=YOUR_KEY
```

### Executar o projeto

```bash
npm run dev
```

Ou:

```bash
npm run start
```

---

## 🔒 Segurança

O sistema utiliza:

* Autenticação via Supabase
* Controle de acesso por usuário
* Proteção de rotas
* Gerenciamento seguro de sessões
* Banco de dados protegido por políticas RLS

---

## 📈 Benefícios

✅ Centralização das informações

✅ Redução de trabalho manual

✅ Melhor distribuição dos participantes

✅ Controle operacional em tempo real

✅ Escalabilidade para eventos de grande porte

✅ Melhor experiência para equipes organizadoras

---

## 💡 Futuras Implementações

* QR Code para credenciamento
* Check-in digital
* Relatórios avançados
* Exportação para Excel e PDF
* Dashboard analítico avançado
* Integração com aplicativos móveis

---

## 👨‍💻 Desenvolvedor

### Guilherme Melo e Vinicius Emanuel

Analista de Sistemas | Desenvolvedor Full Stack

📍 Recife - PE

🔗 LinkedIn:
https://www.linkedin.com/in/guilherme-melo01/ e https://www.linkedin.com/in/vinicius-emanuel-856b1923b/

🔗 GitHub:
https://github.com/guilhermealesander

---

## 📄 Licença

Projeto privado desenvolvido para fins institucionais e organizacionais.

Todos os direitos reservados © Guilherme Melo e Vinicius Emanuel.





  # ARENA CJU Web System Prototype

  This is a code bundle for ARENA CJU Web System Prototype. The original project is available at https://www.figma.com/design/JzSpajmPb6qmJLl0TelHOm/ARENA-CJU-Web-System-Prototype.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Supabase setup

  1. Create a new Supabase project.
  2. Open the SQL editor and run [supabase/schema.sql](supabase/schema.sql).
  3. Copy [.env.example](.env.example) to a local [.env](.env) or [.env.local](.env.local) file.
  4. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the Supabase project settings.
  5. Start the app again with `npm run dev`.

  ## Notes

  - The current frontend uses a local login screen, but the data layer already reads and writes through Supabase when the environment variables are set.
  - The schema currently allows browser-side access through the Supabase anonymous key so the prototype can work without Supabase Auth. For production, tighten the RLS policies and switch the login flow to Supabase Auth.
  
