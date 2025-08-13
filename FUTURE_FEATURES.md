# Future Features & Improvements

This file tracks potential features, improvements, and technical debt to address after the MVP is complete.

## 🚀 Future Features

### Logo & Branding
- [ ] Use Public Suffix List (tldextract) for better domain extraction
  - Handle edge cases like amazon.co.uk, company.com.br
  - Current solution works for 90%+ of email marketing cases
- [ ] Add caching for company logos to reduce API calls
- [ ] Fallback to Google Image Search API for missing logos
- [ ] Add company brand color extraction from logos

### Email Processing
- [ ] Better OCR accuracy for complex images in emails
- [ ] Extract promotional images and analyze them for deals
- [ ] Parse email templates to extract structured data
- [ ] Handle different email formats (plain text, rich HTML, etc.)

### AI & Analytics
- [ ] Track coupon usage patterns
- [ ] Smart categorization of offers
- [ ] Personalized recommendations based on user preferences
- [ ] Duplicate coupon detection across emails

### Online vs. In-Store
- [ ] Online vs In-store offer classification (online only, in-store only, both, not specified)

### User Experience
- [ ] Push notifications for new high-value coupons
- [ ] Dark mode support
- [ ] Accessibility improvements
- [ ] Offline mode for saved coupons

### Performance & Reliability
- [ ] Database for coupon storage (currently in-memory)
- [ ] Rate limiting for Gmail API
- [ ] Background job processing for email analysis
- [ ] Error recovery and retry mechanisms
- [ ] API response caching
- [ ] API response is really slow right now for /api/coupons

### Security & Privacy
- [ ] User authentication and personal coupon lists
- [ ] Secure token storage
- [ ] GDPR compliance for email data
- [ ] Rate limiting on API endpoints

## 🔧 Technical Debt

### Code Quality
- [ ] Add comprehensive unit tests
- [ ] Set up CI/CD pipeline
- [ ] Add type hints throughout codebase
- [ ] Code linting and formatting (black, flake8)
- [ ] API documentation with Swagger/OpenAPI

### Architecture
- [ ] Separate email processing into microservice
- [ ] Add proper logging with structured logs
- [ ] Environment-specific configurations
- [ ] Database migrations system
- [ ] Docker containerization

### Frontend
- [ ] Add proper state management (Redux/Zustand)
- [ ] Component testing with Jest/React Testing Library
- [ ] Performance optimization (lazy loading, memoization)
- [ ] Progressive Web App (PWA) features

## 📋 Known Issues & Limitations

### Current Limitations
- [ ] Limited to Gmail only (no Outlook, Yahoo, etc.)
- [ ] No persistent storage (data lost on app restart)
- [ ] Hardcoded API IP address for React Native

### Bug Fixes
- [ ] Handle malformed email headers gracefully
- [ ] Better error messages for network failures
- [ ] Loading states for slow API calls

## 🎯 Post-MVP Priorities

### Phase 1 (Core Improvements)
1. Add database storage
2. Implement caching
3. Add unit tests
4. Better error handling

### Phase 2 (User Experience)
1. Push notifications
2. Dark mode
3. Improved UI/UX
4. Performance optimizations

### Phase 3 (Advanced Features)
1. Multiple email providers
2. AI-powered recommendations
3. Usage analytics
4. Social features

---

## 📝 Decision Log

### Domain Extraction
**Decision**: Use simple subdomain stripping instead of Public Suffix List
**Reason**: Current approach handles 90%+ of email marketing cases, keep MVP simple
**Future**: Migrate to tldextract library when encountering edge cases

### Logo Sources
**Decision**: Use Google Favicons, Clearbit, Logo.dev with fallback
**Reason**: Good coverage, free/cheap, reliable
**Future**: Add Google Image Search API for missing logos

---

*Last updated: August 12, 2025*
