import React, { useEffect, useState } from 'react';
import { ImagePlus, Upload, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ProductInput } from '../contexts/StoreContext';
import { uploadProductImage } from '../lib/imageUpload';
import {
  LIMITS,
  Product,
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  ProductCategory,
  ProductCondition,
  ProductStatus,
} from '../types';
import { SafeImage } from './SafeImage';

interface ProductFormModalProps {
  open: boolean;
  initialProduct?: Product | null;
  allowFeaturedToggle?: boolean;
  onClose: () => void;
  onSave: (input: ProductInput, existingId?: string) => Promise<void>;
}

export function ProductFormModal({
  open,
  initialProduct,
  allowFeaturedToggle = false,
  onClose,
  onSave,
}: ProductFormModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ProductCategory>('T-Shirts');
  const [size, setSize] = useState('M');
  const [condition, setCondition] = useState<ProductCondition>('Gently Used');
  const [pricePhp, setPricePhp] = useState('450');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState<ProductStatus>('available');

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadNote, setUploadNote] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (initialProduct) {
      setTitle(initialProduct.title);
      setCategory(initialProduct.category);
      setSize(initialProduct.size);
      setCondition(initialProduct.condition);
      setPricePhp(String(initialProduct.pricePhp));
      setDescription(initialProduct.description);
      setImageUrl(initialProduct.imageUrl);
      setFeatured(initialProduct.featured);
      setStatus(initialProduct.status);
    } else {
      setTitle('');
      setCategory('T-Shirts');
      setSize('M');
      setCondition('Gently Used');
      setPricePhp('');
      setDescription('');
      setImageUrl('');
      setFeatured(false);
      setStatus('available');
    }
    setError(null);
    setUploadNote(null);
    setUploadProgress(0);
  }, [initialProduct, open]);

  if (!open) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setError(null);
    setUploadNote(null);
    setUploading(true);
    setUploadProgress(10);
    try {
      const result = await uploadProductImage(file, user.uid, (pct) =>
        setUploadProgress(pct)
      );
      setImageUrl(result.url);
      setUploadNote(
        result.source === 'storage'
          ? 'Uploaded to Firebase Storage.'
          : 'Optimized and attached ready for listing.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedPrice = Number(pricePhp);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError('Please enter a valid price in Philippine pesos.');
      return;
    }
    if (title.trim().length < LIMITS.MIN_TITLE) {
      setError('Product title must be at least 2 characters.');
      return;
    }
    if (description.trim().length < LIMITS.MIN_DESCRIPTION) {
      setError('Please include at least a short 5+ character description.');
      return;
    }
    if (!imageUrl.trim()) {
      setError('Please upload a product photo or paste an image URL.');
      return;
    }

    setSubmitting(true);
    try {
      await onSave(
        {
          title,
          category,
          size,
          condition,
          pricePhp: parsedPrice,
          description,
          imageUrl,
          featured,
          status,
        },
        initialProduct?.id
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#261C15]/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-form-title"
      onClick={onClose}
    >
      <div
        className="bg-[#FAF7F2] border border-[#E2D7C6] rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E2D7C6] pb-4">
          <h2
            id="product-form-title"
            className="font-display text-2xl font-semibold text-[#261C15]"
          >
            {initialProduct ? 'Edit Thrift Listing' : 'Upload New Thrift Item'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[#5C4A3D] hover:bg-[#F2ECE1] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Image Upload & Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            <div className="sm:col-span-5 aspect-[4/3] rounded-xl overflow-hidden bg-[#F2ECE1] border border-[#E2D7C6]">
              {imageUrl ? (
                <SafeImage
                  src={imageUrl}
                  alt={title || 'Product preview'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#7D6959] p-4 text-center">
                  <ImagePlus className="w-7 h-7 mb-1.5 opacity-60" />
                  <span className="text-xs">Photo preview</span>
                </div>
              )}
            </div>

            <div className="sm:col-span-7 space-y-3">
              <label className="block">
                <span className="block text-xs font-medium text-[#5C4A3D] mb-1.5">
                  Product Photo (Firebase Storage)
                </span>
                <div className="relative flex items-center justify-center px-4 py-3 border border-dashed border-[#C5B49D] bg-white hover:border-[#6E472B] rounded-lg cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex items-center gap-2 text-xs font-medium text-[#261C15]">
                    <Upload className="w-4 h-4 text-[#6E472B]" />
                    <span>
                      {uploading
                        ? `Uploading (${uploadProgress}%)...`
                        : 'Choose image file (JPG, PNG, WebP)'}
                    </span>
                  </div>
                </div>
              </label>

              {uploadNote && (
                <p className="text-xs text-[#2E5A44] font-medium">{uploadNote}</p>
              )}

              <div className="space-y-1">
                <label className="block text-xs text-[#7D6959]">
                  Or paste image URL
                </label>
                <input
                  type="text"
                  value={imageUrl.startsWith('data:') ? '' : imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-white border border-[#E2D7C6] focus:border-[#6E472B] focus:outline-none rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#5C4A3D]">
              Item Name *
            </label>
            <input
              type="text"
              required
              maxLength={LIMITS.MAX_TITLE}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Vintage 90s Levi's Denim Trucker Jacket"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E2D7C6] focus:border-[#6E472B] focus:outline-none rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#5C4A3D]">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2D7C6] focus:border-[#6E472B] focus:outline-none rounded-lg text-sm"
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#5C4A3D]">
                Condition *
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ProductCondition)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2D7C6] focus:border-[#6E472B] focus:outline-none rounded-lg text-sm"
              >
                {PRODUCT_CONDITIONS.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#5C4A3D]">
                Size / Measurements *
              </label>
              <input
                type="text"
                required
                maxLength={LIMITS.MAX_SIZE}
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="e.g. M, 32W, US 9, One Size"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2D7C6] focus:border-[#6E472B] focus:outline-none rounded-lg text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#5C4A3D]">
                Price in Philippine Pesos (₱) *
              </label>
              <input
                type="number"
                required
                min={1}
                max={LIMITS.MAX_PRICE_PHP}
                step="0.01"
                value={pricePhp}
                onChange={(e) => setPricePhp(e.target.value)}
                placeholder="450"
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2D7C6] focus:border-[#6E472B] focus:outline-none rounded-lg text-sm font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#5C4A3D]">
              Description &amp; Flaws (if any) *
            </label>
            <textarea
              rows={3}
              required
              maxLength={LIMITS.MAX_DESCRIPTION}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe fabric weight, fit, wash details, or minor signs of wear..."
              className="w-full px-3.5 py-2.5 bg-white border border-[#E2D7C6] focus:border-[#6E472B] focus:outline-none rounded-lg text-sm"
            />
          </div>

          {(initialProduct || allowFeaturedToggle) && (
            <div className="flex flex-wrap items-center gap-6 pt-1">
              {initialProduct && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-[#5C4A3D]">Listing Status:</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProductStatus)}
                    className="px-2.5 py-1.5 bg-white border border-[#E2D7C6] rounded-lg text-xs"
                  >
                    <option value="available">Available</option>
                    <option value="sold">Sold</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              )}

              {allowFeaturedToggle && (
                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#261C15] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="rounded border-[#C5B49D] accent-[#6E472B]"
                  />
                  Highlight in Featured Rack
                </label>
              )}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="p-3 bg-[#FDF3F1] border border-[#E8C5BD] text-[#9E3F2B] text-xs rounded-lg"
            >
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-[#E2D7C6]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-[#5C4A3D] hover:text-[#261C15] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="px-6 py-2.5 bg-[#6E472B] hover:bg-[#4E311D] disabled:opacity-60 text-[#FAF7F2] text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {submitting
                ? 'Saving...'
                : initialProduct
                ? 'Save Changes'
                : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
