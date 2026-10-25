import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Utensils, Star, Clock } from 'lucide-react';
import { SAMPLE_MENU, MENU_CATEGORIES } from '../data/sampleMenu';
import api from '../services/api';

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuItems, setMenuItems] = useState(SAMPLE_MENU);

  useEffect(() => {
    // Fetch live menu items from SQLite Database
    api.getMenu()
      .then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setMenuItems(res.data);
        }
      })
      .catch((err) => {
        console.warn('Using sample menu fallback:', err);
      });
  }, []);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="pt-32 pb-24 bg-[#0f141c] min-h-screen text-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs uppercase tracking-widest font-extrabold text-[#f59e0b]">
            CULINARY EXCELLENCE
          </span>
          <h1 className="mt-2 text-4xl sm:text-6xl font-extrabold text-white font-mono tracking-tight">
            OUR <span className="text-gradient-orange">FULL MENU</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#94a3b8]">
            Explore our artisanal food and beverage collection. Order directly from your table QR code or preview before arriving.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-10 max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Wagyu, Truffle, Burrata, Cocktails..."
            className="w-full bg-[#18202c] border border-[#2d3748] focus:border-[#f59e0b] rounded-2xl pl-12 pr-4 py-4 text-base text-white placeholder-[#94a3b8] focus:outline-none transition-colors"
          />
        </div>

        {/* Category Tabs */}
        <div className="mt-8 flex items-center justify-center gap-2 overflow-x-auto pb-4 scrollbar-none">
          {MENU_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-[#d97706] to-[#f59e0b] text-white shadow-lg shadow-[#f59e0b]/25'
                  : 'bg-[#18202c] text-[#94a3b8] border border-[#2d3748] hover:text-white hover:border-[#f59e0b]/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item) => (
            <motion.div
              layout
              key={item.id}
              className="bg-[#18202c] rounded-3xl border border-[#2d3748] overflow-hidden hover:border-[#f59e0b]/50 transition-all duration-300 flex flex-col group shadow-xl"
            >
              <div className="relative h-60 overflow-hidden bg-[#0f141c]">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#0f141c]/80 backdrop-blur-md text-xs font-mono font-bold text-white border border-[#2d3748]">
                  {item.category}
                </span>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-[#f59e0b] transition-colors">
                    {item.name}
                  </h3>
                  <p className="mt-2 text-sm text-[#94a3b8] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#2d3748] flex items-center justify-between">
                  <span className="text-2xl font-black text-[#10b981] font-mono">{item.price}</span>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    LIVE DB PRICE
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}
