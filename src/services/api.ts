/* =========================================================
   API CONTRACTS & BACKEND SERVICE ABSTRACTIONS (Section 34)
   Ready to plug into Netlify Functions / Supabase / PostgreSQL
   ========================================================= */

import {
  Family,
  FamilyMember,
  Transaction,
  Budget,
  ExpenseRequest,
  SavingsGoal,
} from '../types';

/**
 * Standard API Response envelope
 */
export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Future API service client for when the user connects their live database/functions backend.
 */
export class FamilyFinanceApiClient {
  private baseUrl: string;

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  // Authentication & Profile
  async getProfile(): Promise<ApiResponse<FamilyMember>> {
    return this.fetchJson<FamilyMember>(`${this.baseUrl}/auth/profile`);
  }

  // Families
  async getFamily(familyId: string): Promise<ApiResponse<Family>> {
    return this.fetchJson<Family>(`${this.baseUrl}/families/${familyId}`);
  }

  // Transactions
  async getTransactions(familyId: string): Promise<ApiResponse<Transaction[]>> {
    return this.fetchJson<Transaction[]>(`${this.baseUrl}/transactions?family_id=${familyId}`);
  }

  async createTransaction(tx: Partial<Transaction>): Promise<ApiResponse<Transaction>> {
    return this.fetchJson<Transaction>(`${this.baseUrl}/transactions`, {
      method: 'POST',
      body: JSON.stringify(tx),
    });
  }

  // Budgets
  async getBudgets(familyId: string): Promise<ApiResponse<Budget[]>> {
    return this.fetchJson<Budget[]>(`${this.baseUrl}/budgets?family_id=${familyId}`);
  }

  // Requests
  async getRequests(familyId: string): Promise<ApiResponse<ExpenseRequest[]>> {
    return this.fetchJson<ExpenseRequest[]>(`${this.baseUrl}/requests?family_id=${familyId}`);
  }

  async approveRequest(requestId: string, comment?: string): Promise<ApiResponse<ExpenseRequest>> {
    return this.fetchJson<ExpenseRequest>(`${this.baseUrl}/requests/${requestId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ review_comment: comment }),
    });
  }

  async rejectRequest(requestId: string, comment?: string): Promise<ApiResponse<ExpenseRequest>> {
    return this.fetchJson<ExpenseRequest>(`${this.baseUrl}/requests/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ review_comment: comment }),
    });
  }

  // Generic fetch helper
  private async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
        },
        ...options,
      });

      if (!res.ok) {
        return {
          error: {
            code: `HTTP_${res.status}`,
            message: res.statusText || 'Server API Error',
          },
        };
      }

      const data = await res.json();
      return { data };
    } catch (err: any) {
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: err.message || 'Failed to connect to backend service',
        },
      };
    }
  }
}

export const apiClient = new FamilyFinanceApiClient();
