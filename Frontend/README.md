# 🎨 DigiQMS Frontend

**Enterprise-grade queue management interface built with Next.js 14, TypeScript, and real-time WebSocket technology.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🚀 Live Demo

- **Production**: [Your Vercel URL]
- **API Backend**: https://dqms-backend.fly.dev

---

## ✨ Features

### Core Features
- 🎫 **Digital Token Dashboard** - Real-time queue position tracking
- 🔔 **Live Notifications** - WebSocket-powered instant updates
- 📍 **Geolocation Integration** - Presence verification with distance tracking
- 🎨 **Elite UI/UX** - Premium animations with Framer Motion
- 📱 **Mobile-First Design** - Fully responsive, PWA-ready
- 🔐 **Secure Authentication** - Email + Phone OTP verification
- 📊 **Admin Analytics** - Comprehensive dashboard with real-time metrics
- 🌙 **Dark Mode Ready** - Sophisticated color schemes

### Advanced Features
- ⚡ **Real-Time Updates** - Socket.IO WebSocket connection
- 🎭 **Smooth Animations** - Framer Motion transitions
- 🎯 **Type-Safe** - Full TypeScript coverage
- 🔄 **Auto-Reconnect** - Resilient WebSocket handling
- 📈 **Performance Optimized** - Code splitting, lazy loading
- 🎨 **Gradient Designs** - Modern, professional aesthetics

---

## 🛠️ Tech Stack

| Technology | Purpose | Version |
|-----------|---------|---------|
| **Next.js 14** | React framework with App Router | 14.1.0 |
| **TypeScript** | Type safety | 5.x |
| **TailwindCSS** | Utility-first CSS | 3.4.1 |
| **Framer Motion** | Animations | 10.18.0 |
| **Socket.io Client** | Real-time WebSocket | 4.6.1 |
| **Axios** | HTTP client | 1.6.5 |
| **Lucide React** | Icon library | Latest |
| **Recharts** | Analytics charts | 2.10.3 |

---

## 📁 Project Structure

```
frontend/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── services/
│   │   └── page.tsx                # Service selection
│   ├── token/[id]/
│   │   └── page.tsx                # Token dashboard (⭐ Main feature)
│   ├── admin/
│   │   ├── page.tsx                # Admin dashboard
│   │   ├── analytics/              # Analytics dashboard
│   │   ├── queue/                  # Queue monitor
│   │   ├── services/               # Service management
│   │   ├── users/                  # User management
│   │   └── abuse/                  # Abuse reports
│   ├── layout.tsx                  # Root layout
│   └── globals.css                 # Global styles
├── components/
│   ├── analytics/                  # Analytics components
│   ├── auth/                       # Authentication forms
│   ├── token/                      # Token-related components
│   └── ui/                         # Reusable UI components
├── lib/
│   ├── api.ts                      # Axios API client
│   └── socket.tsx                  # Socket.IO provider
├── hooks/                          # Custom React hooks
├── public/                         # Static assets
├── Dockerfile                      # Docker configuration
├── next.config.js                  # Next.js configuration
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.x
- npm or yarn

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd DigiQMS/frontend

# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Edit .env.local with your backend URL

# Run development server
npm run dev
```

### Access Application
- **Local**: http://localhost:3000
- **Backend API**: http://localhost:4000/api (or your deployed backend)

---

## ⚙️ Configuration

### Environment Variables

Create `.env.local`:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:4000/api
# Or production: https://dqms-backend.fly.dev/api

# WebSocket URL
NEXT_PUBLIC_WS_URL=http://localhost:4000
# Or production: https://dqms-backend.fly.dev
```

---

## 🐳 Docker Deployment

### Build Image
```bash
docker build -t dqms-frontend .
```

### Run Container
```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://dqms-backend.fly.dev/api \
  -e NEXT_PUBLIC_WS_URL=https://dqms-backend.fly.dev \
  dqms-frontend
```

---

## 📦 Build for Production

```bash
# Create optimized production build
npm run build

# Start production server
npm start
```

---

## 🎯 Key Pages

### 1. Landing Page (`/`)
- Service overview
- Quick access to token generation
- Responsive hero section

### 2. Service Selection (`/services`)
- Browse available services
- View service details and wait times
- Start token generation flow

### 3. Token Dashboard (`/token/[id]`)
**Main Feature - Real-time Queue Tracking**
- Live queue position updates
- Estimated wait time
- Presence status indicator
- Distance from service location
- People ahead/behind counter
- Cancel token option
- WebSocket-powered live updates

### 4. Admin Dashboard (`/admin`)
- System overview statistics
- Quick actions panel
- Recent activity feed
- Premium Analytics highlight section

### 5. Analytics Dashboard (`/admin/analytics`)
- Real-time metrics visualization
- Date range filtering
- Service performance charts
- Queue statistics
- Token distribution analysis

### 6. Queue Monitor (`/admin/queue`)
- Live queue status
- Filter by service/status
- Call next token
- Complete/cancel tokens
- Real-time updates

---

## 🎨 UI/UX Highlights

### Design Philosophy
- **Enterprise-Grade**: Professional, polished aesthetics
- **Dark-to-Light Gradients**: Sophisticated color schemes
- **Micro-Animations**: Smooth, purposeful transitions
- **Glassmorphism**: Modern backdrop blur effects
- **Responsive**: Mobile-first, adaptive layouts

### Color Palette
- **Primary**: Indigo/Purple gradients
- **Accents**: Blue, Cyan, Emerald
- **Neutrals**: Slate dark tones
- **Status**: Success (Green), Warning (Amber), Error (Red)

### Animation Strategy
- **Page Transitions**: Staggered fade-in with Framer Motion
- **Hover Effects**: Scale, glow, and color transitions
- **Loading States**: Skeleton screens and spinners
- **Real-time Updates**: Smooth number counting animations

---

## 🔌 API Integration

### HTTP Client (Axios)
```typescript
// lib/api.ts
- Automatic JWT token attachment
- Token refresh on 401
- Error handling
- Request/response interceptors
```

### WebSocket Client (Socket.IO)
```typescript
// lib/socket.tsx
- Auto-reconnection
- Event listeners for queue updates
- Room management (join/leave tokens)
- Connection state management
```

---

## 📱 Progressive Web App (PWA)

The app is PWA-ready with:
- Installable on mobile devices
- Offline-capable (with service worker)
- App-like experience
- Push notification support

---

## ⚡ Performance Optimizations

- **Code Splitting**: Automatic route-based splitting
- **Lazy Loading**: Dynamic imports for heavy components
- **Image Optimization**: Next.js Image component
- **Font Optimization**: Next.js Font optimization
- **Standalone Output**: Minimal Docker images (~150MB)
- **Static Generation**: Pre-rendered pages where possible

---

## 🧪 Testing

```bash
# Run tests (if configured)
npm run test

# E2E tests with Playwright
npm run test:e2e

# Lint code
npm run lint
```

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Or use Vercel Dashboard:**
1. Import GitHub repository
2. Set environment variables
3. Deploy

### Other Platforms
- **Netlify**: Connect GitHub repo
- **Railway**: Deploy from GitHub
- **Docker**: Use provided Dockerfile

---

## 📖 Additional Resources

- **[Next.js Documentation](https://nextjs.org/docs)**
- **[TailwindCSS Docs](https://tailwindcss.com/docs)**
- **[Framer Motion Guide](https://www.framer.com/motion/)**
- **[Socket.IO Client Docs](https://socket.io/docs/v4/client-api/)**

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- Next.js Team for the amazing framework
- Vercel for hosting platform
- Framer Motion for animation library
- TailwindCSS for utility-first CSS

---

**Built with ❤️ by Hamza Kamran**

**Status: ✅ Production Ready**
