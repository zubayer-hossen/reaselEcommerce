import ProductCard from './ProductCard.jsx';

// Phones: horizontal swipe row. md+: 4-column grid.
export default function ProductScroller({ products }) {
  return (
    <ul className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
      {products.map((p) => (
        <li key={p._id} className="w-[46%] shrink-0 snap-start sm:w-[30%] md:w-auto"><ProductCard product={p} /></li>
      ))}
    </ul>
  );
}
