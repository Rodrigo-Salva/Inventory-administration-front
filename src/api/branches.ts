import client from './client';

export interface Branch {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  is_active: boolean;
  tenant_id: number;
  created_at: string;
  updated_at: string;
}

export interface BranchCreate {
  name: string;
  address?: string;
  phone?: string;
  is_active?: boolean;
}

export interface BranchUpdate {
  name?: string;
  address?: string;
  phone?: string;
  is_active?: boolean;
}

export interface PaginatedBranches {
  items: Branch[];
  metadata: {
    total: number;
    page: number;
    size: number;
    pages: number;
  };
}

export const branchApi = {
  getAll: (page = 1, size = 50) => 
    client.get<PaginatedBranches>('/api/v1/branches', { params: { page, size } }),
    
  getActive: () => 
    client.get<Branch[]>('/api/v1/branches/active'),
    
  getById: (id: number) => 
    client.get<Branch>(`/api/v1/branches/${id}`),
    
  create: (data: BranchCreate) => 
    client.post<Branch>('/api/v1/branches', data),
    
  update: (id: number, data: BranchUpdate) => 
    client.put<Branch>(`/api/v1/branches/${id}`, data),
    
  delete: (id: number) => 
    client.delete(`/api/v1/branches/${id}`)
};
