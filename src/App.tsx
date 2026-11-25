import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { AdminDashboard } from './components/AdminDashboard';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutView } from './components/CheckoutView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ProfileView } from './components/ProfileView';
import { SellerDashboard } from './components/SellerDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { StoreProvider, useStore } from './contexts/StoreContext';
import { AppView, Product } from './types';

function getInitialView(): AppView {
  const path = window.location.pathname.replace(/^\//, '').toLowerCase();
  if (path === 'checkout' || path === 'profile' || path === 'seller' || path === 'admin') {
    return path;
  }
  return 'home';
}

function ThriftHubApp() {
  const { user, authError, clearAuthError } = useAuth();
  const { cart, addToCart } = useStore();
  const [view, setView] = useState<AppView>(getInitialView);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const onPopState = () => setView(getInitialView());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (nextView: AppView) => {
    setView(nextView);
    const nextPath = nextView === 'home' ? '/' : `/${nextView}`;
    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, '', nextPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((current) => (current === msg ? null : current));
    }, 3200);
  };

  const handleAddToCart = (product: Product) => {
    const result = addToCart(product);
    showToast(result.message);
  };

  const inCart = (productId: string) => cart.some((c) => c.productId === productId);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#261C15]">
      <Header
        currentView={view}
        onNavigate={navigate}
        onOpenCart={() => setCartOpen(true)}
        onOpenSell={() => navigate('seller')}
      />

      {authError && (
        <div
          role="alert"
          className="bg-[#FDF3F1] border-b border-[#E8C5BD] px-4 py-2.5 text-xs text-[#9E3F2B]"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <span>Sign-in notice: {authError}</span>
            <button
              type="button"
              onClick={clearAuthError}
              aria-label="Dismiss error"
              className="p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1">
        {view === 'home' && (
          <HomeView
            onSelectProduct={setSelectedProduct}
            onAddToCart={handleAddToCart}
            onStartSelling={() => navigate('seller')}
          />
        )}
        {view === 'checkout' && (
          <CheckoutView
            onBackToShop={() => navigate('home')}
            onViewOrders={() => navigate('profile')}
          />
        )}
        {view === 'profile' && <ProfileView />}
        {view === 'seller' && <SellerDashboard />}
        {view === 'admin' && <AdminDashboard />}
      </main>

      <Footer onNavigate={navigate} />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => navigate('checkout')}
      />

      <ProductDetailModal
        product={selectedProduct}
        inCart={selectedProduct ? inCart(selectedProduct.id) : false}
        isOwnListing={Boolean(
          user && selectedProduct && selectedProduct.sellerId === user.uid
        )}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onOpenCart={() => setCartOpen(true)}
      />

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 bg-[#261C15] text-[#FAF7F2] text-sm px-4 py-3 rounded-xl shadow-lg flex items-center gap-3"
        >
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Close notification"
            className="text-[#D8CBB8] hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StoreProvider>
          <ThriftHubApp />
        </StoreProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
