import React, { useEffect, useState } from 'react';
import { Check, LogOut, Package, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import { formatDate, formatPhp, LIMITS, OrderStatus } from '../types';
import { SafeImage } from './SafeImage';

const STATUS_LABELS: Record<OrderStatus, { label: string; tone: string }> = {
  pending: { label: 'Pending Confirmation', tone: 'text-[#6E472B] bg-[#F2ECE1]' },
  confirmed: { label: 'Confirmed', tone: 'text-[#261C15] bg-[#E8DFD1]' },
  shipped: { label: 'Out for Delivery', tone: 'text-[#261C15] bg-[#E8DFD1]' },
  delivered: { label: 'Delivered', tone: 'text-[#2E5A44] bg-[#E9F1EC]' },
  cancelled: { label: 'Cancelled', tone: 'text-[#9E3F2B] bg-[#FDF3F1]' },
};

export function ProfileView() {
  const {
    user,
    profile,
    isAdmin,
    signingIn,
    signInWithGoogle,
    logout,
    updateProfileDetails,
  } = useAuth();
  const { buyerOrders, cancelBuyerOrder } = useStore();

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
      setCity(profile.city || '');
      setPostalCode(profile.postalCode || '');
    }
  }, [profile]);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white border border-[#E2D7C6] rounded-2xl p-8 sm:p-10 text-center space-y-5">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#261C15]">
            Sign in to ThriftHub
          </h1>
          <p className="text-sm text-[#5C4A3D] leading-relaxed">
            Use your Google account to view your profile, save default delivery addresses, and track your Cash on Delivery orders.
          </p>
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            disabled={signingIn}
            className="px-6 py-3 bg-[#6E472B] hover:bg-[#4E311D] text-[#FAF7F2] text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {signingIn ? 'Connecting to Google...' : 'Continue with Google'}
          </button>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedNotice(false);
    try {
      await updateProfileDetails({
        displayName,
        phone,
        address,
        city,
        postalCode,
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Profile Header Card */}
      <section className="bg-white border border-[#E2D7C6] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {profile?.photoURL || user.photoURL ? (
            <img
              src={profile?.photoURL || user.photoURL || ''}
              alt={profile?.displayName || user.displayName || 'Profile picture'}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover border border-[#E2D7C6]"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#6E472B] text-[#FAF7F2] font-display text-2xl font-semibold flex items-center justify-center">
              {(profile?.displayName || user.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-semibold text-[#261C15]">
              {profile?.displayName || user.displayName}
            </h1>
            <div className="flex items-center flex-wrap gap-2 text-sm text-[#5C4A3D]">
              <span>{user.email}</span>
              <span aria-hidden="true">·</span>
              <span>{isAdmin ? 'Administrator' : 'Member'}</span>
              {profile?.isSuspended && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#9E3F2B] font-medium">Seller Access Suspended</span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void logout()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-[#E2D7C6] hover:border-[#9E3F2B] hover:text-[#9E3F2B] text-sm font-medium text-[#5C4A3D] rounded-lg transition-colors cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Default Delivery Details */}
        <section className="lg:col-span-5 bg-white border border-[#E2D7C6] rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#261C15]">
              Saved Delivery Information
            </h2>
            <p className="text-xs text-[#7D6959] mt-0.5">
              Pre-fills your Cash on Delivery checkout details.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#5C4A3D]">
                Display Name
              </label>
              <input
                type="text"
                required
                maxLength={LIMITS.MAX_NAME}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#E2D7C6] focus:border-[#6E472B] focus:outline-none rounded-lg text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#5C4A3D]">
                Mobile Number
              </label>
              <input
                type="tel"
                maxLength={LIMITS.MAX_PHONE}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0917 000 0000"
                className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#E2D7C6] focus:border-[#6E472B] focus:outline-none rounded-lg text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#5C4A3D]">
                Street Address
              </label>
              <input
                type="text"
                maxLength={LIMITS.MAX_ADDRESS}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House No., Street, Barangay"
                className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#E2D7C6] focus:border-[#6E472B] focus:outline-none rounded-lg text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#5C4A3D]">City</label>
                <input
                  type="text"
                  maxLength={LIMITS.MAX_CITY}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Manila"
                  className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#E2D7C6] focus:border-[#6E472B] focus:outline-none rounded-lg text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#5C4A3D]">
                  Postal Code
                </label>
                <input
                  type="text"
                  maxLength={LIMITS.MAX_POSTAL}
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="1000"
                  className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#E2D7C6] focus:border-[#6E472B] focus:outline-none rounded-lg text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#6E472B] hover:bg-[#4E311D] text-[#FAF7F2] text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              {savedNotice ? (
                <>
                  <Check className="w-4 h-4" />
                  Profile Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Delivery Info'}
                </>
              )}
            </button>
          </form>
        </section>

        {/* Previous Orders */}
        <section className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-[#261C15]">
              Previous Orders ({buyerOrders.length})
            </h2>
          </div>

          {buyerOrders.length === 0 ? (
            <div className="bg-white border border-[#E2D7C6] rounded-2xl p-10 text-center space-y-2">
              <Package className="w-8 h-8 text-[#7D6959] mx-auto" />
              <p className="font-display text-lg font-medium text-[#261C15]">
                No orders yet
              </p>
              <p className="text-sm text-[#5C4A3D]">
                When you place a Cash on Delivery order, its live status will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {buyerOrders.map((order) => {
                const statusInfo = STATUS_LABELS[order.status];
                return (
                  <article
                    key={order.id}
                    className="bg-white border border-[#E2D7C6] rounded-2xl p-5 sm:p-6 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F2ECE1] pb-3">
                      <div className="space-y-0.5">
                        <p className="font-mono text-xs text-[#7D6959]">
                          Order #{order.id}
                        </p>
                        <p className="text-xs text-[#5C4A3D]">
                          Placed {formatDate(order.createdAt)} · Cash on Delivery
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-medium ${statusInfo.tone}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    <ul className="divide-y divide-[#F2ECE1]">
                      {order.items.map((item) => (
                        <li key={item.productId} className="py-2.5 flex items-center gap-3">
                          <div className="w-12 h-12 rounded-md overflow-hidden bg-[#F2ECE1] border border-[#E2D7C6] shrink-0">
                            <SafeImage
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#261C15] truncate">
                              {item.title}
                            </p>
                            <p className="text-xs text-[#7D6959]">Size {item.size}</p>
                          </div>
                          <span className="font-mono tabular-nums text-sm text-[#261C15]">
                            {formatPhp(item.pricePhp)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-3 border-t border-[#F2ECE1] flex flex-wrap items-center justify-between gap-3 text-sm">
                      <div className="text-xs text-[#5C4A3D]">
                        Ship to: {order.deliveryAddress}, {order.deliveryCity}
                      </div>
                      <div className="flex items-center gap-4">
                        {order.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => void cancelBuyerOrder(order.id)}
                            className="text-xs font-medium text-[#9E3F2B] hover:underline cursor-pointer"
                          >
                            Cancel Order
                          </button>
                        )}
                        <span className="font-mono tabular-nums font-semibold text-[#261C15]">
                          Total: {formatPhp(order.totalPhp)}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
