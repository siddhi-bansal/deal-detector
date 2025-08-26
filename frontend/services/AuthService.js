/**
 * Authentication API service
 */

const API_BASE_URL = 'https://deal-detector-production.up.railway.app'; // Your backend URL

class AuthService {
  
  /**
   * Authenticate user with Google authorization code
   * @param {string} authCode - Google authorization code from OAuth flow
   * @returns {Promise<{success: boolean, token?: string, user?: any, message?: string}>}
   */
  async googleAuth(authCode) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: authCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          token: data.access_token,
          user: data.user,
        };
      } else {
        return {
          success: false,
          message: data.detail || 'Google authentication failed',
        };
      }
    } catch (error) {
      console.error('Google auth error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  }

  /**
   * Authenticate user with Google ID token
   * @param {string} idToken - Google ID token from Google Sign-In
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async authenticateWithGoogle(idToken) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_token: idToken,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: {
            token: data.access_token,
            user: data.user,
          },
        };
      } else {
        return {
          success: false,
          error: data.detail || 'Authentication failed',
        };
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }
  }

  /**
   * Get current user information
   * @param {string} token - JWT token
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getCurrentUser(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
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
          error: data.detail || 'Failed to get user information',
        };
      }
    } catch (error) {
      console.error('Get user error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }
  }

  /**
   * Get Gmail connection status
   * @param {string} token - JWT token
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getGmailStatus(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/gmail/status`, {
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
          error: data.detail || 'Failed to get Gmail status',
        };
      }
    } catch (error) {
      console.error('Gmail status error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }
  }

  /**
   * Get Gmail connection URL
   * @param {string} token - JWT token
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getGmailConnectionUrl(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/gmail/connect`, {
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
          error: data.detail || 'Failed to get Gmail connection URL',
        };
      }
    } catch (error) {
      console.error('Gmail connection URL error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }
  }

  /**
   * Disconnect Gmail account
   * @param {string} token - JWT token
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async disconnectGmail(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/gmail/disconnect`, {
        method: 'POST',
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
          error: data.detail || 'Failed to disconnect Gmail',
        };
      }
    } catch (error) {
      console.error('Gmail disconnect error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.',
      };
    }
  }

  /**
   * Logout user
   * @param {string} token - JWT token
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async logout(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return { success: true };
      } else {
        const data = await response.json();
        return {
          success: false,
          error: data.detail || 'Logout failed',
        };
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, we can still logout locally
      return { success: true };
    }
  }
}

export default new AuthService();
