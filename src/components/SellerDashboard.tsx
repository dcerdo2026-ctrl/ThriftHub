import { useMemo, useState } from 'react';
import { Edit3, Package, Plus, Sparkles, Trash2, Truck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ProductInput, useStore } from '../contexts/StoreContext';
import { formatDate, formatPhp, OrderStatus, Product } from '../types';
import { ProductFormModal } from './ProductFormModal';
import { SafeImage } from './SafeImage';

export function SellerDashboard() {
  const { user, profile, isAdmin, signingIn, signInWithGoogle } = useAuth();
  const {
    products,
    sellerOrders,
    createProduct,
    updateProduct,
    deleteProduct,
    updateOrderStatus,
    seedStarterCatalog,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'listings' | 'orders'>('listings');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const myProducts = useMemo(
    () => (user ? products.filter((p) => p.sellerId === user.uid) : []),
    [products, user]
  );

  const sellerStats = useMemo(() => {
    const active = myProducts.filter((p) => p.status === 'available').length;
    const sold = myProducts.filter((p) => p.status === 'sold').length;
    const revenue = sellerOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, order) => {
        const myItemsTotal = order.items
          .filter((item) => item.sellerId === user?.uid)
          .reduce((s, i) => s + i.pricePhp, 0);
        return sum + myItemsTotal;
      }, 0);
    return { active, sold, orders: sellerOrders.length, revenue };
  }, [myProducts, sellerOrders, user]);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white border border-[#E2D7C6] rounded-2xl p-8 sm:p-10 text-center space-y-5">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#261C15]">
            Seller Studio
          </h1>
          <p className="text-sm text-[#5C4A3D] leading-relaxed">
            Sign in with your Google account to upload secondhand garments, manage inventory in Philippine pesos, and fulfill Cash on Delivery orders.
          </p>
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            disabled={signingIn}
            className="px-6 py-3 bg-[#6E472B] hover:bg-[#4E311D] text-[#FAF7F2] text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {signingIn ? 'Connecting...' : 'Sign in with Google to Sell'}
          </button>
        </div>
      </div>
    );
  }

  const handleSave = async (input: ProductInput, existingId?: string) => {
    if (existingId) {
      await updateProduct(existingId, input);
    } else {
      await createProduct(input);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedStarterCatalog();
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#261C15]">
            Seller Studio
          </h1>
          <p className="text-sm text-[#5C4A3D]">
            Manage your ThriftHub listings and incoming Cash on Delivery orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {products.length === 0 && (
            <button
              type="button"
              onClick={() => void handleSeed()}
              disabled={seeding || Boolean(profile?.isSuspended)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F2ECE1] hover:bg-[#E8DFD1] text-[#261C15] text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#6E472B]" />
              {seeding ? 'Loading...' : 'Load 6 Starter Items'}
            </button>
          )}
          <button
            type="button"
            disabled={Boolean(profile?.isSuspended)}
            onClick={() => {
              setEditingProduct(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6E472B] hover:bg-[#4E311D] disabled:opacity-50 text-[#FAF7F2] text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Upload Item
          </button>
        </div>
      </div>

      {profile?.isSuspended && (
        <div
          role="alert"
          className="p-4 bg-[#FDF3F1] border border-[#E8C5BD] text-[#9E3F2B] text-sm rounded-xl"
        >
          Your seller account is currently suspended by an administrator. You cannot publish or edit listings until reinstated.
        </div>
      )}

      {/* Seller Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2D7C6] rounded-xl p-5">
          <p className="text-xs text-[#7D6959]">Active Listings</p>
          <p className="font-mono tabular-nums text-2xl font-semibold text-[#261C15] mt-1">
            {sellerStats.active}
          </p>
        </div>
        <div className="bg-white border border-[#E2D7C6] rounded-xl p-5">
          <p className="text-xs text-[#7D6959]">Sold Pieces</p>
          <p className="font-mono tabular-nums text-2xl font-semibold text-[#261C15] mt-1">
            {sellerStats.sold}
          </p>
        </div>
        <div className="bg-white border border-[#E2D7C6] rounded-xl p-5">
          <p className="text-xs text-[#7D6959]">Customer Orders</p>
          <p className="font-mono tabular-nums text-2xl font-semibold text-[#261C15] mt-1">
            {sellerStats.orders}
          </p>
        </div>
        <div className="bg-white border border-[#E2D7C6] rounded-xl p-5">
          <p className="text-xs text-[#7D6959]">Gross Item Sales</p>
          <p className="font-mono tabular-nums text-2xl font-semibold text-[#6E472B] mt-1">
            {formatPhp(sellerStats.revenue)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2D7C6] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
            activeTab === 'listings'
              ? 'bg-[#6E472B] text-[#FAF7F2]'
              : 'text-[#5C4A3D] hover:bg-[#F2ECE1]'
          }`}
        >
          My Listings ({myProducts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-[#6E472B] text-[#FAF7F2]'
              : 'text-[#5C4A3D] hover:bg-[#F2ECE1]'
          }`}
        >
          Customer Orders ({sellerOrders.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'listings' ? (
        myProducts.length === 0 ? (
          <div className="bg-white border border-[#E2D7C6] rounded-2xl p-10 text-center space-y-4">
            <Package className="w-8 h-8 text-[#7D6959] mx-auto" />
            <h2 className="font-display text-xl font-semibold text-[#261C15]">
              No listings uploaded yet
            </h2>
            <p className="text-sm text-[#5C4A3D] max-w-md mx-auto">
              Upload photos of your pre-loved T-shirts, denim jeans, jackets, hoodies, shoes, or accessories to start selling on ThriftHub.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setModalOpen(true);
              }}
              className="px-5 py-2.5 bg-[#6E472B] text-[#FAF7F2] text-sm font-medium rounded-lg cursor-pointer"
            >
              Upload Your First Item
            </button>
          </div>
        ) : (
          <div className="bg-white border border-[#E2D7C6] rounded-2xl overflow-hidden">
            <div className="divide-y divide-[#F2ECE1]">
              {myProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-20 h-16 rounded-lg overflow-hidden bg-[#F2ECE1] border border-[#E2D7C6] shrink-0">
                      <SafeImage
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-[#261C15] truncate">
                        {product.title}
                      </p>
                      <div className="flex items-center flex-wrap gap-1.5 text-xs text-[#7D6959]">
                        <span>{product.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>Size {product.size}</span>
                        <span aria-hidden="true">·</span>
                        <span>{product.condition}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            product.status === 'available'
                              ? 'text-[#2E5A44] font-medium'
                              : 'text-[#6E472B] font-medium'
                          }
                        >
                          {product.status === 'available'
                            ? 'Available'
                            : product.status === 'sold'
                            ? 'Sold'
                            : 'Archived'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <span className="font-mono tabular-nums text-sm font-semibold text-[#261C15]">
                      {formatPhp(product.pricePhp)}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct(product);
                          setModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#261C15] border border-[#E2D7C6] hover:border-[#6E472B] rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>

                      {confirmDeleteId === product.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteProduct(product.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2.5 py-1.5 text-xs font-medium bg-[#9E3F2B] text-white rounded-lg cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1.5 text-xs text-[#5C4A3D] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(product.id)}
                          aria-label={`Delete ${product.title}`}
                          className="p-2 text-[#7D6959] hover:text-[#9E3F2B] rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : sellerOrders.length === 0 ? (
        <div className="bg-white border border-[#E2D7C6] rounded-2xl p-10 text-center space-y-2">
          <Truck className="w-8 h-8 text-[#7D6959] mx-auto" />
          <h2 className="font-display text-xl font-semibold text-[#261C15]">
            No customer orders yet
          </h2>
          <p className="text-sm text-[#5C4A3D]">
            When buyers check out your items with Cash on Delivery, fulfillment details will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sellerOrders.map((order) => {
            const myItems = order.items.filter((i) => i.sellerId === user.uid);
            const isTerminal =
              order.status === 'delivered' || order.status === 'cancelled';

            return (
              <article
                key={order.id}
                className="bg-white border border-[#E2D7C6] rounded-2xl p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F2ECE1] pb-3">
                  <div>
                    <p className="font-mono text-xs text-[#7D6959]">Order #{order.id}</p>
                    <p className="text-xs text-[#5C4A3D]">
                      {formatDate(order.createdAt)} · Buyer: {order.deliveryName} (
                      {order.deliveryPhone})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2.5 py-1 rounded bg-[#F2ECE1] text-[#261C15] capitalize">
                      {order.status}
                    </span>
                    {!isTerminal && (
                      <select
                        aria-label={`Update status for order ${order.id}`}
                        value={order.status}
                        onChange={(e) =>
                          void updateOrderStatus(order.id, e.target.value as OrderStatus)
                        }
                        className="px-3 py-1.5 bg-[#FAF7F2] border border-[#E2D7C6] rounded-lg text-xs font-medium text-[#261C15] cursor-pointer"
                      >
                        <option value="pending" disabled>
                          Pending
                        </option>
                        <option value="confirmed">Confirm Order</option>
                        <option value="shipped">Mark Shipped</option>
                        <option value="delivered">Mark Delivered</option>
                      </select>
                    )}
                  </div>
                </div>

                <div className="text-xs text-[#5C4A3D] bg-[#FAF7F2] p-3 rounded-lg">
                  <span className="font-medium text-[#261C15]">Delivery Address: </span>
                  {order.deliveryAddress}, {order.deliveryCity} {order.deliveryPostalCode}
                  {order.deliveryNotes ? ` · Note: ${order.deliveryNotes}` : ''}
                </div>

                <ul className="divide-y divide-[#F2ECE1]">
                  {myItems.map((item) => (
                    <li key={item.productId} className="py-2 flex items-center justify-between text-sm">
                      <span className="text-[#261C15]">
                        {item.title} <span className="text-[#7D6959]">(Size {item.size})</span>
                      </span>
                      <span className="font-mono tabular-nums text-[#261C15]">
                        {formatPhp(item.pricePhp)}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      )}

      <ProductFormModal
        open={modalOpen}
        initialProduct={editingProduct}
        allowFeaturedToggle={isAdmin}
        onClose={() => {
          setModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSave}
      />
    </div>
  );
}
