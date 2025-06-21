export interface User {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone_number: string;
  gender: 'male' | 'female' | 'other';
  created_at: string;
  updated_at: string;
}

export interface UserApiResponse {
  success: boolean;
  data?: User;
  error?: string;
}

class UserService {
  private static readonly BASE_URL = 'http://localhost:8081';

  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  static async getCurrentUser(): Promise<UserApiResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}/auth/me`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return {
          success: false,
          error: 'Authentication expired. Please log in again.'
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to fetch user data: ${response.statusText}`
        };
      }

      const userData: User = await response.json();
      
      return {
        success: true,
        data: userData
      };
    } catch (error) {
      console.error('Error fetching current user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async updateUser(userData: Partial<User>): Promise<UserApiResponse> {
    try {
      console.log('UserService.updateUser called with:', userData);
      
      const response = await fetch(`${this.BASE_URL}/auth/me`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData),
      });

      console.log('Update response status:', response.status);
      console.log('Update response ok:', response.ok);

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return {
          success: false,
          error: 'Authentication expired. Please log in again.'
        };
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update failed with response:', errorText);
        return {
          success: false,
          error: `Failed to update user data: ${response.statusText}`
        };
      }

      const updatedUser: User = await response.json();
      console.log('Updated user received:', updatedUser);
      
      return {
        success: true,
        data: updatedUser
      };
    } catch (error) {
      console.error('Error updating user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export default UserService; 