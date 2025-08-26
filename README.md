# Coupon Filtering System - Extended Version

This is an enhanced version of the coupon filtering system that automatically extracts and analyzes promotional offers from Gmail emails using AI.

## 🚀 Features

- **Gmail Integration**: Automatically fetches promotional emails using Gmail API
- **OCR Processing**: Extracts text from images in emails using Google Gemini
- **Advanced AI Analysis**: Uses Gemini AI to classify and extract detailed coupon information including:
  - **Smart Company Detection**: Distinguishes between email sender and offer brand (useful for aggregators)
  - **15 Offer Type Classifications**: Precise categorization (discount, sale, coupon, free_shipping, bogo, bundle, cashback, loyalty_points, free_gift, subscription, clearance, flash_sale, new_customer, event, other)
  - **Intelligent Expiry Date Inference**: Automatically infers expiry dates from temporal keywords ("Weekly Sale" → end of week, "Flash Sale" → 24-48 hours, etc.)
  - **Product Category Detection**: Identifies what type of products offers apply to
  - **Comprehensive Offer Details**: Extracts discount amounts, coupon codes, terms, minimum purchase requirements, and additional benefits
- **Company Logo Integration**: Automatically fetches and displays company logos
- **Email HTML Viewing**: View original email content in WebView for full context
- **FastAPI Backend**: RESTful API with automatic documentation and file backup
- **React Native Frontend**: Mobile app with enhanced search, filtering, and favorites
- **Multi-Email Processing**: Analyzes 100+ emails efficiently with structured output
- **Enhanced Search & Filter**: Search by company, offer type, product category, and more
- **Persistent Favorites**: Save and manage favorite coupons with local storage

## 🚧 Current Status

- ✅ **Authentication System**: JWT-based auth with Google OAuth integration implemented
- ✅ **Backend Deployment**: Railway hosting with production API endpoints active
- ✅ **Frontend Development**: React Native app with Expo, authentication UI complete
- ✅ **Database Setup**: SQLite with user management and authentication tables
- ✅ **OAuth Flow**: Debugging Expo auth proxy with @siddhibansal namespace
- 🔄 **Modify /api/coupons**: Modify to use stored database credentials instead of token.json and credentials.json
- 🔄 **Gmail Integration**: Pending OAuth resolution for individual user connections
- 📝 **Next Steps**: Complete OAuth debugging, implement per-user Gmail access, need to see if Clearbit is actually working because there is no API key in .env

## 🏗️ Architecture

```
Gmail API → Email Text + Image OCR → Gemini AI Analysis → FastAPI → React Native App
```

## 📋 Process Flow

1. **Email Fetching**: Uses Gmail API to retrieve promotional emails from CATEGORY_PROMOTIONS
2. **Text Extraction**: Extracts plain text and HTML content from emails
3. **Image OCR**: Uses Gemini AI to extract text from images within emails
4. **Advanced AI Classification**: Gemini AI analyzes emails and extracts:
   - **Email sender company** vs **offer brand** (handles aggregator emails)
   - **Offer type** from 15 specific categories (discount, sale, coupon, free_shipping, bogo, bundle, cashback, loyalty_points, free_gift, subscription, clearance, flash_sale, new_customer, event, other)
   - **Smart expiry date inference** from temporal keywords and email context
   - **Product categories** that offers apply to
   - **Discount amounts and coupon codes**
   - **Terms, conditions, and minimum purchase requirements**
   - **Call-to-action phrases and additional benefits**
5. **Company Logo Integration**: Automatically fetches company logos using multiple sources
6. **API Response & Backup**: Returns structured JSON and saves backup file locally
7. **Frontend Display**: React Native app displays coupons with enhanced search, filtering, and visual hierarchy

## 🛠️ Tech Stack

### Backend
- **Python 3.13+**
- **FastAPI** - Modern web framework with automatic API docs
- **Google Gemini AI** - For OCR and text analysis of email to extract coupon information in JSON format
- **Gmail API** - For email access
- **PIL/Pillow** - Image processing
- **BeautifulSoup** - HTML parsing

### Frontend
- **React Native/Expo** - Cross-platform mobile app
- **TypeScript** - Type-safe development

### Deployment
- **Railway** - Backend API hosting
- **App Store/Play Store** - Mobile app distribution

## 📚 API Documentation

### Endpoints

#### `GET /api/coupons`
Processes all promotional emails and returns coupon information.

**Response:**
```json
{
  "all_coupons": [
    {
      "timestamp": "2025-08-12 19:31:40",
      "subject": "🚨 Ends soon! 20% off move-in day faves with Target Circle.",
      "sender": "Target <targetnews@em.target.com>",
      "message_id": "123a1a1234ab1abc",
      "company_domain": "target.com",
      "company_logo_url": "https://logo.clearbit.com/target.com",
      "email_sender_company": "Target",
      "offers": [
        {
          "offer_brand": "Target",
          "offer_type": "discount",
          "discount_amount": "20%",
          "coupon_code": null,
          "expiry_date": "2025-08-18",
          "offer_title": "20% off move-in day faves",
          "offer_description": "20% off move-in day favorites with Target Circle.",
          "minimum_purchase": null,
          "terms_conditions": "Requires Target Circle. Some restrictions apply.",
          "call_to_action": "Shop Now",
          "product_category": "move-in day faves",
          "additional_benefits": []
        }
      ]
    }
  ],
  "total_emails_processed": 100,
  "emails_with_coupons": 61
}
```

**Key Fields:**
- `email_sender_company`: The actual company sending the email
- `offer_brand`: The brand/company the specific offer is for (may differ for aggregators)
- `offer_type`: Specific classification (discount, sale, coupon, free_shipping, bogo, bundle, cashback, loyalty_points, free_gift, subscription, clearance, flash_sale, new_customer, event, other)
- `product_category`: What type of products the offer applies to
- `expiry_date`: Automatically inferred from temporal keywords when not explicitly stated
- `company_logo_url`: Automatically fetched company logo
- `additional_benefits`: Array of extra perks like free shipping, returns, etc.

#### `GET /api/email_html/{message_id}`
Fetches the original HTML content of a specific email by message ID.

**Parameters:**
- `message_id` (string): The Gmail message ID

**Response:**
```json
{
  "success": true,
  "message_id": "18f2a1b2c3d4e5f6",
  "html_content": "<html><body>Original email HTML content...</body></html>",
  "error": null
}
```

**Use Case:** Allows users to view the original email content in a WebView for full context.

#### `GET /api/health`
Health check endpoint.

#### `GET /docs`
Interactive API documentation (Swagger UI).

## 🚀 Getting Started

### Prerequisites
- Python 3.13+
- Gmail API credentials
- Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd coupon_filtering/extended_version
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   Create a `.env` file:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Set up Gmail API**
   - Place `credentials.json` in the project directory
   - Run the app once to complete OAuth flow

### Running the Application

#### Backend API
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Run FastAPI server locally
python api.py

# Or run with uvicorn for production
uvicorn api:app --host 0.0.0.0 --port 8000

# Access API at http://localhost:8000 (local) or https://deal-detector-production.up.railway.app (production)
# View docs at http://localhost:8000/docs (local) or https://deal-detector-production.up.railway.app/docs (production)
```

#### Frontend (React Native)
```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Start Expo development server
npx expo start

# Or use yarn
yarn install
yarn start

# Follow the QR code to open on mobile device
# Or press 'w' to open in web browser
```

## 🔧 Configuration

### Gmail API Setup
1. Enable Gmail API in Google Cloud Console
2. Create credentials and download `credentials.json`
3. Set up OAuth consent screen

### Gemini API Setup
1. Get API key from Google AI Studio
2. Add to `.env` file as `GEMINI_API_KEY`

## 📱 Mobile App Features

- **Enhanced Tab Navigation**: Home, Add Coupon, Favorites, and Profile tabs
- **Rich Coupon Display**: View all extracted coupons with company logos, offer types, and product categories
- **Advanced Search & Filter**: 
  - Search by company name, offer brand, product category, or any text
  - Filter by 15 different offer types (discount, sale, coupon, free_shipping, bogo, bundle, etc.)
  - Sort by company, discount amount, expiry date, or offer type
- **Company Hierarchy Display**: Clear distinction between email sender and offer brand
- **Smart Expiry Tracking**: Visual indicators for expiring coupons with inferred expiry dates
- **Product Category Tags**: See what products each offer applies to
- **Persistent Favorites**: Heart button to save/unsave coupons with local storage
- **Original Email Viewing**: "Go to Email" button to view original HTML email content in WebView
- **Manual Entry**: Add custom coupons manually with comprehensive form
- **Profile Statistics**: View total coupons, favorites count, and detailed app analytics
- **Direct Action Links**: Quick access to store websites, specific offers, and company domains
- **Responsive Design**: Consistent emerald green theme with improved spacing and visual hierarchy

## 🚀 Deployment

### Backend (Railway)
```bash
# The backend is automatically deployed to Railway
# Production URL: https://deal-detector-production.up.railway.app

# To deploy updates:
git add .
git commit -m "Your commit message"
git push origin main

# Railway will automatically rebuild and redeploy
```

1. Connect GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on git push
4. Generated domain: `deal-detector-production.up.railway.app`

### Frontend (Expo/App Stores)
```bash
# For development
npx expo start

# For production build
npx expo build:android
npx expo build:ios

# Or use EAS Build (recommended)
npx eas build --platform android
npx eas build --platform ios
```

1. Build production app with Expo
2. Submit to App Store and Google Play Store