import Link from 'next/link';

export interface CategoryTile {
  name: string;
  slug: string;
  image?: string;
}

/** Shop-by-category tiles: picture and name, one tap to the listing. */
export default function CategoryGrid({ categories, limit = 8 }: { categories: CategoryTile[]; limit?: number }) {
  if (categories.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {categories.slice(0, limit).map((category) => (
        <Link key={category.slug} href={`/products?category=${encodeURIComponent(category.slug)}`} className="group block">
          <div className="aspect-[4/5] overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-900">
            <img
              src={category.image || '/images/categories/top.jpg'}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
          <span className="mt-2 block text-sm text-gray-900 group-hover:underline dark:text-gray-100">{category.name}</span>
        </Link>
      ))}
    </div>
  );
}
