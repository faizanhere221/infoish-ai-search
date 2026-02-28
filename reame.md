# 🚀 Infoishai - Tech Creator Sponsorship Marketplace

<div align="center">

![Infoishai Banner](https://via.placeholder.com/1200x400/7c3aed/ffffff?text=Infoishai+-+Tech+Creator+Marketplace)

**The marketplace where AI, SaaS, and tech brands find verified content creators for authentic sponsorships.**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?logo=supabase)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635bff?logo=stripe)](https://stripe.com/)

[Live Demo](https://infoishai.com) · [Documentation](#-documentation) · [Report Bug](https://github.com/infoishai/marketplace/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Routes](#-api-routes)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

Infoishai is a full-stack marketplace platform that connects tech brands with verified content creators for sponsorships. Built for the AI, SaaS, and developer tools ecosystem.

### For Brands
- Discover 2,000+ verified tech creators
- Filter by niche, platform, followers, and engagement
- Secure escrow payments
- Built-in messaging and contract management

### For Creators
- Get discovered by top tech brands
- Set your own rates and services
- Secure payments via Stripe Connect
- Build your reputation with reviews

---

## ✨ Features

### Core Features
- 🔐 **Authentication** - Email/password auth with Supabase
- 👤 **User Profiles** - Separate flows for creators and brands
- 🔍 **Creator Discovery** - Advanced search and filtering
- 💼 **Deal Management** - Full deal lifecycle tracking
- 💬 **Messaging** - Real-time chat between parties
- 💳 **Payments** - Stripe Connect with escrow protection
- ⭐ **Reviews** - Rating system for completed deals
- 🔔 **Notifications** - Email and push notifications
- ⚙️ **Settings** - Profile, security, payments, appearance

### Technical Features
- 📱 **Responsive Design** - Mobile-first approach
- 🎨 **Modern UI** - Tailwind CSS with custom components
- 🔒 **Row Level Security** - Supabase RLS policies
- 📊 **Analytics Ready** - Built-in tracking hooks
- 🚀 **SEO Optimized** - Meta tags, structured data, sitemap

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **Payments** | Stripe + Stripe Connect |
| **Icons** | Lucide React |
| **Forms** | React Hook Form + Zod |
| **State** | React Hooks |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn
- Supabase account
- Stripe account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/infoishai/marketplace.git
   cd marketplace
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your credentials (see [Environment Variables](#-environment-variables))

4. **Set up the database**
   - Go to your Supabase SQL Editor
   - Run the contents of `supabase/migration-varchar.sql`

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the app**
   Visit [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
infoishai-marketplace/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth pages (login, signup)
│   │   ├── api/                # API routes
│   │   ├── creators/           # Creator discovery & profiles
│   │   ├── dashboard/          # User dashboards
│   │   ├── messages/           # Messaging system
│   │   ├── settings/           # User settings
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Homepage
│   │
│   ├── components/             # React components
│   │   ├── creator/            # Creator-related components
│   │   ├── dashboard/          # Dashboard components
│   │   ├── deals/              # Deal components
│   │   ├── landing/            # Landing page sections
│   │   ├── marketplace/        # Search & filter components
│   │   └── messaging/          # Chat components
│   │
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility libraries
│   ├── types/                  # TypeScript types
│   └── utils/                  # Helper functions
│
├── supabase/                   # Database files
│   ├── schema.sql              # Full schema (fresh install)
│   └── migration-varchar.sql   # Safe migration
│
├── public/                     # Static assets
├── .env.example                # Environment template
├── tailwind.config.js          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies
```

---

## 🗄 Database Schema

### Tables Overview

| Table | Description |
|-------|-------------|
| `users` | Base authentication table |
| `creators` | Creator profiles and stats |
| `creator_platforms` | Social media accounts |
| `creator_services` | Services and pricing |
| `creator_portfolio` | Work samples |
| `brands` | Company profiles |
| `deals` | Sponsorship deals |
| `conversations` | Chat threads |
| `messages` | Chat messages |
| `reviews` | Ratings and feedback |
| `notifications` | User alerts |
| `saved_creators` | Brand bookmarks |
| `payments` | Transaction history |

### Entity Relationship

```
users
  ├── creators (1:1)
  │     ├── creator_platforms (1:N)
  │     ├── creator_services (1:N)
  │     └── creator_portfolio (1:N)
  │
  └── brands (1:1)
        └── saved_creators (1:N)

deals
  ├── creator_id → creators
  ├── brand_id → brands
  ├── messages (1:N)
  ├── reviews (1:1)
  └── payments (1:N)

conversations
  ├── creator_id → creators
  ├── brand_id → brands
  └── messages (1:N)
```

---

## 🔌 API Routes

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |

### Creators
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/creators` | List/search creators |
| GET | `/api/creators/[id]` | Get creator profile |
| PUT | `/api/creators/[id]` | Update creator profile |

### Brands
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/brands` | Get brand profile |
| PUT | `/api/brands` | Update brand profile |

### Deals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/deals` | List user's deals |
| POST | `/api/deals` | Create new deal |
| GET | `/api/deals/[id]` | Get deal details |
| PUT | `/api/deals/[id]` | Update deal |
| POST | `/api/deals/[id]/accept` | Creator accepts deal |
| POST | `/api/deals/[id]/deliver` | Submit deliverables |
| POST | `/api/deals/[id]/approve` | Brand approves work |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversations` | List conversations |
| GET | `/api/messages` | Get messages |
| POST | `/api/messages` | Send message |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/stripe/checkout` | Create payment intent |
| POST | `/api/stripe/connect` | Stripe Connect onboarding |
| POST | `/api/stripe/webhook` | Handle Stripe webhooks |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reviews` | Get reviews |
| POST | `/api/reviews` | Create review |

---

## 🔐 Environment Variables

Create a `.env.local` file with the following:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Infoishai

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyxxxxx

# Authentication
JWT_SECRET=your-secret-key-min-32-characters-long

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Email (Optional)
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=hello@infoishai.com

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/infoishai/marketplace)

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- AWS Amplify
- Netlify
- Railway
- DigitalOcean App Platform

---

## 📝 Scripts

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript check
```

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

## 👨‍💻 Author

**Faizan** - Founder & CEO of Infoishai

- Website: [infoishai.com](https://infoishai.com)
- Twitter: [@infoishai](https://twitter.com/infoishai)
- LinkedIn: [Infoishai](https://linkedin.com/company/infoishai)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [Stripe](https://stripe.com/) - Payment processing
- [Lucide](https://lucide.dev/) - Beautiful icons

---

<div align="center">

**Built with ❤️ for the tech community**

[⬆ Back to top](#-infoishai---tech-creator-sponsorship-marketplace)

</div>