import { Check, ShieldCheck, ShoppingBag, Truck, X } from 'lucide-react';
import { formatDate, formatPhp, Product } from '../types';
import { SafeImage } from './SafeImage';

interface ProductDetailModalProps {
  product: Product | null;
  inCart: boolean;
  isOwnListing: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onOpenCart: () => void;
}

export function ProductDetailModal({
  product,
  inCart,
  isOwnListing,
  onClose,
  onAddToCart,
  onOpenCart,
}: ProductDetailModalProps) {
  if (!product) return null;

  const isSold = product.status !== 'available';

  return (
    <div
      className="fixed inset-0 z-50 bg-[#261C15]/55 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-title"
      onClick={onClose}
    >
      <div
        className="bg-[#FAF7F2] border border-[#E2D7C6] rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Product Photography */}
        <div className="bg-[#F2ECE1] aspect-[4/3] md:aspect-auto md:min-h-[420px] relative">
          <SafeImage
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product details"
            className="md:hidden absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 text-[#261C15] flex items-center justify-center shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center flex-wrap gap-2 text-xs text-[#7D6959]">
                <span>{product.category}</span>
                <span aria-hidden="true">·</span>
                <span>{product.condition}</span>
                <span aria-hidden="true">·</span>
                <span>Listed {formatDate(product.createdAt)}</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close product details"
                className="hidden md:inline-flex p-1.5 rounded-lg text-[#5C4A3D] hover:bg-[#F2ECE1] hover:text-[#261C15] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h2
                id="pdp-title"
                className="font-display text-2xl sm:text-3xl font-semibold text-[#261C15] text-balance leading-tight"
              >
                {product.title}
              </h2>
              <p className="font-mono tabular-nums text-2xl font-medium text-[#6E472B]">
                {formatPhp(product.pricePhp)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 py-3 border-y border-[#E2D7C6] text-sm">
              <div>
                <p className="text-xs text-[#7D6959]">Size</p>
                <p className="font-medium text-[#261C15]">{product.size}</p>
              </div>
              <div>
                <p className="text-xs text-[#7D6959]">Seller</p>
                <p className="font-medium text-[#261C15] truncate">{product.sellerName}</p>
              </div>
            </div>

            <p className="text-sm text-[#5C4A3D] leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2 text-xs text-[#5C4A3D] bg-[#F2ECE1] p-3.5 rounded-lg">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#6E472B] shrink-0" />
                <span>Cash on Delivery available nationwide (Free shipping over ₱1,500)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#6E472B] shrink-0" />
                <span>Single-piece vintage item — inspected condition before dispatch</span>
              </div>
            </div>

            {isSold ? (
              <div className="w-full py-3 px-4 bg-[#E8DFD1] text-[#5C4A3D] text-sm font-medium text-center rounded-lg">
                This piece has already been sold
              </div>
            ) : isOwnListing ? (
              <div className="w-full py-3 px-4 bg-[#F2ECE1] text-[#5C4A3D] text-sm font-medium text-center rounded-lg border border-[#E2D7C6]">
                This is your active listing (manage it in Seller Studio)
              </div>
            ) : inCart ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#F2ECE1] text-[#2E5A44] text-sm font-medium rounded-lg border border-[#D4DFD8]">
                  <Check className="w-4 h-4" />
                  Added to Bag
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCart();
                  }}
                  className="flex-1 py-3 px-4 bg-[#6E472B] text-[#FAF7F2] hover:bg-[#4E311D] text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                  View Bag &amp; Checkout
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onAddToCart(product)}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 bg-[#6E472B] hover:bg-[#4E311D] text-[#FAF7F2] text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                Add to Shopping Bag
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
