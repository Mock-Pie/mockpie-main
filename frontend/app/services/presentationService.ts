export interface Presentation {
  id: number;
  title: string;
  url: string;
  is_public: boolean;
  uploaded_at: string;
  file_info?: {
    file_size?: number;
    file_exists?: boolean;
  };
}

export interface PresentationsResponse {
  videos: Presentation[];
  total: number;
  skip: number;
  limit: number;
}

export interface PresentationApiResponse {
  success: boolean;
  data?: PresentationsResponse | Presentation;
  error?: string;
}

class PresentationService {
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

  static async getUserPresentations(skip: number = 0, limit: number = 50): Promise<PresentationApiResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}/presentations/?skip=${skip}&limit=${limit}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (response.status === 401) {
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
          error: `Failed to fetch presentations: ${response.statusText}`
        };
      }

      const data: PresentationsResponse = await response.json();
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error fetching presentations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async getPresentationDetails(presentationId: number): Promise<PresentationApiResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}/presentations/${presentationId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (response.status === 401) {
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
          error: `Failed to fetch presentation details: ${response.statusText}`
        };
      }

      const data: Presentation = await response.json();
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error fetching presentation details:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async deletePresentation(presentationId: number): Promise<PresentationApiResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}/presentations/${presentationId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (response.status === 401) {
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
          error: `Failed to delete presentation: ${response.statusText}`
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error deleting presentation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async togglePresentationVisibility(presentationId: number): Promise<PresentationApiResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}/presentations/${presentationId}/toggle-visibility`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
      });

      if (response.status === 401) {
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
          error: `Failed to toggle presentation visibility: ${response.statusText}`
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error toggling presentation visibility:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async uploadPresentation(
    file: File, 
    title: string, 
    language: string = 'english',
    isPublic: boolean = false,
    onProgress?: (progress: number) => void
  ): Promise<PresentationApiResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('language', language);
      formData.append('is_public', isPublic.toString());

      const token = localStorage.getItem('access_token');
      if (!token) {
        return {
          success: false,
          error: 'No authentication token found'
        };
      }

      // Create XMLHttpRequest for progress tracking
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            resolve({
              success: false,
              error: 'Authentication expired. Please log in again.'
            });
            return;
          }

          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve({
                success: true,
                data
              });
            } catch (error) {
              resolve({
                success: false,
                error: 'Failed to parse server response'
              });
            }
          } else {
            resolve({
              success: false,
              error: `Upload failed: ${xhr.statusText}`
            });
          }
        });

        xhr.addEventListener('error', () => {
          resolve({
            success: false,
            error: 'Network error during upload'
          });
        });

        xhr.open('POST', `${this.BASE_URL}/presentations/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });
    } catch (error) {
      console.error('Error uploading presentation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static formatFileSize(bytes?: number): string {
    if (!bytes) return 'Unknown';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  static formatDuration(seconds?: number): string {
    if (!seconds) return 'Unknown';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

export default PresentationService; 