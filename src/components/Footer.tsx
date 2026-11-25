import { AppView } from '../types';

interface FooterProps {
  onNavigate: (view: AppView) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="border-t border-[#E2D7C6] bg-[#F2ECE1]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <p className="font-display text-lg font-semibold text-[#261C15]">
            ThriftHub
          </p>
          <p className="text-xs text-[#5C4A3D]">
            Curated secondhand wardrobe marketplace in Philippine pesos · Cash on Delivery nationwide.
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-6 text-xs font-medium text-[#5C4A3D]">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="hover:text-[#261C15] cursor-pointer"
          >
            Shop
          </button>
          <button
            type="button"
            onClick={() => onNavigate('seller')}
            className="hover:text-[#261C15] cursor-pointer"
          >
            Sell an Item
          </button>
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="hover:text-[#261C15] cursor-pointer"
          >
            Track Orders
          </button>
          <button
            type="button"
            onClick={() => onNavigate('checkout')}
            className="hover:text-[#261C15] cursor-pointer"
          >
            Checkout
          </button>
        </nav>
      </div>
    </footer>
  );
}
