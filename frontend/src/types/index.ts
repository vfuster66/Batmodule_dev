// Types pour les utilisateurs
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  companyName?: string
  phone?: string
  address?: string
  createdAt: string
  updatedAt: string
}

// Types pour les clients
export interface Client {
  id: string
  userId: string
  firstName: string
  lastName: string
  companyName?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// Types pour les catégories de services
export interface ServiceCategory {
  id: string
  userId: string
  name: string
  description?: string
  color: string
  createdAt: string
  updatedAt: string
}

// Types pour les services
export interface Service {
  id: string
  userId: string
  categoryId?: string
  name: string
  description?: string
  unit: string
  priceHt: number
  priceTtc: number
  vatRate: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Types pour les devis
export interface Quote {
  id: string
  userId: string
  clientId: string
  quoteNumber: string
  title: string
  description?: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  subtotalHt: number
  totalVat: number
  totalTtc: number
  validUntil?: string
  notes?: string
  createdAt: string
  updatedAt: string
  client?: Client
  items?: QuoteItem[]
}

// Types pour les lignes de devis
export interface QuoteItem {
  id: string
  quoteId: string
  serviceId?: string
  description: string
  quantity: number
  unitPriceHt: number
  unitPriceTtc: number
  vatRate: number
  totalHt: number
  totalTtc: number
  sortOrder: number
  createdAt: string
  service?: Service
}

// Types pour les factures
export interface Invoice {
  id: string
  userId: string
  clientId: string
  quoteId?: string
  invoiceNumber: string
  title: string
  description?: string
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  subtotalHt: number
  totalVat: number
  totalTtc: number
  paidAmount: number
  dueDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
  client?: Client
  items?: InvoiceItem[]
  payments?: Payment[]
}

// Types pour les lignes de facture
export interface InvoiceItem {
  id: string
  invoiceId: string
  serviceId?: string
  description: string
  quantity: number
  unitPriceHt: number
  unitPriceTtc: number
  vatRate: number
  totalHt: number
  totalTtc: number
  sortOrder: number
  createdAt: string
  service?: Service
}

// Types pour les paiements
export interface Payment {
  id: string
  invoiceId: string
  amount: number
  paymentMethod: 'cash' | 'check' | 'transfer' | 'card'
  paymentDate: string
  reference?: string
  notes?: string
  createdAt: string
}

// Types pour les formulaires
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  companyName?: string
  phone?: string
  address?: string
}

export interface ClientForm {
  firstName: string
  lastName: string
  companyName?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
}

export interface ServiceForm {
  name: string
  description?: string
  categoryId?: string
  unit: string
  priceHt: number
  vatRate: number
}

export interface QuoteForm {
  clientId: string
  title: string
  description?: string
  validUntil?: string
  notes?: string
  items: QuoteItemForm[]
}

export interface QuoteItemForm {
  serviceId?: string
  description: string
  quantity: number
  unitPriceHt: number
  vatRate: number
}

export interface InvoiceForm {
  clientId: string
  quoteId?: string
  title: string
  description?: string
  dueDate?: string
  notes?: string
  items: InvoiceItemForm[]
}

export interface InvoiceItemForm {
  serviceId?: string
  description: string
  quantity: number
  unitPriceHt: number
  vatRate: number
}

// Types pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  details?: Array<{ field: string; message: string }>
}

export interface PaginatedResponse<T = any> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Types pour les filtres et recherche
export interface SearchFilters {
  query?: string
  status?: string
  category?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
