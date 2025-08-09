# Coupon Filtering System - Extended Version

This is an enhanced version of the coupon filtering system that automatically extracts and analyzes promotional offers from Gmail emails using AI.

## 🚀 Features

- **Gmail Integration**: Automatically fetches promotional emails using Gmail API
- **OCR Processing**: Extracts text from images in emails using Google Gemini
- **AI Analysis**: Uses Gemini AI to classify and extract coupon information
- **FastAPI Backend**: RESTful API with automatic documentation
- **React Native Frontend**: Mobile app for displaying coupons
- **Multi-Email Processing**: Analyzes multiple emails and filters for coupon content

## 🏗️ Architecture

```
Gmail API → Email Text + Image OCR → Gemini AI Analysis → FastAPI → React Native App
```

## 📋 Process Flow

1. **Email Fetching**: Uses Gmail API to retrieve promotional emails from CATEGORY_PROMOTIONS
2. **Text Extraction**: Extracts plain text and HTML content from emails
3. **Image OCR**: Uses Gemini AI to extract text from images within emails
4. **AI Classification**: Gemini AI classifies emails as coupon/non-coupon and extracts:
   - Company name
   - Offer type (coupon/sale/BOGO/free shipping)
   - Discount amount and type
   - Coupon codes
   - Expiry dates
   - Terms and conditions
   - And more...
5. **API Response**: Returns structured JSON with all coupon information
6. **Frontend Display**: React Native app displays coupons in an easy-to-read format

## 🛠️ Tech Stack

### Backend
- **Python 3.13+**
- **FastAPI** - Modern web framework with automatic API docs
- **Google Gemini AI** - For OCR and text analysis
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
      "has_coupon": true,
      "offers": [
        {
          "company": "Nike",
          "offer_type": "sale",
          "discount_amount": "40%",
          "coupon_code": "FLASH40",
          "expiry_date": "2024-12-15",
          "offer_title": "Flash Sale",
          // ... more fields
        }
      ]
    }
  ],
  "total_emails_processed": 10,
  "emails_with_coupons": 3
}
```

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
# Run FastAPI server
python api.py

# Access API at http://localhost:8000
# View docs at http://localhost:8000/docs
```

#### Frontend (React Native)
```bash
cd ../frontend
npm install
expo start
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

- View all extracted coupons
- Filter by company or offer type
- Search functionality
- Expiry date tracking
- Direct links to offers

## 🚀 Deployment

### Backend (Railway)
1. Connect GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on git push

### Frontend (App Stores)
1. Build production app with Expo
2. Submit to App Store and Google Play Store