# Brainy Vocab Vault

**Master new vocab through brainy spaced repetition**

A sophisticated vocabulary learning application designed for teachers and students, implementing the Frayer Model with spaced repetition algorithms. Built for classroom management with support for 135 students and 500+ words per student.

## 🌟 Features

### For Students
- **Interactive Frayer Model Templates**: 3 core learning styles
  - Classic Frayer Model (Definition, Characteristics, Examples, Non-Examples)
  - Definition-Image-Synonyms (Visual learning with word connections)
  - Prefix-Root-Suffix (Morphological word analysis)
- **Spaced Repetition System**: 5-level mastery progression (0-4)
- **Visual Learning**: Image support and SnappyWords integration
- **Dictionary Integration**: Merriam-Webster Kids Dictionary
- **Cloze Sentences**: Fill-in-the-blank practice exercises
- **Practice Modes**: Extra practice without affecting review schedules

### For Teachers
- **Classroom Management**: Create classrooms with unique codes
- **Student Progress Tracking**: Individual mastery level monitoring
- **Advanced Templates**: Access to all 7 template variations
- **Semester Management**: Reset system for new academic periods
- **Role-Based Access**: Separate teacher and student interfaces

## 🏗️ Architecture

### Frontend
- **React** with TypeScript
- **Tailwind CSS** + shadcn/ui components
- **TanStack Query** for state management
- **Wouter** for routing
- **Vite** for development

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** with Drizzle ORM
- **Neon Database** (serverless PostgreSQL)
- **Google OAuth** via Replit Auth
- **RESTful API** design

### Database Schema
- User management with role-based access
- Vocabulary cards with custom fields
- Review sessions with spaced repetition
- Card templates with flexible configurations
- Classroom organization system

## 📚 Educational Methodology

### Frayer Model Implementation
The application implements the research-backed Frayer Model approach:
- **Definition**: Clear meaning explanation
- **Characteristics**: Key features and qualities
- **Examples**: Real-world usage instances
- **Non-Examples**: Contrast for deeper understanding
- **Visual Aid**: Images for memory retention

### Spaced Repetition Algorithm
- **Level 0** (New): Same session review
- **Level 1** (Learning): 1 day interval
- **Level 2** (Familiar): 3 days interval
- **Level 3** (Good): 7 days interval
- **Level 4** (Mastered): 30 days interval

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Google OAuth credentials

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/brainy-vocab-vault.git
cd brainy-vocab-vault

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and OAuth credentials

# Initialize database templates
npm run db:push
node init-templates.js

# Start development server
npm run dev
```

### Environment Variables
```env
DATABASE_URL=your_postgresql_connection_string
MERRIAM_WEBSTER_API_KEY=your_api_key
SESSION_SECRET=your_session_secret
REPL_ID=your_replit_id
REPLIT_DOMAINS=your_domain
```

## 🎯 Usage

### Student Workflow
1. **Login** with Google account
2. **Create Word Maps** using preferred learning template
3. **Study Cards** through spaced repetition
4. **Extra Practice** for additional reinforcement
5. **Track Progress** through mastery levels

### Teacher Workflow
1. **Create Classroom** with unique code
2. **Manage Students** and monitor progress
3. **Access Advanced Templates** for assignments
4. **Reset System** for new semesters

## 🔧 Development

### Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:push      # Update database schema
npm run db:studio    # Open database studio
```

### Testing
```bash
# Test database connection
node test-system.js

# Test API endpoints
curl -X GET "http://localhost:5000/api/card-templates"
```

## 📊 Capacity & Performance

- **Students**: 135 concurrent users
- **Vocabulary**: 500+ words per student
- **Database**: ~400MB total capacity
- **Templates**: 9 pre-configured options
- **Review Sessions**: Unlimited with performance optimization

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Frayer Model**: Educational research methodology
- **Spaced Repetition**: Ebbinghaus forgetting curve
- **Merriam-Webster**: Dictionary API integration
- **SnappyWords**: Visual word relationship mapping
- **shadcn/ui**: Component library
- **Replit**: Development platform

## 📧 Support

For support, email [your-email@example.com] or create an issue in the GitHub repository.

---

**Built with ❤️ for educators and students**