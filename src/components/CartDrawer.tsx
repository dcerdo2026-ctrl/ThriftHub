import { ArrowRight, ShoppingBag, Trash2, X } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { formatPhp, LIMITS } from '../types';
import { SafeImage } from './SafeImage';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export function CartDrawer({ open, onClose, onCheckout }: CartDrawerProps) {
  const {
    cart,
    cartSubtotalPhp,
    cartShippingPhp,
    cartTotalPhp,
    removeFromCart,
  } = useStore();

  if (!open) return null;

  const remainingForFreeShipping = Math.max(
    0,
    LIMITS.FREE_SHIPPING_THRESHOLD_PHP - cartSubtotalPhp
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-[#261C15]/45 backdrop-blur-xs flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-md bg-[#FAF7F2] h-full border-l border-[#E2D7C6] flex flex-col justify-between shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-[#E2D7C6] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#6E472B]" />
            <h2 className="font-display text-xl font-semibold text-[#261C15]">
              Your Bag ({cart.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bag"
            className="p-2 rounded-lg text-[#5C4A3D] hover:bg-[#F2ECE1] hover:text-[#261C15] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#F2ECE1] flex items-center justify-center text-[#7D6959]">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <p className="font-display text-lg font-medium text-[#261C15]">
                Your bag is empty
              </p>
              <p className="text-sm text-[#5C4A3D] max-w-xs">
                Browse curated vintage tees, denim, jackets, and footwear to reserve your one-of-a-kind finds.
              </p>
            </div>
          ) : (
            <>
              {remainingForFreeShipping > 0 ? (
                <div className="p-3 bg-[#F2ECE1] rounded-lg text-xs text-[#5C4A3D]">
                  Add{' '}
                  <span className="font-mono tabular-nums font-medium text-[#261C15]">
                    {formatPhp(remainingForFreeShipping)}
                  </span>{' '}
                  more for free nationwide shipping.
                </div>
              ) : (
                <div className="p-3 bg-[#F2ECE1] rounded-lg text-xs text-[#2E5A44] font-medium">
                  You unlocked free nationwide delivery.
                </div>
              )}

              <ul className="divide-y divide-[#E2D7C6]">
                {cart.map((item) => (
                  <li key={item.productId} className="py-4 flex gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#F2ECE1] shrink-0 border border-[#E2D7C6]">
                      <SafeImage
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-[#261C15] truncate">
                            {item.title}
                          </h3>
                          <p className="text-xs text-[#7D6959]">
                            {item.category} · Size {item.size}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void removeFromCart(item.productId)}
                          aria-label={`Remove ${item.title}`}
                          className="p-1.5 text-[#7D6959] hover:text-[#9E3F2B] rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-[#7D6959]">Qty 1 (Unique Piece)</span>
                        <span className="font-mono tabular-nums text-sm font-medium text-[#261C15]">
                          {formatPhp(item.pricePhp)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-[#E2D7C6] bg-white space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-[#5C4A3D]">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">{formatPhp(cartSubtotalPhp)}</span>
              </div>
              <div className="flex justify-between text-[#5C4A3D]">
                <span>Delivery Fee (COD)</span>
                <span className="font-mono tabular-nums">
                  {cartShippingPhp === 0 ? 'Free' : formatPhp(cartShippingPhp)}
                </span>
              </div>
              <div className="pt-2 border-t border-[#F2ECE1] flex justify-between text-base font-semibold text-[#261C15]">
                <span>Total</span>
                <span className="font-mono tabular-nums">{formatPhp(cartTotalPhp)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onCheckout();
              }}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 bg-[#6E472B] hover:bg-[#4E311D] text-[#FAF7F2] text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Proceed to Checkout (COD)
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
