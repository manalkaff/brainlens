# Contributing to BrainLens

Thank you for your interest in contributing to BrainLens! This document provides guidelines and information for contributing to our AI-powered learning platform.

## 🤝 Ways to Contribute

- 🐛 **Bug Reports**: Report bugs and issues
- 💡 **Feature Requests**: Suggest new features or improvements
- 📝 **Documentation**: Improve documentation and guides
- 🧪 **Testing**: Write tests and improve test coverage
- 💻 **Code**: Submit bug fixes and new features
- 🎨 **UI/UX**: Improve user interface and experience
- 🧠 **AI/ML**: Enhance learning algorithms and agent behavior

## 🏗️ Development Setup

1. Follow the [SETUP.md](SETUP.md) guide for initial setup
2. Fork the repository
3. Clone your fork: `git clone https://github.com/your-username/brainlens.git`
4. Create a new branch: `git checkout -b feature/your-feature-name`

## 📋 Before You Start

### Required Knowledge
- **TypeScript/JavaScript**: Primary language for the application
- **React**: Frontend framework
- **Wasp**: Full-stack framework understanding
- **PostgreSQL**: Database queries and schema design
- **Node.js**: Backend development
- **AI/ML Basics**: Understanding of LLMs, embeddings, and vector databases (for AI-related contributions)

### Recommended Reading
- [Wasp Documentation](https://wasp-lang.dev/docs)
- [OpenAI API Guidelines](https://platform.openai.com/docs)
- [Qdrant Vector Database](https://qdrant.tech/documentation/)
- Project architecture in [CLAUDE.md](CLAUDE.md)

## 🎯 Development Guidelines

### Code Style
- Use **TypeScript** for all new code
- Follow existing code patterns and conventions
- Use **Prettier** for formatting: `npm run format`
- Run **ESLint** for linting: `npm run lint`
- Ensure **type checking** passes: `npm run typecheck`

### Component Structure
```
src/learning/components/
├── [feature-name]/
│   ├── index.tsx          # Main component
│   ├── [Component].tsx    # Sub-components
│   ├── hooks/             # Feature-specific hooks
│   └── types.ts          # TypeScript interfaces
```

### Naming Conventions
- **Components**: PascalCase (`TopicExplorer.tsx`)
- **Hooks**: camelCase starting with `use` (`useTopicResearch.ts`)
- **Types/Interfaces**: PascalCase (`TopicData`, `ResearchAgent`)
- **Files**: kebab-case for utilities, PascalCase for components
- **Branches**: `feature/description`, `fix/description`, `docs/description`

### File Organization
- **Operations**: Define in `main.wasp`, implement in `operations.ts`
- **Components**: Group by feature in `src/learning/components/`
- **Types**: Feature-specific types in local `types.ts`, shared types in `src/shared/types.ts`
- **Utilities**: In appropriate `utils/` directories
- **API Routes**: In `src/learning/api/` for learning-specific endpoints

## 🧪 Testing Guidelines

### Before Submitting
```bash
# Run all checks
npm run typecheck
npm run lint
wasp build  # Ensure build succeeds
```

### Testing Checklist
- [ ] Code compiles without TypeScript errors
- [ ] All existing functionality still works
- [ ] New features are properly integrated
- [ ] Database migrations work correctly (if applicable)
- [ ] API endpoints respond as expected (if applicable)
- [ ] UI components render correctly across different screen sizes

### Manual Testing Areas
- **Research System**: Test multi-agent search with various topics
- **Learning Tabs**: Verify all 5 tabs work correctly (Learn, Explore, Ask, MindMap, Quiz)
- **Real-time Features**: Check streaming updates and progress indicators
- **Database Operations**: Test data persistence and retrieval
- **Authentication**: Verify login/logout and user sessions

## 🐛 Bug Reports

### Creating Quality Bug Reports

Use our bug report template:

```markdown
## Bug Description
Brief description of the issue

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., macOS 13.0]
- Browser: [e.g., Chrome 100.0]
- Node.js version: [e.g., 18.0.0]
- Wasp version: [run `wasp version`]

## Additional Context
- Error messages/logs
- Screenshots (if applicable)
- Network requests (if API-related)
```

### Bug Priority Levels
- **Critical**: App crashes, data loss, security vulnerabilities
- **High**: Major features broken, significant UX issues
- **Medium**: Minor features broken, small UX problems
- **Low**: Cosmetic issues, enhancement requests

## 💡 Feature Requests

### Proposing New Features

Include in your feature request:
1. **Use Case**: Why is this feature needed?
2. **Description**: What should the feature do?
3. **Implementation Ideas**: How might it work technically?
4. **Alternatives**: Other ways to solve the problem?
5. **Additional Context**: Mockups, examples, references

### Feature Categories
- **Learning Experience**: New learning modalities or improvements
- **AI/ML**: Enhanced agents, better personalization
- **UI/UX**: Interface improvements, accessibility
- **Performance**: Speed, scalability, efficiency
- **Developer Experience**: Better tools, debugging, documentation

## 🔄 Pull Request Process

### Before Creating PR
1. **Test thoroughly**: Ensure your changes work correctly
2. **Update documentation**: If you change APIs or add features
3. **Follow coding standards**: Run linting and formatting
4. **Write clear commits**: Use conventional commit format

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature  
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring

## How Has This Been Tested?
Describe testing performed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated (if needed)
- [ ] No breaking changes (or clearly documented)
```

### Review Process
1. **Automated Checks**: CI/CD runs type checking and linting
2. **Code Review**: Maintainer reviews code quality and design
3. **Testing**: Manual testing of functionality
4. **Documentation**: Ensure docs are updated if needed
5. **Merge**: Approved PRs are merged to main branch

## 🏗️ Architecture Guidelines

### Learning Platform Components
- **Research System** (`src/learning/research/`): Multi-agent web scraping
- **Content Processing** (`src/learning/assessment/`): AI content generation
- **Learning Interface** (`src/learning/components/`): React components for learning tabs
- **Vector Storage** (`src/learning/chat/`): RAG and semantic search
- **State Management** (`src/learning/context/`): React context and state

### Adding New Learning Features
1. **Define Operations**: Add to `main.wasp` with proper types
2. **Implement Backend**: Create operation handlers in `operations.ts`
3. **Build Frontend**: Create React components following patterns
4. **Integrate State**: Connect to TopicContext or local state
5. **Test Integration**: Ensure works with existing tabs

### AI/ML Development
- **Agent Configuration**: Modify `src/learning/research/searxng/agentConfigs.ts`
- **Content Generation**: Extend `src/learning/assessment/`
- **Vector Operations**: Update vector storage and retrieval logic
- **RAG Enhancement**: Improve context selection and response generation

## 📚 Resources

### Project Documentation
- [README.md](README.md) - Project overview
- [SETUP.md](SETUP.md) - Development setup
- [CLAUDE.md](CLAUDE.md) - Detailed architecture guide
- [HACKATHON.md](HACKATHON.md) - Kiro usage documentation

### External Resources
- [Wasp Framework Docs](https://wasp-lang.dev/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Qdrant Documentation](https://qdrant.tech/documentation/)

## 💬 Communication

### Getting Help
1. **Check Documentation**: Review existing docs first
2. **Search Issues**: Look for similar problems/questions
3. **Create Discussion**: Use GitHub Discussions for questions
4. **Create Issue**: For bugs or feature requests

### Community Guidelines
- **Be Respectful**: Treat all contributors with respect
- **Be Helpful**: Help others when you can
- **Be Patient**: Reviews and responses take time
- **Be Constructive**: Provide actionable feedback
- **Be Clear**: Write clear descriptions and explanations

## 🎉 Recognition

Contributors will be:
- Added to the contributors list
- Mentioned in release notes for significant contributions
- Given credit for their specific contributions

## 📄 License

By contributing to BrainLens, you agree that your contributions will be licensed under the same MIT License that covers the project.

---

**Thank you for contributing to BrainLens! 🧠✨**

Your contributions help make AI-powered learning accessible to everyone.