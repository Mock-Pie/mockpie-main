export interface UpcomingPresentation {
  id: string;
  topic: string;
  date: string;
  time: string;
  description: string;
  language?: string;
  type: 'upcoming';
  createdAt: string;
  updatedAt: string;
}

export interface UpcomingPresentationRequest {
  topic: string;
  date: string;
  time: string;
  description: string;
  language?: string;
}

export interface UpcomingPresentationResponse {
  success: boolean;
  data?: UpcomingPresentation | UpcomingPresentation[];
  error?: string;
}

class UpcomingPresentationService {
  private static readonly STORAGE_KEY = 'upcoming_presentations';
  private static readonly BASE_URL = 'http://localhost:8081';

  // Get auth headers for future API integration
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

  // Generate unique ID
  private static generateId(): string {
    return `upcoming_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Fetch all upcoming presentations for the current user from the backend.
   * Uses GET /upcoming-presentations/ endpoint which returns UpcomingPresentationList.
   * Maps backend fields (id, topic, presentation_date, created_at) to frontend format.
   */
  static async getUpcomingPresentations(): Promise<UpcomingPresentationResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}/upcoming-presentations/`, {
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
          error: `Failed to fetch upcoming presentations: ${response.statusText}`
        };
      }

      const data = await response.json();
      console.log('Backend response:', data); // Debug log
      
      // Backend returns: { upcoming_presentations: [...], total: number }
      // Map backend fields to frontend format
      const mappedPresentations = (data.upcoming_presentations || []).map((item: any) => ({
        id: item.id.toString(),
        topic: item.topic,
        date: item.presentation_date ? item.presentation_date.split('T')[0] : '',
        time: item.presentation_date ? item.presentation_date.split('T')[1]?.slice(0, 5) || '00:00' : '00:00',
        description: '', // Backend doesn't store description yet
        language: '', // Backend doesn't store language yet
        type: 'upcoming' as const,
        createdAt: item.created_at || new Date().toISOString(),
        updatedAt: item.created_at || new Date().toISOString()
      }));

      return {
        success: true,
        data: mappedPresentations
      };
    } catch (error) {
      console.error('Error fetching upcoming presentations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch upcoming presentations'
      };
    }
  }

  /**
   * Create a new upcoming presentation by sending a POST request to the backend.
   * Only 'topic' and 'presentation_date' (ISO format) are sent, as required by the backend.
   * @param request - { topic: string, date: string (YYYY-MM-DD), time: string (HH:MM) }
   */
  static async addUpcomingPresentation(request: { topic: string; date: string; time: string }): Promise<UpcomingPresentationResponse> {
    try {
      // Combine date and time into ISO format (YYYY-MM-DDTHH:MM:SS)
      const presentationDate = `${request.date}T${request.time || '00:00'}:00`;
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`
        // Do NOT set 'Content-Type' here
      };
      const formData = new URLSearchParams();
      formData.append('topic', request.topic);
      formData.append('presentation_date', presentationDate);

      const response = await fetch(`${this.BASE_URL}/upcoming-presentations/`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: errorText };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error adding upcoming presentation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add upcoming presentation'
      };
    }
  }

  /**
   * Update an existing upcoming presentation by ID using the backend API.
   * Uses POST /upcoming-presentations/{presentation_id}/edit endpoint.
   * Only 'topic' and 'presentation_date' (ISO format) are sent, as required by the backend.
   * @param id - The ID of the upcoming presentation to update
   * @param request - { topic: string, date: string (YYYY-MM-DD), time: string (HH:MM) }
   */
  static async updateUpcomingPresentation(id: string, request: { topic: string; date: string; time: string }): Promise<UpcomingPresentationResponse> {
    try {
      // Combine date and time into ISO format (YYYY-MM-DDTHH:MM:SS)
      const presentationDate = `${request.date}T${request.time || '00:00'}:00`;
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`
        // Do NOT set 'Content-Type' here
      };
      const formData = new URLSearchParams();
      formData.append('topic', request.topic);
      formData.append('presentation_date', presentationDate);

      const response = await fetch(`${this.BASE_URL}/upcoming-presentations/${id}/edit`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return {
          success: false,
          error: 'Authentication expired. Please log in again.'
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          error: 'Upcoming presentation not found or access denied.'
        };
      }

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Failed to update upcoming presentation: ${errorText}`
        };
      }

      const data = await response.json();
      console.log('Update response:', data); // Debug log
      
      return {
        success: true,
        data: data as any
      };
    } catch (error) {
      console.error('Error updating upcoming presentation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update upcoming presentation'
      };
    }
  }

  /**
   * Delete an upcoming presentation by ID using the backend API.
   * Uses DELETE /upcoming-presentations/{presentation_id} endpoint.
   * Performs soft delete by setting deleted_at timestamp.
   * @param id - The ID of the upcoming presentation to delete
   */
  static async deleteUpcomingPresentation(id: string): Promise<UpcomingPresentationResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}/upcoming-presentations/${id}`, {
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

      if (response.status === 404) {
        return {
          success: false,
          error: 'Upcoming presentation not found or already deleted.'
        };
      }

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Failed to delete upcoming presentation: ${errorText}`
        };
      }

      const data = await response.json();
      console.log('Delete response:', data); // Debug log
      
      return {
        success: true,
        data: data as any
      };
    } catch (error) {
      console.error('Error deleting upcoming presentation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete upcoming presentation'
      };
    }
  }

  // Initialize with sample data (call this once on first app load)
  // static async initializeSampleData(): Promise<void> {
  //   try {
  //     const existing = await this.getUpcomingPresentations();
  //     if (existing.success && (existing.data as UpcomingPresentation[]).length > 0) {
  //       return; // Already has data
  //     }

  //     const today = new Date();
  //     const tomorrow = new Date(today);
  //     tomorrow.setDate(today.getDate() + 1);
  //     const nextWeek = new Date(today);
  //     nextWeek.setDate(today.getDate() + 7);
  //     const nextMonth = new Date(today);
  //     nextMonth.setMonth(today.getMonth() + 1);
  //     const nextQuarter = new Date(today);
  //     nextQuarter.setMonth(today.getMonth() + 3);

      // const samplePresentations: UpcomingPresentationRequest[] = [
      //   {
      //     topic: 'Monthly Team Review',
      //     date: tomorrow.toISOString().split('T')[0],
      //     time: '10:00',
      //     description: 'Monthly team performance review and planning session',
      //     language: 'english'
      //   },
      //   {
      //     topic: 'Client Project Demo',
      //     date: nextWeek.toISOString().split('T')[0],
      //     time: '15:30',
      //     description: 'Demonstrating new features to client stakeholders',
      //     language: 'arabic'
      //   },
      //   {
      //     topic: 'Quarterly Business Review',
      //     date: nextMonth.toISOString().split('T')[0],
      //     time: '14:00',
      //     description: 'Quarterly financial and business performance review',
      //     language: 'english'
      //   },
      //   {
      //     topic: 'Product Launch Presentation',
      //     date: nextQuarter.toISOString().split('T')[0],
      //     time: '11:30',
      //     description: 'Launch presentation for new product features',
      //     language: 'english'
      //   }
      // ];

  //     for (const presentation of samplePresentations) {
  //       await this.addUpcomingPresentation(presentation);
  //     }
  //   } catch (error) {
  //     console.error('Error initializing sample data:', error);
  //   }
  // }

  // Future API integration methods (placeholder for when backend supports upcoming presentations)
  
  static async syncWithAPI(): Promise<UpcomingPresentationResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}/upcoming-presentations/`, {
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
          error: `Failed to sync with API: ${response.statusText}`
        };
      }

      const data: UpcomingPresentation[] = await response.json();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error syncing with API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      };
    }
  }
}

export default UpcomingPresentationService; 