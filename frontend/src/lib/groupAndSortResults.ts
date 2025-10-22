import type { ScrapedProduct } from './api';

export interface GroupedProduct {
  key: string; // typically the url
  name: string;
  url: string;
  imageUrl?: string | null;
  marketplaces: ScrapedProduct[]; // sorted ascending by price
  displayPrice: number; // cheapest price (Infinity if none)
  cheapestMarketplace?: string;
  category?: string;
  rating?: string | number;
}

/**
 * Group scraped marketplace entries by product identity (prefer url) and sort
 * marketplaces inside each group by price ascending. Then sort groups by
 * their cheapest price ascending.
 */
export function groupAndSortResults(products: ScrapedProduct[]): GroupedProduct[] {
  const map = new Map<string, GroupedProduct>();

  for (const p of products) {
    const key = (p.url || p.name || '').trim();
    if (!key) continue; // skip junk rows without id

    if (!map.has(key)) {
      map.set(key, {
        key,
        name: p.name,
        url: p.url,
        imageUrl: p.imageUrl || null,
        marketplaces: [],
        displayPrice: Infinity,
        cheapestMarketplace: undefined,
        category: p.category,
        rating: p.rating,
      });
    }

    const group = map.get(key)!;
    // push marketplace entry
    group.marketplaces.push(p);
  }

  // Sort marketplaces within each group and compute displayPrice/cheapestMarketplace
  const groups: GroupedProduct[] = [];
  for (const g of map.values()) {
    g.marketplaces.sort((a, b) => {
      const pa = a.price == null ? Infinity : a.price;
      const pb = b.price == null ? Infinity : b.price;
      return pa - pb;
    });

    const cheapest = g.marketplaces.find(m => m.price != null && !Number.isNaN(m.price));
    if (cheapest) {
      g.displayPrice = cheapest.price as number;
      g.cheapestMarketplace = cheapest.marketplace;
    } else {
      g.displayPrice = Infinity;
      g.cheapestMarketplace = undefined;
    }

    groups.push(g);
  }

  // Sort groups by displayPrice ascending (Infinity go to the end)
  groups.sort((a, b) => {
    const pa = a.displayPrice == null ? Infinity : a.displayPrice;
    const pb = b.displayPrice == null ? Infinity : b.displayPrice;
    return pa - pb;
  });

  return groups;
}
