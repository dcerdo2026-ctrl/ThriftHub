import { ProductCategory, ProductCondition } from '../types';

export interface StarterProductSeed {
  title: string;
  description: string;
  category: ProductCategory;
  size: string;
  condition: ProductCondition;
  pricePhp: number;
  imageUrl: string;
  featured: boolean;
}

export const HERO_EDITORIAL_IMAGE = '/src/assets/images/hero_vintage_rack_1795569365252.jpg';

export const STARTER_THRIFT_PRODUCTS: StarterProductSeed[] = [
  {
    title: '1990s Camel Canvas Workwear Trucker Jacket',
    description:
      'Heavyweight cotton duck canvas jacket with dark chocolate corduroy collar and brass snap buttons. Warm, broken-in patina with clean lining and zero tears.',
    category: 'Jackets',
    size: 'L',
    condition: 'Like New',
    pricePhp: 1450,
    imageUrl: '/src/assets/images/product_trucker_jacket_1795569365915.jpg',
    featured: true,
  },
  {
    title: 'Washed Espresso Boxy Heavyweight Tee',
    description:
      'Single-stitch inspired 280gsm combed cotton crewneck t-shirt in sun-faded espresso brown. Thick ribbed collar holds shape effortlessly.',
    category: 'T-Shirts',
    size: 'M',
    condition: 'Gently Used',
    pricePhp: 380,
    imageUrl: '/src/assets/images/product_vintage_tee_1795569365656.jpg',
    featured: true,
  },
  {
    title: 'Selvedge Relaxed Straight Vintage Denim Jeans',
    description:
      'Mid-rise straight-leg Japanese-style selvedge denim with natural honeycombing and clean cuffed hems. Waist measures 31 inches, inseam 30 inches.',
    category: 'Jeans',
    size: '31 / M',
    condition: 'Gently Used',
    pricePhp: 890,
    imageUrl: '/src/assets/images/product_denim_jeans_1795569365281.jpg',
    featured: true,
  },
  {
    title: 'Oatmeal Heather Heritage Fleece Hoodie',
    description:
      'Cozy raglan-sleeve pullover hoodie in unbleached oatmeal beige fleece with kangaroo pocket and woven heritage hem patch.',
    category: 'Hoodies',
    size: 'L',
    condition: 'Like New',
    pricePhp: 750,
    imageUrl: '/src/assets/images/product_fleece_hoodie_1795569366141.jpg',
    featured: false,
  },
  {
    title: 'Chestnut Full-Grain Leather Chelsea Boots',
    description:
      'Goodyear-welted vintage leather Chelsea boots with deep burnished chestnut finish, sturdy elastic gussets, and plenty of tread life remaining.',
    category: 'Shoes',
    size: 'US 9 / EU 42',
    condition: 'Vintage Worn',
    pricePhp: 1650,
    imageUrl: '/src/assets/images/product_leather_boots_1795569366683.jpg',
    featured: false,
  },
  {
    title: 'Waxed Canvas & Saddle Leather Satchel Bag',
    description:
      'Olive-brown waxed canvas commuter messenger bag with thick full-grain leather flap, antique brass buckles, and adjustable shoulder strap.',
    category: 'Accessories',
    size: 'One Size',
    condition: 'Like New',
    pricePhp: 1120,
    imageUrl: '/src/assets/images/product_canvas_satchel_1795569367330.jpg',
    featured: false,
  },
];
