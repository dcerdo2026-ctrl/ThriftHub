import { useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import { AppView } from '../types';

interface HeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenCart: () => void;
  onOpenSell: () => void;
}

export function Header({
  currentView,
  onNavigate,
  onOpenCart,
  onOpenSell,
}: HeaderProps) {
  const { user, profile, isAdmin, signingIn, signInWithGoogle } = useAuth();
  const { cart } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (view: AppView) => {
    setMobileMenuOpen(false);
    onNavigate(view);
  };

  const handleSellClick = () => {
    setMobileMenuOpen(false);
    onOpenSell();
  };

  const navLinkClass = (active: boolean) =>
    `text-sm font-medium transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 cursor-pointer ${
      active
        ? 'text-[#261C15] border-[#6E472B]'
        : 'text-[#5C4A3D] border-transparent hover:text-[#261C15] hover:border-[#C5B49D]'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-sm border-b border-[#E2D7C6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="font-display text-2xl font-semibold tracking-tight text-[#261C15] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E472B] rounded"
        >
          ThriftHub
        </button>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Primary">
          <button
            type="button"
            onClick={() => handleNav('home')}
            className={navLinkClass(currentView === 'home')}
          >
            Shop
          </button>
          <button
            type="button"
            onClick={handleSellClick}
            className={navLinkClass(false)}
          >
            Sell Item
          </button>
          <button
            type="button"
            onClick={() => handleNav('profile')}
            className={navLinkClass(currentView === 'profile')}
          >
            My Orders
          </button>
          <button
            type="button"
            onClick={() => handleNav('seller')}
            className={navLinkClass(currentView === 'seller')}
          >
            Seller Studio
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => handleNav('admin')}
              className={navLinkClass(currentView === 'admin')}
            >
              Admin
            </button>
          )}
        </nav>

        {/* Zone 3: Bag & Primary Auth / Account Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`Shopping bag with ${cart.length} items`}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#261C15] hover:bg-[#F2ECE1] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#6E472B]" />
            <span>Bag</span>
            <span className="font-mono tabular-nums text-xs bg-[#E8DFD1] text-[#261C15] px-1.5 py-0.5 rounded">
              {cart.length}
            </span>
          </button>

          {user ? (
            <button
              type="button"
              onClick={() => handleNav('profile')}
              className="hidden sm:inline-flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-lg border border-[#E2D7C6] bg-white hover:border-[#C5B49D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {profile?.photoURL || user.photoURL ? (
                <img
                  src={profile?.photoURL || user.photoURL || ''}
                  alt={profile?.displayName || user.displayName || 'Account'}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <span className="w-6 h-6 rounded-full bg-[#6E472B] text-[#FAF7F2] text-xs font-semibold flex items-center justify-center">
                  {(profile?.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </span>
              )}
              <span className="text-sm font-medium text-[#261C15] max-w-[110px] truncate">
                {(profile?.displayName || user.displayName || 'Account').split(' ')[0]}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={signingIn}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-[#FAF7F2] bg-[#6E472B] hover:bg-[#4E311D] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {signingIn ? 'Signing in...' : 'Sign in'}
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden p-2 rounded-lg text-[#261C15] hover:bg-[#F2ECE1] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E2D7C6] bg-[#FAF7F2] px-4 py-4 space-y-2">
          <div className="flex flex-col space-y-1">
            <button
              type="button"
              onClick={() => handleNav('home')}
              className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#261C15] hover:bg-[#F2ECE1]"
            >
              Shop Collection
            </button>
            <button
              type="button"
              onClick={handleSellClick}
              className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#261C15] hover:bg-[#F2ECE1]"
            >
              Sell an Item
            </button>
            <button
              type="button"
              onClick={() => handleNav('profile')}
              className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#261C15] hover:bg-[#F2ECE1]"
            >
              My Orders &amp; Profile
            </button>
            <button
              type="button"
              onClick={() => handleNav('seller')}
              className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#261C15] hover:bg-[#F2ECE1]"
            >
              Seller Studio
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => handleNav('admin')}
                className="text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#6E472B] hover:bg-[#F2ECE1]"
              >
                Admin Dashboard
              </button>
            )}
          </div>
          {!user && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                void signInWithGoogle();
              }}
              className="w-full py-2.5 px-4 bg-[#6E472B] text-[#FAF7F2] text-sm font-medium rounded-lg"
            >
              Sign in with Google
            </button>
          )}
        </div>
      )}
    </header>
  );
}
