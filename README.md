# BrainLens 🧠

> AI-Powered Learning Research Platform built with Kiro IDE

## 🎭 Judge/Demo Login

- **Live**: https://brainlens.cloud
- **Email**: devpost@demo.com
- **Password**: kiroide123


BrainLens is an intelligent learning platform that automatically researches any topic using multi-agent web scraping and AI aggregation, then presents information through multiple interactive learning modalities.

## 🚀 Features

### Multi-Modal Learning Interface
- **🎯 Learn Tab**: Guided, personalized learning with knowledge assessment
- **🗺️ Explore Tab**: Self-directed navigation with interactive tree-view sidebar
- **💬 Ask Tab**: RAG-powered conversational learning with AI tutor
- **🧠 MindMap Tab**: Visual knowledge representation using React Flow
- **📝 Quiz Tab**: AI-generated adaptive assessments and knowledge testing

### Intelligent Research System
- **5 Specialized AI Agents**: General, Academic, Computational, Video, and Social research agents
- **Real-time Streaming**: Progressive UI updates during multi-agent research
- **Smart Aggregation**: Intelligent deduplication and content synthesis
- **Vector Storage**: Semantic search and retrieval using Qdrant database

### Advanced AI Features
- **RAG Integration**: Context-aware responses using embedded research content
- **Personalized Learning**: Adaptive content based on user knowledge level and preferences
- **Conversation Memory**: Persistent chat threads with intelligent context management
- **Content Generation**: AI-powered learning materials and assessments

## 🛠️ Technology Stack

**Frontend**
- React 18+ with TypeScript
- Tailwind CSS for styling
- Radix UI & shadcn/ui components
- React Flow for mind mapping
- Vite for build tooling

**Backend**
- Wasp full-stack framework (v0.17.0)
- Node.js with Express
- PostgreSQL with Prisma ORM
- Redis for caching

**AI & Search**
- OpenAI API (GPT-4, text-embedding-3-small)
- Vercel AI SDK 4.0 for streaming
- Qdrant vector database
- SearXNG meta search engine
- Multi-agent orchestration system

**Infrastructure**
- AWS S3 for file storage
- Server-Sent Events for real-time updates
- Built-in authentication system
- Stripe & Lemon Squeezy payments

## 🎯 Hackathon Category

**Educational Apps** - Building AI-enhanced learning platforms that help others learn through intelligent research automation and personalized content delivery.

## 🏗️ Architecture

### Research Pipeline
```
User Query → Ground Definition → Multi-Agent Search → 
Results Aggregation → Content Generation → 
3-Level Topic Tree → Vector Embedding → Qdrant Storage
```

### Learning Interface Flow
```
Topic Input → Automated Research → Content Processing → 
Multi-Modal Presentation (Learn/Explore/Ask/MindMap/Quiz)
```

## 📸 Screenshots

*Add screenshots here showing the 5 learning tabs and research interface*

## 🚀 Quick Start

1. **Install Wasp**
   ```bash
   curl -sSL https://get.wasp.sh/installer.sh | sh
   ```

2. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/brainlens.git
   cd brainlens
   ```

3. **Setup environment**
   ```bash
   cd app
   ./start-dev-services.sh
   cp .env.development .env.server
   # Add your API keys and database URLs
   ```

3. **Install dependencies**
   ```bash
   wasp db migrate-dev
   ```

4. **Start development server**
   ```bash
   wasp start
   ```

For detailed setup instructions, see [SETUP.md](SETUP.md).

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 🎖️ Built with Kiro

This project was developed using Kiro IDE, which significantly accelerated development through:

- **AI-Powered Code Generation**: Complex React components and TypeScript interfaces
- **Multi-Agent Architecture**: Sophisticated search orchestration system
- **RAG Implementation**: Vector database integration and semantic search
- **Real-time Features**: Streaming interfaces and progressive UI updates

For detailed information about Kiro usage in this project, see [HACKATHON.md](HACKATHON.md).

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [Add your demo URL]
- **Demo Video**: [Add your demo video URL]
- **Repository**: [Add your repo URL]
- **Hackathon Submission**: [Add Devpost URL]

## 🏆 Hackathon Submission

Built for the **Code with Kiro Hackathon** - Educational Apps category.

**How BrainLens Uses Kiro:**
- Accelerated development of complex AI learning features
- Generated sophisticated multi-agent research system
- Created responsive learning interfaces with real-time updates
- Implemented vector database integration for RAG functionality

---

*Made with ❤️ using Kiro IDE*