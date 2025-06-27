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

export interface DeleteUserResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface RestoreUserResponse {
  success: boolean;
  data?: User;
  message?: string;
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

  static async deleteUser(): Promise<DeleteUserResponse> {
    try {
      console.log('UserService.deleteUser called');
      
      const response = await fetch(`${this.BASE_URL}/users/`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      console.log('Delete response status:', response.status);
      console.log('Delete response ok:', response.ok);

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
        console.error('Delete failed with response:', errorText);
        return {
          success: false,
          error: `Failed to delete user: ${response.statusText}`
        };
      }

      const result = await response.json();
      console.log('Delete result received:', result);
      
      return {
        success: true,
        message: result.message || 'User deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async restoreUser(email: string, otp: string): Promise<RestoreUserResponse> {
    try {
      console.log('UserService.restoreUser called with email:', email);
      
      const formData = new FormData();
      formData.append('email', email);
      formData.append('otp', otp);
      
      const response = await fetch(`${this.BASE_URL}/users/retrieve`, {
        method: 'POST',
        body: formData,
      });

      console.log('Restore response status:', response.status);
      console.log('Restore response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Restore failed with response:', errorText);
        
        let errorMessage = 'Failed to restore user account';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          // If parsing fails, use the raw text
          errorMessage = errorText;
        }
        
        return {
          success: false,
          error: errorMessage
        };
      }

      const restoredUser: User = await response.json();
      console.log('Restored user received:', restoredUser);
      
      return {
        success: true,
        data: restoredUser,
        message: 'Account restored successfully'
      };
    } catch (error) {
      console.error('Error restoring user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export default UserService; 