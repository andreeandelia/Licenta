/**
 * SEO Helper - generates canonical URLs and meta tags for pages
 */

const APP_BASE = import.meta.env.VITE_API_BASE || '';
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://bloomery.com';

export const cleanSiteUrl = (url) => {
    return url.replace(/\/$/, '');
};

export const getCanonicalUrl = (path) => {
    const cleanBase = cleanSiteUrl(SITE_URL);
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
};

export const getSeoMeta = {
    home: {
        title: 'Bloomery - Custom Bouquets & Fresh Flowers Online',
        description: 'Create and order beautiful custom bouquets online. Fresh flowers, same-day delivery, and express options available in Bucharest and Ilfov.',
        keywords: 'flowers, bouquets, custom flowers, online flowers, same-day delivery, flowers delivery',
    },
    builder: {
        title: 'Create Custom Bouquet - Bloomery',
        description: 'Design your own custom bouquet with our interactive bouquet builder. Choose from hundreds of flowers and accessories.',
        keywords: 'custom bouquet, flower builder, create bouquet, design flowers',
    },
    cart: {
        title: 'Shopping Cart - Bloomery',
        description: 'Review your bouquets and proceed to checkout. Multiple delivery options available.',
        keywords: 'shopping cart, checkout, order flowers',
    },
    checkout: {
        title: 'Checkout - Bloomery',
        description: 'Complete your flower order. Multiple payment and delivery options available.',
        keywords: 'checkout, payment, delivery',
    },
    orders: {
        title: 'My Orders - Bloomery',
        description: 'View and manage your flower orders.',
        keywords: 'orders, my orders, order history',
    },
    wishlist: {
        title: 'My Wishlist - Bloomery',
        description: 'Save and manage your favorite bouquet designs.',
        keywords: 'wishlist, favorite bouquets, saved designs',
    },
    settings: {
        title: 'Account Settings - Bloomery',
        description: 'Manage your account information and preferences.',
        keywords: 'settings, account, profile',
    },
    help: {
        title: 'Help & Information - Bloomery',
        description: 'Find answers to common questions about our flowers, delivery, and services.',
        keywords: 'help, faq, support, information',
    },
};

export const getOpenGraphTags = {
    home: {
        ogTitle: 'Bloomery - Custom Bouquets & Fresh Flowers Online',
        ogDescription: 'Create and order beautiful custom bouquets online. Fresh flowers delivery.',
        ogImage: `${cleanSiteUrl(SITE_URL)}/og-image.jpg`,
        ogUrl: cleanSiteUrl(SITE_URL),
    },
    builder: {
        ogTitle: 'Create Your Custom Bouquet - Bloomery',
        ogDescription: 'Design your own bouquet with hundreds of flowers and accessories.',
        ogImage: `${cleanSiteUrl(SITE_URL)}/og-builder.jpg`,
        ogUrl: getCanonicalUrl('/builder'),
    },
};
