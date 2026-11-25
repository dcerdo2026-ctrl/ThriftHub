export type ProductCategory =
  | 'T-Shirts'
  | 'Jeans'
  | 'Jackets'
  | 'Hoodies'
  | 'Shoes'
  | 'Accessories';

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'T-Shirts',
  'Jeans',
  'Jackets',
  'Hoodies',
  'Shoes',
  'Accessories',
];

export type ProductCondition =
  | 'New with Tags'
  | 'Like New'
  | 'Gently Used'
  | 'Vintage Worn';

export const PRODUCT_CONDITIONS: ProductCondition[] = [
  'New with Tags',
  'Like New',
  'Gently Used',
  'Vintage Worn',
];

export type ProductStatus = 'available' | 'sold' | 'archived';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type UserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  isSuspended: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Product {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  category: ProductCategory;
  size: string;
  condition: ProductCondition;
  pricePhp: number;
  imageUrl: string;
  featured: boolean;
  status: ProductStatus;
  soldOrderId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CartItem {
  productId: string;
  sellerId: string;
  sellerName: string;
  title: string;
  category: ProductCategory;
  size: string;
  condition: ProductCondition;
  pricePhp: number;
  imageUrl: string;
}

export interface OrderItem {
  productId: string;
  sellerId: string;
  title: string;
  size: string;
  pricePhp: number;
  imageUrl: string;
  quantity: number;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerEmail: string;
  buyerName: string;
  sellerIds: string[];
  items: OrderItem[];
  subtotalPhp: number;
  shippingFeePhp: number;
  totalPhp: number;
  paymentMethod: 'COD';
  deliveryName: string;
  deliveryPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryPostalCode: string;
  deliveryNotes: string;
  status: OrderStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type AppView = 'home' | 'checkout' | 'profile' | 'seller' | 'admin';

// Blueprint validation constants (synchronized with firebase-blueprint.json & firestore.rules)
export const LIMITS = {
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  MAX_ID: 128,
  MAX_NAME: 80,
  MAX_TITLE: 120,
  MIN_TITLE: 2,
  MAX_DESCRIPTION: 1200,
  MIN_DESCRIPTION: 5,
  MAX_SIZE: 30,
  MAX_PRICE_PHP: 500000,
  MAX_IMAGE_URL: 400000,
  MAX_PHONE: 30,
  MAX_ADDRESS: 250,
  MAX_CITY: 100,
  MAX_POSTAL: 20,
  MAX_NOTES: 300,
  SHIPPING_FLAT_PHP: 85,
  FREE_SHIPPING_THRESHOLD_PHP: 1500,
} as const;

export function formatPhp(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value: unknown): string {
  if (!value) return 'Just now';
  try {
    if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
      return (value as { toDate: () => Date }).toDate().toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    if (value instanceof Date) {
      return value.toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleDateString('en-PH', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    }
  } catch {
    return 'Recent';
  }
  return 'Recent';
}
