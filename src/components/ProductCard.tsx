import { Check, ShoppingBag } from 'lucide-react';
import { formatPhp, Product } from '../types';
import { SafeImage } from './SafeImage';

interface ProductCardProps {
  product: Product;
  inCart: boolean;
  isOwnListing: boolean;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({
  product,
  inCart,
  isOwnListing,
  onSelect,
  onAddToCart,
}: ProductCardProps) {
  const isSold = product.status !== 'available';

  return (
    <article className="group bg-white border border-[#E2D7C6] rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-12px_rgba(38,28,21,0.14)]">
      <button
        type="button"
        onClick={() => onSelect(product)}
        className="relative aspect-[4/3] w-full overflow-hidden bg-[#F2ECE1] text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6E472B]"
      >
        <SafeImage
          src={product.imageUrl}
          alt={product.title}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
            isSold ? 'opacity-65 grayscale-[30%]' : ''
          }`}
        />
        {isSold && (
          <div className="absolute inset-0 bg-[#261C15]/35 flex items-center justify-center">
            <span className="px-3 py-1 bg-[#FAF7F2] text-[#261C15] text-xs font-semibold tracking-wide rounded">
              Sold Out
            </span>
          </div>
        )}
      </button>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-1.5">
          {/* Unboxed metadata with typographic separators */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs text-[#7D6959]">
            <span>{product.category}</span>
            <span aria-hidden="true">·</span>
            <span>Size {product.size}</span>
            <span aria-hidden="true">·</span>
            <span>{product.condition}</span>
            {product.featured && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#6E472B] font-medium">Featured</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => onSelect(product)}
            className="block text-left w-full cursor-pointer"
          >
            <h3 className="font-sans text-base font-semibold text-[#261C15] group-hover:text-[#6E472B] transition-colors line-clamp-1">
              {product.title}
            </h3>
          </button>

          <p className="text-sm text-[#5C4A3D] line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="pt-3 border-t border-[#F2ECE1] flex items-center justify-between gap-3">
          <div>
            <p className="font-mono tabular-nums text-base font-medium text-[#261C15]">
              {formatPhp(product.pricePhp)}
            </p>
            <p className="text-xs text-[#7D6959] truncate max-w-[140px]">
              by {product.sellerName}
            </p>
          </div>

          {isSold ? (
            <span className="text-xs font-medium text-[#7D6959] px-3 py-2 bg-[#F2ECE1] rounded-lg whitespace-nowrap shrink-0">
              Unavailable
            </span>
          ) : isOwnListing ? (
            <button
              type="button"
              onClick={() => onSelect(product)}
              className="text-xs font-medium text-[#5C4A3D] border border-[#E2D7C6] hover:border-[#6E472B] px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Your Listing
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              disabled={inCart}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                inCart
                  ? 'bg-[#F2ECE1] text-[#2E5A44] border border-[#D4DFD8]'
                  : 'bg-[#6E472B] text-[#FAF7F2] hover:bg-[#4E311D]'
              }`}
            >
              {inCart ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  In Bag
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Add to Bag
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
