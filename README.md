# TalentRadar

**A modern SaaS platform for discovering and hiring pre-vetted remote talent**

## 📖 About

TalentRadar is a self-serve talent discovery and hiring platform that digitizes Remote Leverage's manual recruitment process. It transforms the traditional agency model into a scalable SaaS product — think Zillow for remote talent.

### The Business Model

Remote Leverage helps US businesses hire English-speaking virtual assistants from Latin America, Philippines, South Africa, and Egypt for $6-$10/hr with:
- **One-time placement fee** (NOT recurring)
- VAs receive 100% of their hourly rate
- 6-month replacement guarantee
- Dedicated Customer Success Manager
- 30% discount on future hires within 12 months

TalentRadar automates this entire workflow.

---

## ✨ Key Features

### For Hiring Managers (Companies)
- 🔍 **Talent Search & Discovery** - Browse 100+ pre-vetted VA profiles with advanced filters
- 📊 **Talent Profiles** - Detailed candidate pages with skills, experience, vetting reports
- 📋 **Job Management** - Create and manage open roles
- 🎯 **Hiring Pipeline (Kanban)** - Drag-and-drop workflow: Shortlisted → Screening → Interview → Offer → Finalizing → Hired
- 📝 **Pipeline Slide-Over** - Linear stepper UI showing stage-specific workflows and actions
- 📈 **Dashboard** - Real-time stats, upcoming interviews, active offers

### For Admins (Remote Leverage Internal)
- 🎛️ **Admin Dashboard** - Active deals, action items, hires, revenue
- 💼 **Deals Management (Kanban)** - Cross-company view: New Offers → Presented → Accepted → In Progress → Completed
- ✅ **Deal Processing** - Review offers, present to candidates, record responses
- 📑 **Finalization Workflow** - 6-step checklist: Invoice, Contract, Payroll, Compliance, CSM, Start Date
- 👥 **Talent Pool Management** - View all talent with pipeline counts
- 🏢 **Companies Management** - View all registered companies with activity

---

## 🛠️ Tech Stack

### Frontend
- **React 18.3** + **TypeScript 5.8**
- **Vite 5.4** (build tool)
- **Tailwind CSS 3.4** + **shadcn/ui** components
- **TanStack React Query 5.8** (data fetching)
- **React Router 6.3** (routing)
- **React Hook Form 7.6** + **Zod** (forms & validation)

### Backend
- **Express 5.2** + **TypeScript 5.9**
- **MongoDB** (via Mongoose 9.2)
- **JWT Authentication** (separate tokens for companies & admins)
- **Zod** validation schemas
- **Swagger/OpenAPI** documentation
- **Cloudinary** (file storage - optional)

### Monorepo
- **Turborepo 2.8** (build orchestration)
- **npm workspaces** (package management)

### Infrastructure
- **Docker** (containerization)
- **GCP Cloud Run** (deployment)
- **GitHub Actions** (CI/CD)
- **MongoDB Atlas** (database)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 20+** and npm
- **MongoDB** (local or Atlas)
- **Git**

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd talentradar

# Install all dependencies (uses Turborepo)
npm install

# Set up environment variables
cp apps/client/.env.example apps/client/.env
cp apps/server/.env.example apps/server/.env

# Edit .env files with your configuration
# Backend: MongoDB URI, JWT secret, CORS origin
# Frontend: API URL
```

### Environment Variables

**Backend** (`apps/server/.env`):
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/talentradar
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
NODE_ENV=development
CORS_ORIGIN=http://localhost:8080
```

**Frontend** (`apps/client/.env`):
```env
VITE_API_URL=http://localhost:3000/api/v1
```

### Seed Database

```bash
# Seed demo data (companies, talents, jobs, pipeline entries)
cd apps/server
npm run seed

# Create database indexes
npm run ensure-indexes
```

### Development

```bash
# Run both frontend and backend (from root)
npm run dev

# Or run individually:
cd apps/client && npm run dev  # Frontend at http://localhost:8080
cd apps/server && npm run dev  # Backend at http://localhost:3000
```

### Build

```bash
# Build all packages with Turborepo
npm run build

# Or build individually:
cd apps/client && npm run build  # Output: apps/client/dist/
cd apps/server && npm run build  # Output: apps/server/dist/
```

---

## 🔐 Demo Credentials

**Hiring Manager** (Company):
- Email: `demo@example.com`
- Password: `password123`

**Admin** (Remote Leverage):
- Email: `admin@remoteleverage.com`
- Password: `admin123`

---

## 📚 API Documentation

Once the backend is running, visit:

**Swagger UI**: `http://localhost:3000/api-docs`

Complete interactive API documentation with all endpoints, request/response schemas, and authentication requirements.

---

## 🏗️ Project Structure

```
talentradar/
├── apps/
│   ├── client/              # Frontend (React + Vite)
│   │   ├── src/
│   │   │   ├── components/  # UI components
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   ├── lib/         # Utilities and API client
│   │   │   ├── pages/       # Route pages
│   │   │   └── types/       # TypeScript types
│   │   ├── Dockerfile       # Frontend container
│   │   └── nginx.conf       # Nginx config for production
│   │
│   └── server/              # Backend (Express + MongoDB)
│       ├── src/
│       │   ├── controllers/ # Request handlers
│       │   ├── middleware/  # Express middleware
│       │   ├── models/      # Mongoose schemas
│       │   ├── routes/      # API routes
│       │   ├── utils/       # Helper functions
│       │   ├── validators/  # Zod schemas
│       │   └── seed/        # Database seed scripts
│       ├── Dockerfile       # Backend container
│       └── cloudbuild.yaml  # GCP Cloud Build config
│
├── packages/
│   └── shared/              # Shared code (placeholder)
│
├── .github/
│   └── workflows/
│       └── deploy.yml       # CI/CD pipeline
│
├── docs/                    # Documentation
├── turbo.json              # Turborepo configuration
├── package.json            # Root workspace config
├── DEPLOYMENT_GUIDE.md     # Full deployment guide
├── CLOUD_RUN_DEPLOY.md     # GCP Cloud Run quick start
└── README.md               # This file
```

---

## 🎯 Key Design Decisions

### UI/UX
- **Sidebar navigation** (collapsible) with company info at bottom
- **Pipeline slide-over** uses linear stepper/accordion (not tabs)
- **One main action button** per stage (context-aware)
- **Remote Leverage as middleman** - HM never communicates offers directly to candidates

### Architecture
- **Monorepo** for shared types and code reuse
- **Separate auth** for companies and admins (different token scopes)
- **File uploads** via Cloudinary (persistent) or local disk (ephemeral fallback)
- **Auto-generated IDs** for invoices and contracts

### Workflow
- **6-stage pipeline** for hiring managers with stage-specific forms
- **5-stage deals pipeline** for admins with operational workflows
- **Finalization checklist** (6 steps: Payment, Contract, Payroll, Compliance, CSM, Start Date)
- **Timeline tracking** for all deal activities

---

## 🚢 Deployment

### Option 1: Quick Deploy (Manual)

Follow [CLOUD_RUN_DEPLOY.md](CLOUD_RUN_DEPLOY.md) for step-by-step GCP Cloud Run deployment (~15 min).

### Option 2: Docker

```bash
# Build backend
cd apps/server
docker build -t talentradar-backend .

# Build frontend
cd apps/client
docker build --build-arg VITE_API_URL=https://your-backend-url/api/v1 -t talentradar-frontend .

# Run containers
docker run -p 5000:5000 -e MONGODB_URI=... talentradar-backend
docker run -p 8080:8080 talentradar-frontend
```

### Option 3: GitHub Actions (CI/CD)

Push to main branch or click "Run workflow" button in GitHub Actions:

1. Builds both FE and BE with Turborepo
2. Runs tests
3. Deploys backend to GCP Cloud Run
4. Deploys frontend to GCP Cloud Run
5. Auto-updates CORS

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for complete instructions.

---

## 🧪 Testing

```bash
# Frontend tests (Vitest)
cd apps/client
npm run test

# Backend tests (if available)
cd apps/server
npm test
```

---

## 📦 Turborepo Commands

```bash
# Build all packages in dependency order
npm run build

# Run all packages in dev mode
npm run dev

# Run tests across all packages
npm run test

# Lint all packages
npm run lint

# Build a specific package
npx turbo build --filter=talentradar_client
npx turbo build --filter=talentradar_server
```

Turborepo provides:
- ✅ **Parallel execution** of independent tasks
- ✅ **Dependency-aware scheduling** (builds in correct order)
- ✅ **Incremental builds** (only rebuilds what changed)
- ✅ **Remote caching** (optional, for CI/CD speedup)

---

## 🔒 Security Features

- JWT-based authentication with separate scopes
- Password hashing with bcrypt
- Rate limiting on auth and API endpoints
- CORS protection
- Helmet security headers
- Environment-based configuration
- Zod validation on all inputs

---

## 📈 Future Enhancements

- [ ] Candidate login (currently VA communication is external)
- [ ] Video interview scheduling integration (Calendly/Zoom)
- [ ] Email notifications (offer sent, interview scheduled, etc.)
- [ ] Payment gateway integration (Stripe)
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Mobile app (React Native)

---

## 🤝 Contributing

This is a job application demo project, but feedback and suggestions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is built for demonstration purposes as part of a job application.

---

## 📧 Contact

Built by Kevin for Remote Leverage

- LinkedIn: [https://www.linkedin.com/in/kevinciang1006/]
- Email: [kevinciang1006@gmail.com]

---

## 🙏 Acknowledgments

- **Remote Leverage** for the opportunity and business model inspiration
- **shadcn/ui** for beautiful, accessible components
- **Lovable.dev** for initial frontend scaffolding
- **Turborepo** team for excellent monorepo tooling

---

**Made with ❤️ and TypeScript**
