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

  // Get all upcoming presentations
  static async getUpcomingPresentations(): Promise<UpcomingPresentationResponse> {
    try {
      // For now, use localStorage. In the future, this can be replaced with API call
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const presentations: UpcomingPresentation[] = stored ? JSON.parse(stored) : [];
      
      // Filter out past presentations
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const futurePresentation = presentations.filter(presentation => {
        const presentationDate = new Date(presentation.date);
        return presentationDate >= today;
      });

      // Sort by date
      futurePresentation.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return {
        success: true,
        data: futurePresentation
      };
    } catch (error) {
      console.error('Error fetching upcoming presentations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch upcoming presentations'
      };
    }
  }

  // Add new upcoming presentation
  static async addUpcomingPresentation(request: UpcomingPresentationRequest): Promise<UpcomingPresentationResponse> {
    try {
      const newPresentation: UpcomingPresentation = {
        id: this.generateId(),
        ...request,
        type: 'upcoming',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Get existing presentations
      const existing = await this.getUpcomingPresentations();
      if (!existing.success) {
        return existing;
      }

      const presentations = (existing.data as UpcomingPresentation[]) || [];
      presentations.push(newPresentation);

      // Save to localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(presentations));

      return {
        success: true,
        data: newPresentation
      };
    } catch (error) {
      console.error('Error adding upcoming presentation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add upcoming presentation'
      };
    }
  }

  // Update upcoming presentation
  static async updateUpcomingPresentation(id: string, updates: Partial<UpcomingPresentationRequest>): Promise<UpcomingPresentationResponse> {
    try {
      const existing = await this.getUpcomingPresentations();
      if (!existing.success) {
        return existing;
      }

      const presentations = (existing.data as UpcomingPresentation[]) || [];
      const index = presentations.findIndex(p => p.id === id);
      
      if (index === -1) {
        return {
          success: false,
          error: 'Presentation not found'
        };
      }

      presentations[index] = {
        ...presentations[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(presentations));

      return {
        success: true,
        data: presentations[index]
      };
    } catch (error) {
      console.error('Error updating upcoming presentation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update upcoming presentation'
      };
    }
  }

  // Delete upcoming presentation
  static async deleteUpcomingPresentation(id: string): Promise<UpcomingPresentationResponse> {
    try {
      const existing = await this.getUpcomingPresentations();
      if (!existing.success) {
        return existing;
      }

      const presentations = (existing.data as UpcomingPresentation[]) || [];
      const filtered = presentations.filter(p => p.id !== id);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));

      return {
        success: true,
        data: filtered
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
  static async initializeSampleData(): Promise<void> {
    try {
      const existing = await this.getUpcomingPresentations();
      if (existing.success && (existing.data as UpcomingPresentation[]).length > 0) {
        return; // Already has data
      }

      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);
      const nextQuarter = new Date(today);
      nextQuarter.setMonth(today.getMonth() + 3);

    

     
    } catch (error) {
      console.error('Error initializing sample data:', error);
    }
  }

  // Future API integration methods (placeholder for when backend supports upcoming presentations)
  
  // static async syncWithAPI(): Promise<UpcomingPresentationResponse> {
  //   try {
  //     const response = await fetch(`${this.BASE_URL}/upcoming-presentations/`, {
  //       method: 'GET',
  //       headers: this.getAuthHeaders(),
  //     });

  //     if (response.status === 401) {
  //       localStorage.removeItem('access_token');
  //       localStorage.removeItem('refresh_token');
  //       return {
  //         success: false,
  //         error: 'Authentication expired. Please log in again.'
  //       };
  //     }

  //     if (!response.ok) {
  //       return {
  //         success: false,
  //         error: `Failed to sync with API: ${response.statusText}`
  //       };
  //     }

  //     const data: UpcomingPresentation[] = await response.json();
  //     localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      
  //     return {
  //       success: true,
  //       data
  //     };
  //   } catch (error) {
  //     console.error('Error syncing with API:', error);
  //     return {
  //       success: false,
  //       error: error instanceof Error ? error.message : 'Sync failed'
  //     };
  //   }
  // }
}

export default UpcomingPresentationService; 