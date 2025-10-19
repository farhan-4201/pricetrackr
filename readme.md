# 🛒 PriceTrackr - Pakistani Multi-Vendor Price Tracker

A comprehensive **Final Year Project (FYP)** that helps users track and compare product prices across popular Pakistani marketplaces (Daraz, PriceOye, Telemart) in real-time. The system provides **price comparison, historical trend analysis, price-drop notifications, and personalized watchlists** to enhance smart shopping decisions for Pakistani consumers.

![Project Status](https://img.shields.io/badge/Status-Active-success)
![Node.js Version](https://img.shields.io/badge/Node.js-18+-blue)
![React Version](https://img.shields.io/badge/React-18+-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-6+-green)

---

## 🚀 Key Features

### 🔍 **Smart Product Search**
- Search across multiple Pakistani marketplaces simultaneously
- Advanced filtering and sorting options
- Real-time search suggestions and autocomplete

### 🏷️ **Real-Time Price Comparison**
- Live price comparison with marketplace logos
- Price history tracking and trend analysis
- Interactive charts showing price fluctuations over time

### 📊 **Visual Analytics**
- Interactive price trend charts using Chart.js
- Marketplace comparison visualizations
- Historical price data with customizable time ranges

### 👤 **User Management**
- **Google OAuth 2.0** integration for seamless authentication
- Personalized watchlists for favorite products
- User profiles with customizable preferences

### 📬 **Smart Notifications**
- Email notifications for price drops using Nodemailer
- Customizable notification preferences
- Real-time alerts via WebSocket connections

### 🎨 **Modern UI/UX**
- **Dark/Light mode** support with system preference detection
- Fully responsive design using TailwindCSS
- Smooth animations with Framer Motion
- Modern component library (shadcn/ui)

### 🔧 **Technical Excellence**
- **Web scraping** with Puppeteer and Playwright for data extraction
- **Rate limiting** and security middleware
- **Real-time price monitoring** with background jobs
- **RESTful API** design with comprehensive documentation

---

## 🛠️ Technology Stack

### **Frontend**
- ⚛️ **React 18** with TypeScript for type safety
- ⚡ **Vite** for fast development and building
- 🎨 **TailwindCSS** for utility-first styling
- 🧩 **shadcn/ui** for accessible component library
- 📊 **Chart.js** & **react-chartjs-2** for data visualization
- 🎭 **Framer Motion** for smooth animations
- 🔗 **React Router** for client-side routing
- 📋 **React Hook Form** with Zod validation
- 🌙 **next-themes** for theme management

### **Backend**
- 🟢 **Node.js** with Express.js framework
- 🗄️ **MongoDB** with Mongoose ODM
- 🔐 **JWT** for stateless authentication
- 🔑 **Google OAuth 2.0** for social login
- 📧 **Nodemailer** for email services
- 🕷️ **Puppeteer** & **Playwright** for web scraping
- 🚦 **Express Rate Limit** for API protection
- 📝 **Winston** for logging
- 🔒 **Helmet** & **XSS-Clean** for security

### **Development Tools**
- 🧪 **Jest** for backend testing
- 🔍 **ESLint** for code quality
- 📦 **npm** for package management
- 🚀 **Vite** for frontend tooling

---

## 📂 Project Structure

```
pricetrackr/
│
├── 📁 **backend/** - Node.js/Express.js API Server
│   ├── 📁 **controllers/**     - Route controllers
│   │   └── 📄 scraper.controller.js
│   ├── 📁 **middleware/**      - Custom middleware
│   │   ├── 📄 auth.js         - JWT authentication
│   │   ├── 📄 googleAuth.js   - Google OAuth
│   │   ├── 📄 rateLimiter.js  - API rate limiting
│   │   └── 📄 validation.js   - Input validation
│   ├── 📁 **models/**         - MongoDB schemas
│   │   ├── 📄 user.js
│   │   ├── 📄 product.js
│   │   ├── 📄 watchlist.js
│   │   ├── 📄 notification.js
│   │   └── 📄 search_result.js
│   ├── 📁 **routes/**         - API routes
│   │   ├── 📄 users.js
│   │   ├── 📄 products.js
│   │   ├── 📄 watchlist.js
│   │   └── 📄 notifications.js
│   ├── 📁 **scrapers/**       - Web scraping modules
│   │   ├── 📄 daraz_api_scraper.js
│   │   ├── 📄 priceoye_api_scraper.js
│   │   ├── 📄 telemart_scraper.js
│   │   └── 📄 test_connectivity.js
│   ├── 📁 **utils/**          - Utility functions
│   │   └── 📄 mailer.js       - Email service
│   ├── 📄 server.js           - Main server file
│   ├── 📄 db.js              - Database connection
│   ├── 📄 price-monitor.js   - Background price monitoring
│   └── 📄 websocket.js       - WebSocket server
│
├── 📁 **frontend/** - React.js Application
│   ├── 📁 **public/**         - Static assets
│   ├── 📁 **src/**
│   │   ├── 📁 **components/** - Reusable UI components
│   │   │   ├── 📁 **ui/**     - Base UI components (shadcn/ui)
│   │   │   ├── 📄 SearchForm.tsx
│   │   │   ├── 📄 ProductResults.tsx
│   │   │   ├── 📄 PriceTrendChart.tsx
│   │   │   ├── 📄 MarketplaceComparisonChart.tsx
│   │   │   └── 📄 NotificationCenter.tsx
│   │   ├── 📁 **context/**    - React contexts
│   │   │   ├── 📄 AuthContext.tsx
│   │   │   └── 📄 ComparisonContext.tsx
│   │   ├── 📁 **hooks/**      - Custom React hooks
│   │   │   ├── 📄 useSearch.ts
│   │   │   ├── 📄 useToast.ts
│   │   │   └── 📄 useScrollReveal.ts
│   │   ├── 📁 **lib/**        - Utility libraries
│   │   │   ├── 📄 api.ts      - API client
│   │   │   └── 📄 utils.ts    - Helper functions
│   │   ├── 📁 **pages/**      - Route components
│   │   │   ├── 📄 Dashboard.tsx
│   │   │   ├── 📄 WatchlistPage.tsx
│   │   │   ├── 📄 Profile.tsx
│   │   │   └── 📄 Settings.tsx
│   │   ├── 📄 App.tsx         - Main app component
│   │   └── 📄 main.tsx        - App entry point
│   ├── 📄 package.json
│   ├── 📄 vite.config.ts
│   └── 📄 tailwind.config.js
│
├── 📄 **Project_Documentation.md** - Detailed project documentation
├── 📄 **readme.md**           - This file
└── 📄 **package.json**        - Root package configuration
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (v6 or higher)
- **Git** for version control

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/farhan-4201/Multi-vendor-be-.git
cd Multi-vendor-be-
```

### 2️⃣ Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration
```

### 3️⃣ Environment Configuration
Create a `.env` file in the `backend` directory:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/pricetrackr

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-here

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Server Configuration
PORT=5000
NODE_ENV=development

# Optional: AWS SES for production email
# AWS_ACCESS_KEY_ID=your-aws-access-key
# AWS_SECRET_ACCESS_KEY=your-aws-secret-key
# AWS_REGION=us-east-1
```

### 4️⃣ Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 5️⃣ Start the Application
```bash
# Terminal 1 - Backend API Server
cd backend
npm run dev

# Terminal 2 - Price Monitor (Background Service)
cd backend
npm run price-monitor

# Terminal 3 - Frontend Development Server
cd frontend
npm run dev
```

### 6️⃣ Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api-docs

### Live URLs
- **Backend (production)**: https://api.smartpricetracker.me/
- **Frontend (production)**: https://pricetrackr-woad.vercel.app/
- **MongoDB (Atlas)**: mongodb+srv://farhan:farhan123@cluster0.c5jz8kc.mongodb.net/Pricetracker

---

## 📋 API Endpoints

### 🔐 Authentication
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### 🔍 Product Search
- `GET /api/products/search` - Search products across marketplaces
- `GET /api/products/:id` - Get product details and price history
- `GET /api/products/:id/history` - Get price history data

### 📝 Watchlist Management
- `POST /api/watchlist` - Add product to watchlist
- `GET /api/watchlist` - Get user's watchlist
- `DELETE /api/watchlist/:id` - Remove from watchlist
- `PUT /api/watchlist/:id` - Update watchlist item

### 📬 Notifications
- `POST /api/notifications` - Configure notifications
- `GET /api/notifications` - Get notification settings
- `POST /api/notifications/test` - Test email notifications

---

## 🤝 Development

### Available Scripts

#### Backend
```bash
npm run dev          # Start development server with nodemon
npm start           # Start production server
npm run price-monitor # Run background price monitoring
npm test            # Run tests
npm run test-email  # Test email configuration
```

#### Frontend
```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run build:dev   # Build for development
npm run preview     # Preview production build
npm run lint        # Run ESLint
```

### 🧪 Testing
```bash
# Backend tests
cd backend && npm test

# Frontend linting
cd frontend && npm run lint
```

---

## 🚀 Deployment

### Backend Deployment
```bash
# Build and deploy to production
cd backend
npm run build  # If applicable
npm start      # Production server
```

### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy the dist/ folder to your hosting service
```

### Environment Setup for Production
- Use **MongoDB Atlas** for cloud database
- Configure **Google OAuth** production credentials
- Set up **Gmail App Password** or **AWS SES** for emails
- Use **PM2** or similar for process management

---

## 🔧 Supported Marketplaces

| Marketplace | Status | Data Source | Notes |
|-------------|--------|-------------|-------|
| **Daraz.pk** | ✅ Active | API + Scraping | Primary marketplace |
| **PriceOye** | ✅ Active | API + Scraping | Electronics focused |
| **Telemart** | ✅ Active | Web Scraping | Tech products |

*More marketplaces can be added by creating new scraper modules in `backend/scrapers/`*

---

## 📊 Architecture Highlights

### **Scalable Backend Architecture**
- **Modular scraper design** for easy marketplace integration
- **Background job processing** for price monitoring
- **WebSocket support** for real-time updates
- **Rate limiting** and security middleware

### **Modern Frontend Architecture**
- **Component-based architecture** with TypeScript
- **Context API** for state management
- **Custom hooks** for reusable logic
- **Responsive design** with mobile-first approach

### **Database Design**
- **Normalized schemas** for efficient queries
- **Indexing** for optimal performance
- **Aggregation pipelines** for complex analytics

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Contribution Guidelines
- Follow the existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

### **Marketplaces & APIs**
- **Daraz.pk** - Leading Pakistani e-commerce platform
- **PriceOye** - Electronics price comparison
- **Telemart** - Technology products marketplace

### **Open Source Libraries**
- **shadcn/ui** - Beautiful and accessible UI components
- **TailwindCSS** - Utility-first CSS framework
- **Chart.js** - Simple yet flexible charting library
- **Framer Motion** - Production-ready motion library

### **Development Tools**
- **Vite** - Next generation frontend tooling
- **Express.js** - Fast, unopinionated web framework
- **MongoDB** - Document database for modern applications

---

## 📞 Support & Contact

### **Getting Help**
- 📧 **Email**: support@pricetrackr.com
- 💬 **Issues**: [GitHub Issues](https://github.com/farhan-4201/Multi-vendor-be-/issues)
- 📖 **Documentation**: See `Project_Documentation.md` for detailed technical docs

### **Reporting Bugs**
1. Check existing issues to avoid duplicates
2. Create a new issue with detailed description
3. Include steps to reproduce, expected vs actual behavior
4. Add screenshots if applicable

### **Feature Requests**
- Use the [Feature Request](https://github.com/farhan-4201/Multi-vendor-be-/issues/new?template=feature_request.md) template
- Describe the feature and its use case
- Explain why it would be valuable

---

## 🎯 Roadmap

### **Phase 1** ✅ **Completed**
- [x] Basic price tracking for 3 marketplaces
- [x] User authentication with Google OAuth
- [x] Watchlist functionality
- [x] Email notifications

### **Phase 2** 🚧 **In Development**
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Price prediction algorithms
- [ ] Browser extension

### **Phase 3** 📋 **Planned**
- [ ] SMS notifications via Twilio
- [ ] Social features (product sharing)
- [ ] Affiliate program integration
- [ ] Multi-language support

---

## 📈 Performance Metrics

- **Response Time**: < 2 seconds for search queries
- **Uptime**: 99.5% target availability
- **Data Freshness**: Prices updated every 15-30 minutes
- **Scalability**: Supports 1000+ concurrent users

---

**🛒 Made with ❤️ for Pakistani shoppers - Save money, shop smarter! 🇵🇰**
