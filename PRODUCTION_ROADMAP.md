# Deal Detector - Production Rollout Roadmap

## Overview
This document outlines the key features and architectural changes needed to transform the Deal Detector app from a personal prototype to a production-ready multi-user application.

## Current State
- ✅ Core AI-powered coupon extraction working
- ✅ Frontend UI with smooth animations
- ✅ Gmail API integration (single user - your account)
- ✅ Backend API with FastAPI
- ❌ No user authentication
- ❌ No multi-user support
- ❌ Gmail integration tied to single Google Cloud project

## Phase 1: User Authentication & Database 🔐
**Timeline: 1-2 weeks**

### Backend Changes
- [ ] Add user authentication system (JWT-based)
- [ ] Set up database (PostgreSQL/SQLite)
- [ ] User registration/login endpoints
- [ ] Password hashing and security
- [ ] Session management

### Frontend Changes
- [ ] Login/Register screens
- [ ] Authentication state management
- [ ] Protected routes
- [ ] User profile editing

### Database Schema
```sql
Users Table:
- id (Primary Key)
- email (Unique)
- password_hash
- first_name
- last_name
- created_at
- updated_at
- gmail_connected (Boolean)

User_Gmail_Tokens Table:
- user_id (Foreign Key)
- access_token (Encrypted)
- refresh_token (Encrypted)
- token_expiry
- created_at
- updated_at

User_Coupons Table:
- id (Primary Key)
- user_id (Foreign Key)
- email_id (Gmail message ID)
- coupon_data (JSON)
- is_favorite (Boolean)
- created_at
```

## Phase 2: Gmail OAuth Per User 📧
**Timeline: 1-2 weeks**

### Multi-User Gmail Integration
- [ ] OAuth2 flow for each user
- [ ] Secure token storage per user
- [ ] Token refresh automation
- [ ] Gmail permission scopes per user

### Backend Implementation
```python
# New endpoints needed:
POST /auth/gmail/connect     # Start OAuth flow
GET /auth/gmail/callback     # Handle OAuth callback
POST /auth/gmail/disconnect  # Revoke tokens
GET /user/coupons           # Get user-specific coupons
```

### Security Considerations
- [ ] Encrypt stored Gmail tokens
- [ ] Implement token rotation
- [ ] Add rate limiting
- [ ] CORS configuration
- [ ] Environment-based secrets

## Phase 3: Enhanced User Experience 🎨
**Timeline: 1 week**

### Profile Management
- [ ] User dashboard with statistics
- [ ] Gmail connection status
- [ ] Data export functionality
- [ ] Account deletion (GDPR compliance)

### App Improvements
- [ ] Email sync status/progress
- [ ] Error handling for disconnected accounts
- [ ] Onboarding flow for new users
- [ ] Settings and preferences

## Phase 4: Deployment & DevOps 🚀
**Timeline: 1-2 weeks**

### Infrastructure
- [ ] Production database setup
- [ ] Environment configuration
- [ ] SSL certificates
- [ ] Domain setup
- [ ] CDN for frontend assets

### Deployment Options
**Option A: Traditional VPS/Cloud**
- [ ] Backend: Railway/Render/DigitalOcean
- [ ] Database: PostgreSQL on cloud
- [ ] Frontend: Vercel/Netlify

**Option B: Serverless**
- [ ] Backend: Vercel Functions/AWS Lambda
- [ ] Database: PlanetScale/Supabase
- [ ] Frontend: Vercel/Netlify

### Monitoring
- [ ] Error tracking (Sentry)
- [ ] Analytics (basic usage metrics)
- [ ] Performance monitoring
- [ ] Uptime monitoring

## Phase 5: Google Cloud Console Setup 🔧
**Timeline: 3-5 days**

### Multi-User Gmail Access
Current issue: Your app uses your personal Google Cloud project credentials.

**Solution: Production OAuth App**
1. [ ] Create production Google Cloud project
2. [ ] Configure OAuth consent screen for public use
3. [ ] Set up proper redirect URIs
4. [ ] Request Gmail API quota increase
5. [ ] Configure domain verification (if needed)

### OAuth Consent Screen Requirements
- [ ] App name and description
- [ ] Privacy policy URL
- [ ] Terms of service URL
- [ ] App domain verification
- [ ] Scope justification for Gmail access

## Technical Implementation Priority

### Week 1-2: Authentication Foundation
```bash
# Backend additions needed:
pip install python-jose[cryptography] passlib[bcrypt] python-multipart sqlalchemy psycopg2-binary

# New files to create:
backend/
├── auth/
│   ├── __init__.py
│   ├── models.py      # User models
│   ├── schemas.py     # Pydantic schemas
│   ├── crud.py        # Database operations
│   ├── auth.py        # JWT utilities
│   └── routes.py      # Auth endpoints
├── database/
│   ├── __init__.py
│   ├── connection.py  # DB connection
│   └── migrations/    # DB migrations
└── core/
    ├── __init__.py
    ├── config.py      # Environment config
    └── security.py    # Password hashing
```

### Week 3-4: Gmail Integration
```bash
# Modified files:
backend/gmail/
├── __init__.py
├── oauth.py          # Multi-user OAuth flow
├── service.py        # Gmail service per user
└── models.py         # Token storage models

# Frontend additions:
frontend/screens/
├── AuthScreen.js     # Login/Register
├── GmailSetupScreen.js # OAuth flow
└── SettingsScreen.js # Account management
```

## Security Checklist
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Secure headers
- [ ] Environment variables for secrets
- [ ] Token encryption at rest
- [ ] Secure logout (token invalidation)

## Legal/Compliance
- [ ] Privacy policy
- [ ] Terms of service
- [ ] GDPR compliance (EU users)
- [ ] Data retention policy
- [ ] Google API Terms compliance

## Next Immediate Steps

1. **Start with authentication** - This unblocks everything else
2. **Set up database** - Choose PostgreSQL for production scalability
3. **Create user models** - Foundation for multi-user architecture
4. **Implement JWT auth** - Secure session management

Would you like me to start implementing any specific phase? I recommend beginning with Phase 1 (Authentication) as it's the foundation for everything else.
