import { useMemo, useState } from 'react';
import { ArrowRight, PackageCheck, Search, Sparkles, Truck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import { HERO_EDITORIAL_IMAGE } from '../lib/seedData';
import {
  formatPhp,
  Product,
  PRODUCT_CATEGORIES,
  ProductCategory,
} from '../types';
import { ProductCard } from './ProductCard';
import { SafeImage } from './SafeImage';

interface HomeViewProps {
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onStartSelling: () => void;
}

export function HomeView({
  onSelectProduct,
  onAddToCart,
  onStartSelling,
}: HomeViewProps) {
  const { user, signInWithGoogle } = useAuth();
  const { products, productsLoading, cart, seedStarterCatalog } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ProductCategory>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');
  const [showSold, setShowSold] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const cartIds = useMemo(() => new Set(cart.map((c) => c.productId)), [cart]);

  const availableProducts = useMemo(
    () => products.filter((p) => p.status === 'available'),
    [products]
  );

  const featuredProducts = useMemo(
    () => availableProducts.filter((p) => p.featured).slice(0, 3),
    [availableProducts]
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      if (p.status === 'archived') return false;
      if (!showSold && p.status !== 'available') return false;
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      if (q) {
        const hay = `${p.title} ${p.description} ${p.category} ${p.size} ${p.condition} ${p.sellerName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === 'price-asc') {
      return [...list].sort((a, b) => a.pricePhp - b.pricePhp);
    }
    if (sortBy === 'price-desc') {
      return [...list].sort((a, b) => b.pricePhp - a.pricePhp);
    }
    return list;
  }, [products, searchQuery, selectedCategory, sortBy, showSold]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedStarterCatalog();
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-16 pb-20">
      {/* 1. Editorial Storefront Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:pt-12">
        <div className="bg-[#F2ECE1] border border-[#E2D7C6] rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 p-8 sm:p-12 lg:p-14 flex flex-col justify-between gap-8">
            <div className="space-y-5">
              <p className="text-xs font-medium tracking-wider uppercase text-[#6E472B]">
                Curated Secondhand Wardrobe · Philippines
              </p>
              <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#261C15] leading-[1.08] text-balance">
                Timeless pieces, ready for a second chapter.
              </h1>
              <p className="text-base text-[#5C4A3D] leading-relaxed max-w-xl">
                Discover hand-picked vintage tees, selvedge denim, workwear jackets, and classic leather staples at honest thrift prices in Philippine pesos with Cash on Delivery.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#catalog"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#6E472B] hover:bg-[#4E311D] text-[#FAF7F2] text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Browse Collection
                <ArrowRight className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={onStartSelling}
                className="inline-flex items-center gap-2 px-5 py-3.5 bg-white border border-[#D8CBB8] hover:border-[#6E472B] text-[#261C15] text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Sell Your Clothes
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 min-h-[280px] sm:min-h-[360px] lg:min-h-[460px] bg-[#E8DFD1]">
            <SafeImage
              src={HERO_EDITORIAL_IMAGE}
              alt="Curated vintage clothing rack at ThriftHub"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 2. Featured Vintage Picks (only shown when featured items exist) */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#E2D7C6] pb-4">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#261C15]">
                Featured Rack
              </h2>
              <p className="text-sm text-[#5C4A3D]">
                Editor-selected vintage staples added this week.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-[#7D6959]">
              {featuredProducts.length} Featured Pieces
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                inCart={cartIds.has(product.id)}
                isOwnListing={Boolean(user && product.sellerId === user.uid)}
                onSelect={onSelectProduct}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. Main Catalog: Search, Categories & Product Grid */}
      <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#261C15]">
                Newly Added Thrift Finds
              </h2>
              <p className="text-sm text-[#5C4A3D]">
                Every item is one-of-a-kind. Once purchased, it is reserved exclusively for the buyer.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#7D6959] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tees, denim, sizes..."
                aria-label="Search thrift items"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2D7C6] focus:border-[#6E472B] focus:outline-none rounded-lg text-sm text-[#261C15] placeholder:text-[#9A8777]"
              />
            </div>
          </div>

          {/* Category Filter Tabs & Sort Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#E2D7C6]">
            <div
              className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0"
              role="tablist"
              aria-label="Product categories"
            >
              {(['All', ...PRODUCT_CATEGORIES] as const).map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#6E472B] text-[#FAF7F2]'
                        : 'bg-[#F2ECE1] text-[#5C4A3D] hover:bg-[#E8DFD1] hover:text-[#261C15]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <label className="inline-flex items-center gap-2 text-xs text-[#5C4A3D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSold}
                  onChange={(e) => setShowSold(e.target.checked)}
                  className="rounded border-[#C5B49D] accent-[#6E472B]"
                />
                Show sold items
              </label>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'newest' | 'price-asc' | 'price-desc')
                }
                aria-label="Sort products"
                className="px-3 py-2 bg-white border border-[#E2D7C6] rounded-lg text-xs font-medium text-[#261C15] focus:border-[#6E472B] focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white border border-[#E2D7C6] rounded-xl overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-[#F2ECE1]" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-[#F2ECE1] rounded w-1/2" />
                  <div className="h-5 bg-[#F2ECE1] rounded w-3/4" />
                  <div className="h-4 bg-[#F2ECE1] rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white border border-[#E2D7C6] rounded-2xl p-10 text-center space-y-4">
            <h3 className="font-display text-xl font-semibold text-[#261C15]">
              {products.length === 0
                ? 'The vintage rack is ready for its first drop'
                : 'No pieces match your current filter'}
            </h3>
            <p className="text-sm text-[#5C4A3D] max-w-md mx-auto">
              {products.length === 0
                ? 'Sign in with Google to upload your first secondhand item or load the curated 6-piece starter collection.'
                : 'Try clearing your search query or switching to All categories.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {products.length === 0 ? (
                user ? (
                  <button
                    type="button"
                    onClick={() => void handleSeed()}
                    disabled={seeding}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6E472B] hover:bg-[#4E311D] text-[#FAF7F2] text-sm font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    {seeding ? 'Loading Collection...' : 'Load 6 Starter Thrift Items'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void signInWithGoogle()}
                    className="px-5 py-2.5 bg-[#6E472B] hover:bg-[#4E311D] text-[#FAF7F2] text-sm font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Sign in with Google to Start
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setShowSold(false);
                  }}
                  className="px-5 py-2.5 bg-[#F2ECE1] hover:bg-[#E8DFD1] text-[#261C15] text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                inCart={cartIds.has(product.id)}
                isOwnListing={Boolean(user && product.sellerId === user.uid)}
                onSelect={onSelectProduct}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. Storefront Trust & Craftsmanship Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-[#E2D7C6] rounded-2xl p-8 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <Truck className="w-5 h-5 text-[#6E472B]" />
            <h3 className="font-display text-lg font-semibold text-[#261C15]">
              Cash on Delivery
            </h3>
            <p className="text-sm text-[#5C4A3D] leading-relaxed">
              Pay safely in cash when your parcel arrives at your doorstep. Flat {formatPhp(85)} shipping nationwide, or free on orders over {formatPhp(1500)}.
            </p>
          </div>
          <div className="space-y-2">
            <PackageCheck className="w-5 h-5 text-[#6E472B]" />
            <h3 className="font-display text-lg font-semibold text-[#261C15]">
              Verified Condition Grades
            </h3>
            <p className="text-sm text-[#5C4A3D] leading-relaxed">
              Every seller specifies exact garment sizing, fabric condition, and honest measurements before listing on the rack.
            </p>
          </div>
          <div className="space-y-2">
            <Sparkles className="w-5 h-5 text-[#6E472B]" />
            <h3 className="font-display text-lg font-semibold text-[#261C15]">
              Circular Community Wardrobe
            </h3>
            <p className="text-sm text-[#5C4A3D] leading-relaxed">
              Currently{' '}
              <span className="font-mono tabular-nums font-medium text-[#261C15]">
                {availableProducts.length}
              </span>{' '}
              active pre-loved pieces curated across T-shirts, denim, outerwear, footwear, and accessories.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
