import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck, Truck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import { formatPhp, LIMITS, Order } from '../types';
import { SafeImage } from './SafeImage';

interface CheckoutViewProps {
  onBackToShop: () => void;
  onViewOrders: () => void;
}

export function CheckoutView({ onBackToShop, onViewOrders }: CheckoutViewProps) {
  const { user, profile, signInWithGoogle } = useAuth();
  const {
    cart,
    cartSubtotalPhp,
    cartShippingPhp,
    cartTotalPhp,
    placeCodOrder,
  } = useStore();

  const [deliveryName, setDeliveryName] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryPostalCode, setDeliveryPostalCode] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (profile) {
      setDeliveryName((prev) => prev || profile.displayName || '');
      setDeliveryPhone((prev) => prev || profile.phone || '');
      setDeliveryAddress((prev) => prev || profile.address || '');
      setDeliveryCity((prev) => prev || profile.city || '');
      setDeliveryPostalCode((prev) => prev || profile.postalCode || '');
    } else if (user?.displayName) {
      setDeliveryName((prev) => prev || user.displayName || '');
    }
  }, [profile, user]);

  if (confirmedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white border border-[#E2D7C6] rounded-2xl p-8 sm:p-10 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#F2ECE1] text-[#2E5A44] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-mono text-[#7D6959]">
                Order #{confirmedOrder.id}
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#261C15]">
                Order Confirmed — Preparing Shipment
              </h1>
              <p className="text-sm text-[#5C4A3D]">
                Payment Method: Cash on Delivery (COD). Please prepare{' '}
                <span className="font-mono tabular-nums font-semibold text-[#261C15]">
                  {formatPhp(confirmedOrder.totalPhp)}
                </span>{' '}
                upon delivery.
              </p>
            </div>
          </div>

          <div className="border-y border-[#E2D7C6] py-5 space-y-3 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#7D6959]">Recipient</p>
                <p className="font-medium text-[#261C15]">{confirmedOrder.deliveryName}</p>
                <p className="text-[#5C4A3D]">{confirmedOrder.deliveryPhone}</p>
              </div>
              <div>
                <p className="text-xs text-[#7D6959]">Delivery Address</p>
                <p className="text-[#261C15]">
                  {confirmedOrder.deliveryAddress}, {confirmedOrder.deliveryCity}{' '}
                  {confirmedOrder.deliveryPostalCode}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[#261C15]">Receipt Summary</h2>
            <ul className="divide-y divide-[#F2ECE1]">
              {confirmedOrder.items.map((item) => (
                <li key={item.productId} className="py-2.5 flex justify-between text-sm">
                  <span className="text-[#261C15]">
                    {item.title} <span className="text-[#7D6959]">(Size {item.size})</span>
                  </span>
                  <span className="font-mono tabular-nums text-[#261C15]">
                    {formatPhp(item.pricePhp)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="pt-3 border-t border-[#E2D7C6] space-y-1 text-sm">
              <div className="flex justify-between text-[#5C4A3D]">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">
                  {formatPhp(confirmedOrder.subtotalPhp)}
                </span>
              </div>
              <div className="flex justify-between text-[#5C4A3D]">
                <span>COD Shipping</span>
                <span className="font-mono tabular-nums">
                  {confirmedOrder.shippingFeePhp === 0
                    ? 'Free'
                    : formatPhp(confirmedOrder.shippingFeePhp)}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-base text-[#261C15] pt-1">
                <span>Amount Due on Delivery</span>
                <span className="font-mono tabular-nums">
                  {formatPhp(confirmedOrder.totalPhp)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={onViewOrders}
              className="px-5 py-3 bg-[#6E472B] hover:bg-[#4E311D] text-[#FAF7F2] text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              Track Order in My Profile
            </button>
            <button
              type="button"
              onClick={onBackToShop}
              className="px-5 py-3 bg-[#F2ECE1] hover:bg-[#E8DFD1] text-[#261C15] text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (deliveryName.trim().length < 2) {
      setError('Please enter the recipient full name.');
      return;
    }
    if (deliveryPhone.trim().length < 7) {
      setError('Please enter a valid mobile number for rider coordination.');
      return;
    }
    if (deliveryAddress.trim().length < 5) {
      setError('Please enter your complete street/barangay delivery address.');
      return;
    }
    if (deliveryCity.trim().length < 2 || deliveryPostalCode.trim().length < 3) {
      setError('Please provide your city and postal code.');
      return;
    }

    setSubmitting(true);
    try {
      const order = await placeCodOrder({
        deliveryName,
        deliveryPhone,
        deliveryAddress,
        deliveryCity,
        deliveryPostalCode,
        deliveryNotes,
      });
      setConfirmedOrder(order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <button
        type="button"
        onClick={onBackToShop}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#5C4A3D] hover:text-[#261C15] cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Shop
      </button>

      <div>
        <h1 className="font-display text-3xl font-semibold text-[#261C15]">
          Checkout
        </h1>
        <p className="text-sm text-[#5C4A3D]">
          Complete your delivery information for Cash on Delivery nationwide.
        </p>
      </div>

      {!user ? (
        <div className="bg-white border border-[#E2D7C6] rounded-2xl p-8 text-center space-y-4">
          <h2 className="font-display text-xl font-semibold text-[#261C15]">
            Sign in to complete your order
          </h2>
          <p className="text-sm text-[#5C4A3D] max-w-md mx-auto">
            Your shopping bag is saved. Sign in with Google so we can tie your Cash on Delivery order to your profile for live tracking.
          </p>
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="px-6 py-3 bg-[#6E472B] hover:bg-[#4E311D] text-[#FAF7F2] text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Sign in with Google
          </button>
        </div>
      ) : cart.length === 0 ? (
        <div className="bg-white border border-[#E2D7C6] rounded-2xl p-10 text-center space-y-4">
          <h2 className="font-display text-xl font-semibold text-[#261C15]">
            Your bag is empty
          </h2>
          <p className="text-sm text-[#5C4A3D]">
            Add pre-loved clothing from the shop before heading to checkout.
          </p>
          <button
            type="button"
            onClick={onBackToShop}
            className="px-6 py-3 bg-[#6E472B] text-[#FAF7F2] text-sm font-medium rounded-lg cursor-pointer"
          >
            Explore Shop
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Delivery & Payment Form */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-7 bg-white border border-[#E2D7C6] rounded-2xl p-6 sm:p-8 space-y-6"
          >
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-[#261C15]">
                Customer &amp; Delivery Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#5C4A3D]">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={LIMITS.MAX_NAME}
                    value={deliveryName}
                    onChange={(e) => setDeliveryName(e.target.value)}
                    placeholder="Juan Dela Cruz"
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E2D7C6] focus:border-[#6E472B] focus:outline-none rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#5C4A3D]">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={LIMITS.MAX_PHONE}
                    value={deliveryPhone}
                    onChange={(e) => setDeliveryPhone(e.target.value)}
                    placeholder="0917 123 4567"
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E2D7C6] focus:border-[#6E472B] focus:outline-none rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#5C4A3D]">
                  Street Address / Barangay / Unit *
                </label>
                <input
                  type="text"
                  required
                  maxLength={LIMITS.MAX_ADDRESS}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Unit 4B, 128 Katipunan Ave, Brgy. Loyola Heights"
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E2D7C6] focus:border-[#6E472B] focus:outline-none rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#5C4A3D]">
                    City / Province *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={LIMITS.MAX_CITY}
                    value={deliveryCity}
                    onChange={(e) => setDeliveryCity(e.target.value)}
                    placeholder="Quezon City, Metro Manila"
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E2D7C6] focus:border-[#6E472B] focus:outline-none rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#5C4A3D]">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={LIMITS.MAX_POSTAL}
                    value={deliveryPostalCode}
                    onChange={(e) => setDeliveryPostalCode(e.target.value)}
                    placeholder="1108"
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E2D7C6] focus:border-[#6E472B] focus:outline-none rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#5C4A3D]">
                  Rider Landmarks / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  maxLength={LIMITS.MAX_NOTES}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Gate color, preferred delivery window, or landmark..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E2D7C6] focus:border-[#6E472B] focus:outline-none rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#E2D7C6] space-y-3">
              <h2 className="font-display text-lg font-semibold text-[#261C15]">
                Payment Method
              </h2>
              <div className="p-4 bg-[#F2ECE1] border border-[#6E472B] rounded-xl flex items-start gap-3">
                <Truck className="w-5 h-5 text-[#6E472B] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#261C15]">
                    Cash on Delivery (COD)
                  </p>
                  <p className="text-xs text-[#5C4A3D] mt-0.5">
                    Pay in Philippine pesos ({formatPhp(cartTotalPhp)}) directly to the courier when your order is handed over.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="p-3.5 bg-[#FDF3F1] border border-[#E8C5BD] text-[#9E3F2B] text-sm rounded-lg"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 bg-[#6E472B] hover:bg-[#4E311D] disabled:opacity-60 text-[#FAF7F2] text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {submitting
                ? 'Placing COD Order...'
                : `Confirm COD Order · ${formatPhp(cartTotalPhp)}`}
            </button>
          </form>

          {/* Right: Order Summary */}
          <aside className="lg:col-span-5 bg-white border border-[#E2D7C6] rounded-2xl p-6 sm:p-8 space-y-5">
            <h2 className="font-display text-xl font-semibold text-[#261C15]">
              Order Summary ({cart.length})
            </h2>

            <ul className="divide-y divide-[#F2ECE1]">
              {cart.map((item) => (
                <li key={item.productId} className="py-3.5 flex gap-3.5">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#F2ECE1] border border-[#E2D7C6] shrink-0">
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
                    <p className="text-xs text-[#7D6959]">
                      Size {item.size} · {item.condition}
                    </p>
                  </div>
                  <span className="font-mono tabular-nums text-sm font-medium text-[#261C15] shrink-0">
                    {formatPhp(item.pricePhp)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="pt-4 border-t border-[#E2D7C6] space-y-2 text-sm">
              <div className="flex justify-between text-[#5C4A3D]">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">{formatPhp(cartSubtotalPhp)}</span>
              </div>
              <div className="flex justify-between text-[#5C4A3D]">
                <span>Shipping (Free at ₱1,500+)</span>
                <span className="font-mono tabular-nums">
                  {cartShippingPhp === 0 ? 'Free' : formatPhp(cartShippingPhp)}
                </span>
              </div>
              <div className="pt-3 border-t border-[#E2D7C6] flex justify-between text-base font-semibold text-[#261C15]">
                <span>Total (Cash on Delivery)</span>
                <span className="font-mono tabular-nums text-[#6E472B]">
                  {formatPhp(cartTotalPhp)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#7D6959] pt-1">
              <ShieldCheck className="w-4 h-4 text-[#6E472B] shrink-0" />
              <span>Items are reserved exclusively upon order confirmation.</span>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
