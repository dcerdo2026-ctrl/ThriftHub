import { useMemo, useState } from 'react';
import { Edit3, ShieldAlert, Sparkles, Star, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ProductInput, useStore } from '../contexts/StoreContext';
import { BOOTSTRAPPED_ADMIN_EMAIL } from '../lib/firebase';
import { formatDate, formatPhp, OrderStatus, Product } from '../types';
import { ProductFormModal } from './ProductFormModal';
import { SafeImage } from './SafeImage';

export function AdminDashboard() {
  const { user, isAdmin, signInWithGoogle } = useAuth();
  const {
    products,
    adminOrders,
    adminUsers,
    updateProduct,
    deleteProduct,
    updateOrderStatus,
    adminSetProductFeatured,
    adminUpdateUserAccess,
    seedStarterCatalog,
  } = useStore();

  const [tab, setTab] = useState<'products' | 'orders' | 'users'>('products');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [seeding, setSeeding] = useState(false);

  const metrics = useMemo(() => {
    const activeProducts = products.filter((p) => p.status === 'available').length;
    const gmv = adminOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.totalPhp, 0);
    return {
      users: adminUsers.length,
      products: products.length,
      activeProducts,
      orders: adminOrders.length,
      gmv,
    };
  }, [adminOrders, adminUsers, products]);

  if (!user || !isAdmin) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white border border-[#E2D7C6] rounded-2xl p-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#FDF3F1] text-[#9E3F2B] flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-[#261C15]">
            Administrator Access Restricted
          </h1>
          <p className="text-sm text-[#5C4A3D] leading-relaxed">
            This dashboard is protected and restricted to authorized ThriftHub administrators.
          </p>
          {!user && (
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="px-5 py-2.5 bg-[#6E472B] text-[#FAF7F2] text-sm font-medium rounded-lg cursor-pointer"
            >
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    );
  }

  const handleSaveEdit = async (input: ProductInput, existingId?: string) => {
    if (existingId) {
      await updateProduct(existingId, input);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#261C15]">
            Admin Dashboard
          </h1>
          <p className="text-sm text-[#5C4A3D]">
            Platform moderation for ThriftHub users, catalog listings, and Cash on Delivery orders.
          </p>
        </div>

        {products.length === 0 && (
          <button
            type="button"
            disabled={seeding}
            onClick={async () => {
              setSeeding(true);
              try {
                await seedStarterCatalog();
              } finally {
                setSeeding(false);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#6E472B] text-[#FAF7F2] text-sm font-medium rounded-lg cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            {seeding ? 'Populating...' : 'Populate 6 Starter Items'}
          </button>
        )}
      </div>

      {/* Platform KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2D7C6] rounded-xl p-5">
          <p className="text-xs text-[#7D6959]">Registered Users</p>
          <p className="font-mono tabular-nums text-2xl font-semibold text-[#261C15] mt-1">
            {metrics.users}
          </p>
        </div>
        <div className="bg-white border border-[#E2D7C6] rounded-xl p-5">
          <p className="text-xs text-[#7D6959]">Catalog Listings</p>
          <p className="font-mono tabular-nums text-2xl font-semibold text-[#261C15] mt-1">
            {metrics.products}{' '}
            <span className="text-xs font-normal text-[#7D6959]">
              ({metrics.activeProducts} live)
            </span>
          </p>
        </div>
        <div className="bg-white border border-[#E2D7C6] rounded-xl p-5">
          <p className="text-xs text-[#7D6959]">Total Orders</p>
          <p className="font-mono tabular-nums text-2xl font-semibold text-[#261C15] mt-1">
            {metrics.orders}
          </p>
        </div>
        <div className="bg-white border border-[#E2D7C6] rounded-xl p-5">
          <p className="text-xs text-[#7D6959]">Gross Order Volume</p>
          <p className="font-mono tabular-nums text-2xl font-semibold text-[#6E472B] mt-1">
            {formatPhp(metrics.gmv)}
          </p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2D7C6] pb-3">
        <button
          type="button"
          onClick={() => setTab('products')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
            tab === 'products'
              ? 'bg-[#6E472B] text-[#FAF7F2]'
              : 'text-[#5C4A3D] hover:bg-[#F2ECE1]'
          }`}
        >
          Products ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('orders')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
            tab === 'orders'
              ? 'bg-[#6E472B] text-[#FAF7F2]'
              : 'text-[#5C4A3D] hover:bg-[#F2ECE1]'
          }`}
        >
          Orders ({adminOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('users')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
            tab === 'users'
              ? 'bg-[#6E472B] text-[#FAF7F2]'
              : 'text-[#5C4A3D] hover:bg-[#F2ECE1]'
          }`}
        >
          Users ({adminUsers.length})
        </button>
      </div>

      {/* Tab: Products */}
      {tab === 'products' && (
        <div className="bg-white border border-[#E2D7C6] rounded-2xl overflow-hidden">
          {products.length === 0 ? (
            <p className="p-8 text-center text-sm text-[#5C4A3D]">
              No products in Firestore yet.
            </p>
          ) : (
            <div className="divide-y divide-[#F2ECE1]">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-16 h-14 rounded-lg overflow-hidden bg-[#F2ECE1] border border-[#E2D7C6] shrink-0">
                      <SafeImage
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-semibold text-[#261C15] truncate">
                        {product.title}
                      </p>
                      <p className="text-xs text-[#7D6959]">
                        {product.category} · Size {product.size} · Seller:{' '}
                        {product.sellerName} ·{' '}
                        <span className="capitalize">{product.status}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span className="font-mono tabular-nums text-sm font-semibold text-[#261C15]">
                      {formatPhp(product.pricePhp)}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        void adminSetProductFeatured(product.id, !product.featured)
                      }
                      title={product.featured ? 'Remove from Featured' : 'Feature on Homepage'}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        product.featured
                          ? 'bg-[#F2ECE1] border-[#6E472B] text-[#6E472B]'
                          : 'border-[#E2D7C6] text-[#7D6959] hover:text-[#261C15]'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5" />
                      {product.featured ? 'Featured' : 'Feature'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingProduct(product)}
                      className="p-2 text-[#5C4A3D] hover:text-[#261C15] rounded-lg cursor-pointer"
                      aria-label={`Edit ${product.title}`}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => void deleteProduct(product.id)}
                      className="p-2 text-[#7D6959] hover:text-[#9E3F2B] rounded-lg cursor-pointer"
                      aria-label={`Delete ${product.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Orders */}
      {tab === 'orders' && (
        <div className="bg-white border border-[#E2D7C6] rounded-2xl overflow-hidden">
          {adminOrders.length === 0 ? (
            <p className="p-8 text-center text-sm text-[#5C4A3D]">
              No customer orders placed yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F2ECE1] text-xs text-[#5C4A3D]">
                  <tr>
                    <th className="px-5 py-3 font-medium">Order ID</th>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Items</th>
                    <th className="px-5 py-3 font-medium">Total (COD)</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2ECE1]">
                  {adminOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-5 py-4 font-mono text-xs text-[#5C4A3D]">
                        {order.id}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-[#261C15]">{order.deliveryName}</p>
                        <p className="text-xs text-[#7D6959]">{order.deliveryCity}</p>
                      </td>
                      <td className="px-5 py-4 font-mono tabular-nums text-xs text-[#5C4A3D]">
                        {order.items.length} item(s)
                      </td>
                      <td className="px-5 py-4 font-mono tabular-nums font-semibold text-[#261C15]">
                        {formatPhp(order.totalPhp)}
                      </td>
                      <td className="px-5 py-4 text-xs text-[#7D6959]">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <select
                          aria-label={`Order ${order.id} status`}
                          value={order.status}
                          onChange={(e) =>
                            void updateOrderStatus(order.id, e.target.value as OrderStatus)
                          }
                          className="px-2.5 py-1.5 bg-[#FAF7F2] border border-[#E2D7C6] rounded-lg text-xs font-medium capitalize cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Users */}
      {tab === 'users' && (
        <div className="bg-white border border-[#E2D7C6] rounded-2xl overflow-hidden">
          {adminUsers.length === 0 ? (
            <p className="p-8 text-center text-sm text-[#5C4A3D]">
              No registered users yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F2ECE1] text-xs text-[#5C4A3D]">
                  <tr>
                    <th className="px-5 py-3 font-medium">Member</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2ECE1]">
                  {adminUsers.map((member) => {
                    const isPrimaryAdmin =
                      member.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL;
                    return (
                      <tr key={member.uid}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {member.photoURL ? (
                              <img
                                src={member.photoURL}
                                alt={member.displayName}
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="w-8 h-8 rounded-full bg-[#E8DFD1] text-[#261C15] text-xs font-semibold flex items-center justify-center">
                                {member.displayName.charAt(0).toUpperCase()}
                              </span>
                            )}
                            <span className="font-medium text-[#261C15]">
                              {member.displayName}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-[#5C4A3D]">
                          {member.email}
                        </td>
                        <td className="px-5 py-4 text-xs font-medium capitalize text-[#261C15]">
                          {isPrimaryAdmin ? 'Primary Admin' : member.role}
                        </td>
                        <td className="px-5 py-4 text-xs">
                          <span
                            className={
                              member.isSuspended
                                ? 'text-[#9E3F2B] font-medium'
                                : 'text-[#2E5A44] font-medium'
                            }
                          >
                            {member.isSuspended ? 'Suspended' : 'Active'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                          {!isPrimaryAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  void adminUpdateUserAccess(member, {
                                    role: member.role === 'admin' ? 'user' : 'admin',
                                  })
                                }
                                className="px-2.5 py-1.5 border border-[#E2D7C6] hover:border-[#6E472B] rounded-lg text-xs font-medium text-[#261C15] cursor-pointer"
                              >
                                {member.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void adminUpdateUserAccess(member, {
                                    isSuspended: !member.isSuspended,
                                  })
                                }
                                className="px-2.5 py-1.5 border border-[#E2D7C6] hover:border-[#9E3F2B] rounded-lg text-xs font-medium text-[#5C4A3D] hover:text-[#9E3F2B] cursor-pointer"
                              >
                                {member.isSuspended ? 'Reinstate' : 'Suspend'}
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <ProductFormModal
        open={Boolean(editingProduct)}
        initialProduct={editingProduct}
        allowFeaturedToggle
        onClose={() => setEditingProduct(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
