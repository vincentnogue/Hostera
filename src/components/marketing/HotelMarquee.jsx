import React from 'react';

// 50 grand (yet lesser-known) luxury hotels — real logos served from their official brand domains
const HOTELS = [
  { name: 'Amanpuri', domain: 'aman.com' },
  { name: 'Soneva Fushi', domain: 'soneva.com' },
  { name: 'Amangiri', domain: 'aman.com' },
  { name: 'Nihi Sumba', domain: 'nihi.com' },
  { name: 'Song Saa', domain: 'songsaa.com' },
  { name: 'The Brando', domain: 'thebrando.com' },
  { name: 'Laucala', domain: 'laucala.com' },
  { name: 'North Island', domain: 'north-island.com' },
  { name: 'Jade Mountain', domain: 'jademountain.com' },
  { name: 'Nayara Springs', domain: 'nayarasprings.com' },
  { name: 'Casa Gangotena', domain: 'belmond.com' },
  { name: 'Explora Patagonia', domain: 'explora.com' },
  { name: 'Awasi Iguazú', domain: 'awasi.com' },
  { name: 'Inkaterra', domain: 'inkaterra.com' },
  { name: 'Tierra Atacama', domain: 'tierrahotels.com' },
  { name: 'Six Senses', domain: 'sixsenses.com' },
  { name: 'COMO Parrot Cay', domain: 'comohotels.com' },
  { name: 'Anantara Qasr Al Sarab', domain: 'anantara.com' },
  { name: 'Alila Jabal Akhdar', domain: 'alilahotels.com' },
  { name: 'Longitude 131°', domain: 'longitude131.com.au' },
  { name: 'Sails in the Desert', domain: 'ayersrockresort.com.au' },
  { name: 'El Questro', domain: 'elquestro.com.au' },
  { name: 'Southern Ocean Lodge', domain: 'southernoceanlodge.com.au' },
  { name: 'Qualia', domain: 'qualia.com.au' },
  { name: 'Ballyfin', domain: 'ballyfin.com' },
  { name: 'Adare Manor', domain: 'adaremanor.com' },
  { name: 'Ashford Castle', domain: 'ashfordcastle.com' },
  { name: 'Waterford Castle', domain: 'waterfordcastle.com' },
  { name: 'Ballynahinch Castle', domain: 'ballynahinch-castle.com' },
  { name: 'Fogo Island Inn', domain: 'fogoislandinn.ca' },
  { name: 'Wickaninnish Inn', domain: 'wickinn.com' },
  { name: 'Sonora Resort', domain: 'sonoraresort.com' },
  { name: 'Clayoquot Wilderness', domain: 'clayoquotwilderness.com' },
  { name: 'Nimmo Bay', domain: 'nimmobay.com' },
  { name: 'Twin Farms', domain: 'twinfarms.com' },
  { name: 'Amangani', domain: 'aman.com' },
  { name: 'Caldera House', domain: 'calderahouse.com' },
  { name: 'The Ranch at Rock Creek', domain: 'theranchatrockcreek.com' },
  { name: 'Dunton Hot Springs', domain: 'duntonhotsprings.com' },
  { name: 'Masseria Torre Maizza', domain: 'roccofortehotels.com' },
  { name: 'Borgo Egnazia', domain: 'borgoegnazia.com' },
  { name: 'Il Sereno', domain: 'ilsereno.com' },
  { name: 'Le Sirenuse', domain: 'lesirenuse.com' },
  { name: 'Il Pellicano', domain: 'hotelilpellicano.com' },
  { name: "Villa d'Este", domain: 'hotelvilladeste.com' },
  { name: "Badrutt's Palace", domain: 'badruttpalace.com' },
  { name: 'Gritti Palace', domain: 'thegrittipalace.com' },
  { name: 'Hoshinoya Tokyo', domain: 'hoshino-resorts.com' },
  { name: 'Aman Tokyo', domain: 'aman.com' },
];

export default function HotelMarquee() {
  const items = [...HOTELS, ...HOTELS];
  return (
    <div className="relative">
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#F8F9FA] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#F8F9FA] to-transparent z-10 pointer-events-none" />
      <div className="flag-marquee flex items-center gap-3 w-max">
        {items.map((h, i) => (
          <span key={`${h.name}-${i}`} className="inline-flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-full px-4 py-1.5 shrink-0">
            <img
              src={`https://logo.clearbit.com/${h.domain}`}
              alt={h.name}
              loading="lazy"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
              className="w-5 h-5 object-contain shrink-0"
            />
            <span className="text-[11px] font-semibold text-[#17212B] whitespace-nowrap">{h.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}