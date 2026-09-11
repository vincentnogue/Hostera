import React from 'react';
import {
  Palmtree, Building2, Mountain, Castle, Waves, Trees, Snowflake,
  Sun, Anchor, Landmark, Sparkles, Tent, Grape, Ship, Hotel,
  Flower2, Compass, Home, Warehouse, MapPin, Gem, Sailboat,
  TreePalm, Binoculars, Wind
} from 'lucide-react';

// Property types Hostera is built for — deliberately generic categories,
// not named real hotels: there are no live customers to name yet, and
// naming specific real brands as "trusted by" without their involvement
// would be a false claim.
const PROPERTY_TYPES = [
  { label: 'Boutique Resorts', icon: Palmtree },
  { label: 'City Hotels', icon: Building2 },
  { label: 'Mountain Lodges', icon: Mountain },
  { label: 'Heritage Castles', icon: Castle },
  { label: 'Beach Resorts', icon: Waves },
  { label: 'Eco Lodges', icon: Trees },
  { label: 'Ski Chalets', icon: Snowflake },
  { label: 'Desert Camps', icon: Sun },
  { label: 'Island Retreats', icon: Anchor },
  { label: 'Historic Manors', icon: Landmark },
  { label: 'Wellness Retreats', icon: Sparkles },
  { label: 'Safari Lodges', icon: Tent },
  { label: 'Vineyard Estates', icon: Grape },
  { label: 'Lakeside Resorts', icon: Ship },
  { label: 'Boutique Hotels', icon: Hotel },
  { label: 'Garden Villas', icon: Flower2 },
  { label: 'Adventure Lodges', icon: Compass },
  { label: 'Countryside Inns', icon: Home },
  { label: 'Converted Estates', icon: Warehouse },
  { label: 'Urban Aparthotels', icon: MapPin },
  { label: 'Luxury Villas', icon: Gem },
  { label: 'Coastal Retreats', icon: Sailboat },
  { label: 'Tropical Resorts', icon: TreePalm },
  { label: 'Wildlife Lodges', icon: Binoculars },
  { label: 'Countryside Retreats', icon: Wind },
];

export default function HotelMarquee() {
  const items = [...PROPERTY_TYPES, ...PROPERTY_TYPES];
  return (
    <div className="relative">
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#F8F9FA] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#F8F9FA] to-transparent z-10 pointer-events-none" />
      <div className="flag-marquee flex items-center gap-3 w-max">
        {items.map((t, i) => {
          const Icon = t.icon;
          return (
            <span key={`${t.label}-${i}`} className="inline-flex items-center gap-2 bg-white border border-brand-border rounded-full px-4 py-1.5 shrink-0">
              <Icon className="w-4 h-4 text-brand-navy shrink-0" />
              <span className="text-[11px] font-semibold text-brand-ink whitespace-nowrap">{t.label}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
