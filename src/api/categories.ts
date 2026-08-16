import { apiRequest } from './client';
import type {
  Category,
  CategoryCreate,
  CategoryFilters,
  CategoryListResponse,
  CategoryUpdate,
} from './types';

export const categoriesApi = {
  async getCategories(filters: CategoryFilters = {}): Promise<CategoryListResponse> {
    return apiRequest<CategoryListResponse>('/api/v1/categories', {
      method: 'GET',
      params: filters as Record<string, string | number | boolean | null | undefined>,
    });
  },

  async getCategoryById(categoryId: string): Promise<Category> {
    return apiRequest<Category>(`/api/v1/categories/${categoryId}`, {
      method: 'GET',
    });
  },

  async createCategory(data: CategoryCreate): Promise<Category> {
    return apiRequest<Category>('/api/v1/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCategory(categoryId: string, data: CategoryUpdate): Promise<Category> {
    return apiRequest<Category>(`/api/v1/categories/${categoryId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteCategory(categoryId: string): Promise<void> {
    await apiRequest<void>(`/api/v1/categories/${categoryId}`, {
      method: 'DELETE',
    });
  },
};
