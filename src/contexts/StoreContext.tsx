import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { STARTER_THRIFT_PRODUCTS } from '../lib/seedData';
import {
  CartItem,
  LIMITS,
  Order,
  OrderStatus,
  Product,
  ProductCategory,
  ProductCondition,
  ProductStatus,
  UserProfile,
} from '../types';
import { useAuth } from './AuthContext';

const GUEST_CART_KEY = 'thrifthub_guest_cart_v1';

function toMillis(val: unknown): number {
  if (!val) return 0;
  if (typeof val === 'object' && val !== null && 'toMillis' in val && typeof (val as { toMillis: () => number }).toMillis === 'function') {
    return (val as { toMillis: () => number }).toMillis();
  }
  if (val instanceof Date) return val.getTime();
  return 0;
}

function generateId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

export interface ProductInput {
  title: string;
  description: string;
  category: ProductCategory;
  size: string;
  condition: ProductCondition;
  pricePhp: number;
  imageUrl: string;
  featured?: boolean;
  status?: ProductStatus;
}

export interface CheckoutInput {
  deliveryName: string;
  deliveryPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryPostalCode: string;
  deliveryNotes: string;
}

interface StoreContextValue {
  products: Product[];
  productsLoading: boolean;
  cart: CartItem[];
  cartSubtotalPhp: number;
  cartShippingPhp: number;
  cartTotalPhp: number;
  buyerOrders: Order[];
  sellerOrders: Order[];
  adminOrders: Order[];
  adminUsers: UserProfile[];
  addToCart: (product: Product) => { added: boolean; message: string };
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  createProduct: (input: ProductInput) => Promise<string>;
  updateProduct: (productId: string, input: Partial<ProductInput>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  seedStarterCatalog: () => Promise<number>;
  placeCodOrder: (details: CheckoutInput) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  cancelBuyerOrder: (orderId: string) => Promise<void>;
  adminSetProductFeatured: (productId: string, featured: boolean) => Promise<void>;
  adminUpdateUserAccess: (
    targetUser: UserProfile,
    updates: { role?: 'user' | 'admin'; isSuspended?: boolean }
  ) => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, authReady, isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(GUEST_CART_KEY);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>([]);
  const autoSeededRef = useRef(false);

  // 1. Public Products Real-Time Listener
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'products'),
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as Product)
          .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
        setProducts(list);
        setProductsLoading(false);
      },
      (err) => {
        setProductsLoading(false);
        handleFirestoreError(err, OperationType.LIST, 'products');
      }
    );
    return () => unsub();
  }, []);

  // 2. Sync Cart with Firestore when Authenticated
  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      try {
        const saved = localStorage.getItem(GUEST_CART_KEY);
        setCart(saved ? (JSON.parse(saved) as CartItem[]) : []);
      } catch {
        setCart([]);
      }
      return;
    }

    const cartPath = `carts/${user.uid}`;
    const cartRef = doc(db, 'carts', user.uid);

    // Merge guest cart into Firestore once on login if guest cart has items
    const mergeGuestCart = async () => {
      try {
        const rawGuest = localStorage.getItem(GUEST_CART_KEY);
        if (!rawGuest) return;
        const guestItems = JSON.parse(rawGuest) as CartItem[];
        if (!Array.isArray(guestItems) || guestItems.length === 0) return;

        const existingSnap = await getDoc(cartRef);
        const existingItems: CartItem[] = existingSnap.exists()
          ? ((existingSnap.data().items as CartItem[]) || [])
          : [];
        const mergedMap = new Map<string, CartItem>();
        for (const item of existingItems) mergedMap.set(item.productId, item);
        for (const item of guestItems) mergedMap.set(item.productId, item);
        const merged = Array.from(mergedMap.values()).slice(0, 25);

        await setDoc(cartRef, {
          userId: user.uid,
          items: merged,
          updatedAt: serverTimestamp(),
        });
        localStorage.removeItem(GUEST_CART_KEY);
      } catch (err) {
        console.warn('Could not merge guest cart:', err);
      }
    };

    void mergeGuestCart();

    const unsub = onSnapshot(
      cartRef,
      (snap) => {
        if (snap.exists()) {
          setCart(((snap.data().items as CartItem[]) || []).slice(0, 25));
        } else {
          setCart([]);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, cartPath);
      }
    );

    return () => unsub();
  }, [authReady, user]);

  // Remove items from cart automatically if they become sold/deleted
  useEffect(() => {
    if (productsLoading || cart.length === 0) return;
    const availableIds = new Set(
      products.filter((p) => p.status === 'available').map((p) => p.id)
    );
    const filtered = cart.filter((item) => availableIds.has(item.productId));
    if (filtered.length !== cart.length) {
      setCart(filtered);
      if (user) {
        void setDoc(doc(db, 'carts', user.uid), {
          userId: user.uid,
          items: filtered,
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      } else {
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(filtered));
      }
    }
  }, [products, productsLoading, cart, user]);

  // 3. Buyer & Seller Order Listeners
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      setBuyerOrders([]);
      setSellerOrders([]);
      return;
    }

    const buyerQ = query(collection(db, 'orders'), where('buyerId', '==', user.uid));
    const unsubBuyer = onSnapshot(
      buyerQ,
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as Order)
          .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
        setBuyerOrders(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'orders');
      }
    );

    const sellerQ = query(
      collection(db, 'orders'),
      where('sellerIds', 'array-contains', user.uid)
    );
    const unsubSeller = onSnapshot(
      sellerQ,
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as Order)
          .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
        setSellerOrders(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'orders');
      }
    );

    return () => {
      unsubBuyer();
      unsubSeller();
    };
  }, [authReady, user]);

  // 4. Admin Listeners
  useEffect(() => {
    if (!authReady || !user || !isAdmin) {
      setAdminOrders([]);
      setAdminUsers([]);
      return;
    }

    const unsubOrders = onSnapshot(
      collection(db, 'orders'),
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as Order)
          .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
        setAdminOrders(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'orders');
      }
    );

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as UserProfile)
          .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
        setAdminUsers(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'users');
      }
    );

    return () => {
      unsubOrders();
      unsubUsers();
    };
  }, [authReady, user, isAdmin]);

  const persistCart = useCallback(
    async (nextCart: CartItem[]) => {
      setCart(nextCart);
      if (user && user.emailVerified) {
        const path = `carts/${user.uid}`;
        try {
          await setDoc(doc(db, 'carts', user.uid), {
            userId: user.uid,
            items: nextCart,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
      } else {
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(nextCart));
      }
    },
    [user]
  );

  const addToCart = useCallback(
    (product: Product): { added: boolean; message: string } => {
      if (product.status !== 'available') {
        return { added: false, message: 'This item is no longer available.' };
      }
      if (user && product.sellerId === user.uid) {
        return { added: false, message: 'You cannot add your own listing to your bag.' };
      }
      if (cart.some((c) => c.productId === product.id)) {
        return { added: false, message: 'Already in your shopping bag.' };
      }
      if (cart.length >= 20) {
        return { added: false, message: 'Bag limit of 20 items reached.' };
      }
      const item: CartItem = {
        productId: product.id,
        sellerId: product.sellerId,
        sellerName: product.sellerName,
        title: product.title,
        category: product.category,
        size: product.size,
        condition: product.condition,
        pricePhp: product.pricePhp,
        imageUrl: product.imageUrl,
      };
      void persistCart([...cart, item]);
      return { added: true, message: 'Added to bag.' };
    },
    [cart, persistCart, user]
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      const next = cart.filter((c) => c.productId !== productId);
      await persistCart(next);
    },
    [cart, persistCart]
  );

  const clearCart = useCallback(async () => {
    await persistCart([]);
  }, [persistCart]);

  const createProduct = useCallback(
    async (input: ProductInput): Promise<string> => {
      if (!user || !user.emailVerified) {
        throw new Error('Please sign in with a verified Google account to list items.');
      }
      if (profile?.isSuspended) {
        throw new Error('Your seller privileges are currently suspended.');
      }
      const productId = generateId('item');
      const path = `products/${productId}`;

      const cleanTitle = input.title.trim().slice(0, LIMITS.MAX_TITLE);
      const cleanDesc = input.description.trim().slice(0, LIMITS.MAX_DESCRIPTION);
      const cleanSize = input.size.trim().slice(0, LIMITS.MAX_SIZE);
      const cleanPrice = Math.min(Math.max(Number(input.pricePhp), 1), LIMITS.MAX_PRICE_PHP);
      const cleanImage = input.imageUrl.trim().slice(0, LIMITS.MAX_IMAGE_URL);

      if (cleanTitle.length < LIMITS.MIN_TITLE) {
        throw new Error('Title must be at least 2 characters.');
      }
      if (cleanDesc.length < LIMITS.MIN_DESCRIPTION) {
        throw new Error('Description must be at least 5 characters.');
      }
      if (!cleanImage) {
        throw new Error('Please upload or provide a product image.');
      }

      const docData = {
        id: productId,
        sellerId: user.uid,
        sellerName: (profile?.displayName || user.displayName || 'ThriftHub Seller').slice(
          0,
          LIMITS.MAX_NAME
        ),
        title: cleanTitle,
        description: cleanDesc,
        category: input.category,
        size: cleanSize || 'One Size',
        condition: input.condition,
        pricePhp: Number(cleanPrice.toFixed(2)),
        imageUrl: cleanImage,
        featured: isAdmin ? Boolean(input.featured) : false,
        status: 'available' as ProductStatus,
        soldOrderId: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      try {
        await setDoc(doc(db, 'products', productId), docData);
        return productId;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [isAdmin, profile, user]
  );

  const updateProduct = useCallback(
    async (productId: string, input: Partial<ProductInput>) => {
      if (!user || !user.emailVerified) {
        throw new Error('Please sign in to edit products.');
      }
      const path = `products/${productId}`;
      const existing = products.find((p) => p.id === productId);
      if (!existing) throw new Error('Product not found.');

      const payload: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };
      if (input.title !== undefined) {
        payload.title = input.title.trim().slice(0, LIMITS.MAX_TITLE);
      }
      if (input.description !== undefined) {
        payload.description = input.description.trim().slice(0, LIMITS.MAX_DESCRIPTION);
      }
      if (input.category !== undefined) payload.category = input.category;
      if (input.size !== undefined) {
        payload.size = input.size.trim().slice(0, LIMITS.MAX_SIZE);
      }
      if (input.condition !== undefined) payload.condition = input.condition;
      if (input.pricePhp !== undefined) {
        payload.pricePhp = Number(
          Math.min(Math.max(Number(input.pricePhp), 1), LIMITS.MAX_PRICE_PHP).toFixed(2)
        );
      }
      if (input.imageUrl !== undefined) {
        payload.imageUrl = input.imageUrl.trim().slice(0, LIMITS.MAX_IMAGE_URL);
      }
      if (input.status !== undefined) {
        payload.status = input.status;
        if (input.status === 'available') {
          payload.soldOrderId = '';
        }
      }
      if (input.featured !== undefined && isAdmin) {
        payload.featured = Boolean(input.featured);
      }

      try {
        await updateDoc(doc(db, 'products', productId), payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [isAdmin, products, user]
  );

  const deleteProduct = useCallback(
    async (productId: string) => {
      if (!user || !user.emailVerified) {
        throw new Error('Please sign in to delete products.');
      }
      const path = `products/${productId}`;
      try {
        await deleteDoc(doc(db, 'products', productId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [user]
  );

  const seedStarterCatalog = useCallback(async (): Promise<number> => {
    if (!user || !user.emailVerified) {
      throw new Error('Sign in with Google first to load starter items.');
    }
    const batch = writeBatch(db);
    let count = 0;
    for (const seed of STARTER_THRIFT_PRODUCTS) {
      const id = generateId('curated');
      batch.set(doc(db, 'products', id), {
        id,
        sellerId: user.uid,
        sellerName: (profile?.displayName || user.displayName || 'ThriftHub Curated').slice(
          0,
          LIMITS.MAX_NAME
        ),
        title: seed.title,
        description: seed.description,
        category: seed.category,
        size: seed.size,
        condition: seed.condition,
        pricePhp: seed.pricePhp,
        imageUrl: seed.imageUrl,
        featured: isAdmin ? seed.featured : false,
        status: 'available',
        soldOrderId: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      count += 1;
    }
    try {
      await batch.commit();
      return count;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
    }
  }, [isAdmin, profile, user]);

  // Automatically seed initial catalog once when admin signs into an empty database
  useEffect(() => {
    if (
      authReady &&
      !productsLoading &&
      products.length === 0 &&
      isAdmin &&
      !autoSeededRef.current &&
      !localStorage.getItem('thrifthub_auto_seeded')
    ) {
      autoSeededRef.current = true;
      localStorage.setItem('thrifthub_auto_seeded', '1');
      void seedStarterCatalog().catch(() => {});
    }
  }, [authReady, productsLoading, products.length, isAdmin, seedStarterCatalog]);

  const cartSubtotalPhp = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.pricePhp), 0),
    [cart]
  );

  const cartShippingPhp = useMemo(() => {
    if (cart.length === 0) return 0;
    return cartSubtotalPhp >= LIMITS.FREE_SHIPPING_THRESHOLD_PHP
      ? 0
      : LIMITS.SHIPPING_FLAT_PHP;
  }, [cart.length, cartSubtotalPhp]);

  const cartTotalPhp = cartSubtotalPhp + cartShippingPhp;

  const placeCodOrder = useCallback(
    async (details: CheckoutInput): Promise<Order> => {
      if (!user || !user.emailVerified) {
        throw new Error('Please sign in with Google before placing an order.');
      }
      if (cart.length === 0) {
        throw new Error('Your shopping bag is empty.');
      }

      // Verify all items are still available in Firestore
      const verifiedItems: Product[] = [];
      for (const cartItem of cart) {
        const snap = await getDoc(doc(db, 'products', cartItem.productId));
        if (!snap.exists()) {
          throw new Error(`"${cartItem.title}" is no longer available.`);
        }
        const prod = snap.data() as Product;
        if (prod.status !== 'available') {
          throw new Error(`"${prod.title}" was just purchased by another buyer.`);
        }
        if (prod.sellerId === user.uid) {
          throw new Error(`You cannot purchase your own listing ("${prod.title}").`);
        }
        verifiedItems.push(prod);
      }

      const subtotalPhp = verifiedItems.reduce((sum, p) => sum + p.pricePhp, 0);
      const shippingFeePhp =
        subtotalPhp >= LIMITS.FREE_SHIPPING_THRESHOLD_PHP ? 0 : LIMITS.SHIPPING_FLAT_PHP;
      const totalPhp = Number((subtotalPhp + shippingFeePhp).toFixed(2));
      const orderId = generateId('ord');
      const sellerIds = Array.from(new Set(verifiedItems.map((p) => p.sellerId))).slice(0, 20);

      const orderItems = verifiedItems.map((p) => ({
        productId: p.id,
        sellerId: p.sellerId,
        title: p.title.slice(0, LIMITS.MAX_TITLE),
        size: p.size.slice(0, LIMITS.MAX_SIZE),
        pricePhp: p.pricePhp,
        imageUrl: p.imageUrl,
        quantity: 1,
      }));

      const orderDoc = {
        id: orderId,
        buyerId: user.uid,
        buyerEmail: (user.email || 'buyer@thrifthub.ph').slice(0, 200),
        buyerName: (profile?.displayName || user.displayName || details.deliveryName)
          .trim()
          .slice(0, LIMITS.MAX_NAME),
        sellerIds,
        items: orderItems,
        subtotalPhp: Number(subtotalPhp.toFixed(2)),
        shippingFeePhp,
        totalPhp,
        paymentMethod: 'COD' as const,
        deliveryName: details.deliveryName.trim().slice(0, LIMITS.MAX_NAME),
        deliveryPhone: details.deliveryPhone.trim().slice(0, LIMITS.MAX_PHONE),
        deliveryAddress: details.deliveryAddress.trim().slice(0, LIMITS.MAX_ADDRESS),
        deliveryCity: details.deliveryCity.trim().slice(0, LIMITS.MAX_CITY),
        deliveryPostalCode: details.deliveryPostalCode.trim().slice(0, LIMITS.MAX_POSTAL),
        deliveryNotes: details.deliveryNotes.trim().slice(0, LIMITS.MAX_NOTES),
        status: 'pending' as OrderStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const batch = writeBatch(db);
      batch.set(doc(db, 'orders', orderId), orderDoc);
      for (const prod of verifiedItems) {
        batch.update(doc(db, 'products', prod.id), {
          status: 'sold',
          soldOrderId: orderId,
          updatedAt: serverTimestamp(),
        });
      }
      batch.set(doc(db, 'carts', user.uid), {
        userId: user.uid,
        items: [],
        updatedAt: serverTimestamp(),
      });

      try {
        await batch.commit();
        setCart([]);
        return {
          ...orderDoc,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `orders/${orderId}`);
      }
    },
    [cart, profile, user]
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      if (!user || !user.emailVerified) throw new Error('Sign in required.');
      const path = `orders/${orderId}`;
      try {
        await updateDoc(doc(db, 'orders', orderId), {
          status,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user]
  );

  const cancelBuyerOrder = useCallback(
    async (orderId: string) => {
      if (!user || !user.emailVerified) throw new Error('Sign in required.');
      const path = `orders/${orderId}`;
      try {
        await updateDoc(doc(db, 'orders', orderId), {
          status: 'cancelled',
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user]
  );

  const adminSetProductFeatured = useCallback(
    async (productId: string, featured: boolean) => {
      if (!isAdmin) throw new Error('Administrator access required.');
      const path = `products/${productId}`;
      try {
        await updateDoc(doc(db, 'products', productId), {
          featured,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [isAdmin]
  );

  const adminUpdateUserAccess = useCallback(
    async (
      targetUser: UserProfile,
      updates: { role?: 'user' | 'admin'; isSuspended?: boolean }
    ) => {
      if (!user || !isAdmin) throw new Error('Administrator access required.');
      const batch = writeBatch(db);
      const userRef = doc(db, 'users', targetUser.uid);
      const userUpdates: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };
      if (updates.role !== undefined) userUpdates.role = updates.role;
      if (updates.isSuspended !== undefined) userUpdates.isSuspended = updates.isSuspended;
      batch.update(userRef, userUpdates);

      if (updates.role === 'admin') {
        batch.set(doc(db, 'admins', targetUser.uid), {
          uid: targetUser.uid,
          email: targetUser.email,
          grantedBy: user.uid,
          createdAt: serverTimestamp(),
        });
      } else if (updates.role === 'user') {
        batch.delete(doc(db, 'admins', targetUser.uid));
      }

      try {
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${targetUser.uid}`);
      }
    },
    [isAdmin, user]
  );

  return (
    <StoreContext.Provider
      value={{
        products,
        productsLoading,
        cart,
        cartSubtotalPhp,
        cartShippingPhp,
        cartTotalPhp,
        buyerOrders,
        sellerOrders,
        adminOrders,
        adminUsers,
        addToCart,
        removeFromCart,
        clearCart,
        createProduct,
        updateProduct,
        deleteProduct,
        seedStarterCatalog,
        placeCodOrder,
        updateOrderStatus,
        cancelBuyerOrder,
        adminSetProductFeatured,
        adminUpdateUserAccess,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
