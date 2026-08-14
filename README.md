<div align="center">

# 🎨 ArtFlow
### *O ecossistema definitivo para artistas, ilustradores e criadores visuais*

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://artflow-azure.vercel.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Google Gemini](https://img.shields.io/badge/Gemini_AI-3.5_Flash_Lite-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_%26_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![i18n](https://img.shields.io/badge/i18n-PT--BR_%7C_EN-D9B98D?style=for-the-badge)](https://artflow-azure.vercel.app)

---

### 🌐 **Acesse a Aplicação em Produção**
### 👉 [https://artflow-azure.vercel.app](https://artflow-azure.vercel.app) 👈

---

</div>

## 📖 Sobre o ArtFlow

O **ArtFlow** é uma aplicação web progressiva e moderna desenvolvida sob medida para a comunidade artística. Unindo curadoria visual, teoria das cores, gerenciamento ágil de projetos e inteligência artificial de última geração, o ArtFlow potencializa o fluxo criativo desde o primeiro esboço até a finalização da obra.

---

## ✨ Principais Funcionalidades

### 🤖 **ArtFlow AI (Mentor & Assistente Criativo)**
- **Inteligência Artificial Especializada:** Alimentado pelo modelo **Gemini 3.5 Flash Lite** da Google, oferecendo respostas rápidas, contextuais e fundamentadas sobre composição, técnicas de iluminação, anatomia e estilos.
- **Memória de Conversa Multi-Turnos:** Histórico contínuo com alternância estrita entre usuário e mentor para manter o contexto criativo.
- **Gerenciamento de Chats:** Criação de novos chats nomeados (com modal ágil e nome pré-definido) e persistência em tempo real no Firestore.
- **Geração de Paletas Assistida por IA:** Criação estruturada de harmonias de cores diretamente no chat com inserção em 1 clique na biblioteca pessoal.

### 🎨 **Color Muse & Gerenciador de Paletas**
- **Extração Inteligente:** Extraia amostras de cores primárias, secundárias e acentos a partir de qualquer imagem de referência.
- **Harmonias Cromáticas:** Ferramentas dedicadas para paletas monocromáticas, análogas, complementares, triádicas e personalizadas.
- **Funções Estruturadas:** Classificação de cada tom (Luz, Sombra, Meio-tom, Ponto Alto, Acento) com códigos hexadecimais padronizados.

### 🖼️ **Feed de Referências & Integração DeviantArt**
- **Exploração e Curadoria:** Navegação fluida por obras de arte, conceitos e ilustrações em alta resolução.
- **Visualizador Modal Avançado:** Zoom interativo, detalhes do autor, data de publicação e links diretos para a obra original.
- **Organização por Pastas e Projetos:** Salve referências diretamente nos seus projetos ativos.

### 📁 **Gerenciamento de Projetos e Moodboards**
- **Fluxo por Estágios:** Acompanhamento do progresso artístico em etapas (*Ideação*, *Rascunho*, *Lineart*, *Cores*, *Finalizado*).
- **Isolamento de Dados por Usuário:** Cada artista possui seu espaço 100% privado e seguro protegido por regras estritas de segurança no Firebase.

### 🌐 **Sistema Completo de Internacionalização (i18n)**
- Suporte nativo a **Português (Brasil)** e **Inglês (US)**.
- Seletor de idioma interativo em modal bottom-sheet.
- Persistência automática da preferência no `localStorage`.
- Integração bilíngue com as respostas e instruções do ArtFlow AI.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React.
- **Backend / Serverless:** Vercel Serverless Functions (Node.js & TypeScript).
- **Inteligência Artificial:** Google GenAI SDK (`gemini-3.5-flash-lite`) com suporte a Function Calling (Tools) e Grounding.
- **Banco de Dados & Autenticação:** Firebase Authentication & Cloud Firestore.
- **Validação de Schemas:** Zod.
- **Testes Automatizados:** Vitest com cobertura de suites de isolamento, provedores, autenticação, i18n e backend.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [npm](https://www.npmjs.com/) ou [pnpm](https://pnpm.io/)

### 1. Clonar o Repositório
```bash
git clone https://github.com/ThiagoIbrahimVieira/ArtFlow.git
cd ArtFlow
```

### 2. Instalar as Dependências
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente
Crie um arquivo `.env` ou `.env.local` na raiz do projeto:

```env
# Google Gemini API
GEMINI_API_KEY=sua_chave_gemini_aqui
GEMINI_MODEL=gemini-3.5-flash-lite

# Firebase Client
VITE_FIREBASE_API_KEY=sua_api_key_firebase
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id

# Firebase Admin (Opcional para ambiente de desenvolvimento local)
FIREBASE_PROJECT_ID=seu_projeto_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@seu_projeto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

### 4. Executar os Testes
```bash
npm test -- --run
```

### 5. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
Abra [http://localhost:5173](http://localhost:5173) no seu navegador para ver o ArtFlow funcionando.

---

## 📦 Build para Produção
```bash
npm run build
```

---

## 📄 Licença
Este projeto foi desenvolvido para fins educacionais e de portfólio. Todos os direitos reservados aos respectivos autores das obras do DeviantArt referenciadas no feed.

---

<div align="center">
  <sub>Criado com paixão por e para artistas. 🎨✨</sub>
</div>
