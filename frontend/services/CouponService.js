/**
 * Coupon API service
 */

const API_BASE_URL = 'https://deal-detector-production.up.railway.app'; // Your backend URL

// Simple JWT decoder function for debugging
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { error: 'Invalid JWT format' };
    }
    
    const payload = JSON.parse(atob(parts[1]));
    const header = JSON.parse(atob(parts[0]));
    
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const isExpired = payload.exp ? (payload.exp < now) : false;
    
    console.log('JWT Debug:', {
      'Current time (seconds)': now,
      'Token expiry (seconds)': payload.exp,
      'Difference (seconds)': payload.exp - now,
      'Is expired': isExpired
    });
    
    return {
      header,
      payload,
      isExpired
    };
  } catch (error) {
    return { error: 'Failed to decode JWT: ' + error.message };
  }
}

class CouponService {
  
  /**
   * Get coupons from user's Gmail
   * @param {string} token - JWT token
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getCoupons(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/coupons`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: data,
        };
      } else {
        return {
          success: false,
          error: data.detail || 'Failed to get coupons',
        };
      }
    } catch (error) {
      console.error('Get coupons error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }
  }

  /**
   * Get HTML content of a specific email
   * @param {string} messageId - Gmail message ID
   * @param {string} token - JWT token
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getEmailHtml(messageId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/email_html/${messageId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: data,
        };
      } else {
        return {
          success: false,
          error: data.detail || 'Failed to get email HTML',
        };
      }
    } catch (error) {
      console.error('Get email HTML error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }
  }

  /**
   * Test API authentication
   * @param {string} token - JWT token
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async testAuth(token) {
    try {
      console.log('Testing auth with token:', token ? `${token.substring(0, 20)}...` : 'null');
      console.log('API_BASE_URL:', API_BASE_URL);
      
      // Decode and check JWT token
      if (token) {
        const decodedToken = decodeJWT(token);
        console.log('Decoded JWT:', decodedToken);
        
        if (decodedToken.error) {
          console.error('JWT decode error:', decodedToken.error);
          return { success: false, error: `Invalid token: ${decodedToken.error}` };
        }
        
        if (decodedToken.isExpired) {
          console.error('JWT token is expired');
          return { success: false, error: 'Token is expired. Please log in again.' };
        }
        
        console.log('JWT token is valid, proceeding with API call');
      } else {
        console.warn('No token provided for authentication test');
      }
      
      const response = await fetch(`${API_BASE_URL}/api/test-auth`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Auth test response status:', response.status);
      console.log('Auth test response ok:', response.ok);
      
      // Check content type to see if it's JSON
      const contentType = response.headers.get('content-type');
      console.log('Auth test response content-type:', contentType);
      
      let data;
      try {
        const responseText = await response.text();
        console.log('Auth test raw response:', responseText.substring(0, 200) + '...');
        
        if (contentType && contentType.includes('application/json')) {
          data = JSON.parse(responseText);
        } else {
          data = { detail: `Server error: ${responseText.substring(0, 100)}` };
        }
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        data = { detail: 'Failed to parse server response' };
      }
      
      console.log('Auth test response data:', data);

      if (response.ok) {
        return {
          success: true,
          data: data,
        };
      } else {
        console.error('Auth test failed with data:', data);
        return {
          success: false,
          error: data.detail || 'Authentication test failed',
        };
      }
    } catch (error) {
      console.error('Test auth network error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }
  }
}

export default new CouponService();
