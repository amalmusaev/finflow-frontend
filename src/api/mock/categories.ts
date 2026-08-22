import type {
  Category,
  CategoryCreate,
  CategoryFilters,
  CategoryListResponse,
  CategoryUpdate,
} from '../types';
import { getMockCategories, saveMockCategories, delay } from './storage';

export const mockCategoriesApi = {
  async getCategories(filters: CategoryFilters = {}): Promise<CategoryListResponse> {
    await delay();
    let categories = getMockCategories();

    if (filters.type) {
      categories = categories.filter(c => c.type === filters.type);
    }

    return { categories };
  },

  async getCategoryById(categoryId: string): Promise<Category> {
    await delay();
    const categories = getMockCategories();
    const category = categories.find(c => c.id === categoryId);
    if (!category) {
      throw new Error(`Категория с ID ${categoryId} не найдена`);
    }
    return category;
  },

  async createCategory(data: CategoryCreate): Promise<Category> {
    await delay();
    const categories = getMockCategories();
    const newCategory: Category = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: data.name,
      type: data.type,
    };

    const updated = [...categories, newCategory];
    saveMockCategories(updated);
    return newCategory;
  },

  async updateCategory(categoryId: string, data: CategoryUpdate): Promise<Category> {
    await delay();
    const categories = getMockCategories();
    const index = categories.findIndex(c => c.id === categoryId);
    if (index === -1) {
      throw new Error(`Категория с ID ${categoryId} не найдена`);
    }

    const current = categories[index];
    const updatedCategory: Category = {
      ...current,
      name: data.name !== undefined && data.name !== null ? data.name : current.name,
      type: data.type !== undefined && data.type !== null ? data.type : current.type,
    };

    categories[index] = updatedCategory;
    saveMockCategories(categories);
    return updatedCategory;
  },

  async deleteCategory(categoryId: string): Promise<void> {
    await delay();
    const categories = getMockCategories();
    const filtered = categories.filter(c => c.id !== categoryId);
    saveMockCategories(filtered);
  },
};
