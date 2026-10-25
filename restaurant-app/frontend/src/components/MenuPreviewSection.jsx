import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Star, Clock, ArrowRight } from 'lucide-react';
import { SAMPLE_MENU, MENU_CATEGORIES } from '../data/sampleMenu';
import FadeUp from './animations/FadeUp';

export default function MenuPreviewSection() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [addedIds, setAddedIds] = useState([]);

  const filteredMenu = activeCategory === 'All'
    ? SAMPLE_MENU
    : SAMPLE_MENU.filter(item => item.category === activeCategory);

  const handleAddToCart = (id) => {
    if (!addedIds.includes(id)) {
      setAddedIds([...addedIds, id]);
      setTimeout(() => {
        setAddedIds(prev => prev.filter(item => item !== id));
      }, 2000);
    }
  };

  return (
    <section className="py-24 bg-[#0B0B0B] relative border-y border-[#252525]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <FadeUp delay={0.1}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-xs uppercase tracking-widest font-extrabold text-[#FF4D00]">
                CURATED SELECTIONS
              </span>
              <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold text-white uppercase font-mono tracking-tight">
                POPULAR <span className="text-gradient-orange">MENU DISHES</span>
              </h2>
              <p className="mt-2 text-base text-[#A1A1A1]">
                Explore our chef's signature creations crafted with premium seasonal ingredients.
              </p>
            </div>

            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#111111] hover:bg-[#1a1a1a] border border-[#252525] hover:border-[#FF4D00]/50 text-white font-bold text-sm transition-all duration-300 w-fit shadow-md"
              >
                VIEW FULL MENU
                <ArrowRight className="w-4 h-4 text-[#FF4D00]" />
              </Link>
            </motion.div>
          </div>
        </FadeUp>

        {/* Category Filters */}
        <FadeUp delay={0.2}>
          <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-10">
            {MENU_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white shadow-lg shadow-[#FF4D00]/25'
                    : 'bg-[#111111] text-[#A1A1A1] border border-[#252525] hover:text-white hover:border-[#FF4D00]/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </FadeUp>

        {/* Food Cards Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredMenu.map((item, idx) => {
              const isAdded = addedIds.includes(item.id);
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, delay: idx * 0.05 }}
                  whileHover={{ y: -6 }}
                  key={item.id}
                  className="bg-[#111111] rounded-2xl border border-[#252525] overflow-hidden hover:border-[#FF4D00]/40 transition-colors duration-300 flex flex-col group shadow-xl"
                >
                  {/* Card Image */}
                  <div className="relative h-56 overflow-hidden bg-[#050505]">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent opacity-80" />
                    
                    {/* Category Badge */}
                    <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#050505]/80 backdrop-blur-md text-[11px] font-mono font-bold text-white border border-[#252525]">
                      {item.category}
                    </span>

                    {/* Rating & Prep Time */}
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs font-semibold text-white">
                      <span className="flex items-center gap-1 bg-[#050505]/80 px-2.5 py-1 rounded-md border border-[#252525]">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        {item.rating}
                      </span>
                      <span className="flex items-center gap-1 bg-[#050505]/80 px-2.5 py-1 rounded-md border border-[#252525] text-[#A1A1A1]">
                        <Clock className="w-3.5 h-3.5 text-[#FF7A00]" />
                        {item.prepTime}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-[#FF7A00] transition-colors">
                        {item.name}
                      </h3>
                      <p className="mt-2 text-xs text-[#A1A1A1] line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {item.tags.map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-[#050505] text-[#A1A1A1] border border-[#252525]">
                          #{t}
                        </span>
                      ))}
                    </div>

                    {/* Price and Add Button */}
                    <div className="mt-6 pt-4 border-t border-[#252525] flex items-center justify-between">
                      <div>
                        <span className="text-xs text-[#A1A1A1] block uppercase font-mono">Price</span>
                        <span className="text-2xl font-black text-white font-mono">{item.price}</span>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAddToCart(item.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-600 text-white shadow-lg'
                            : 'bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-white shadow-md shadow-[#FF4D00]/20'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-4 h-4 stroke-[3]" />
                            ADDED!
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 stroke-[3]" />
                            ADD TO ORDER
                          </>
                        )}
                      </motion.button>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

      </div>
    </section>
  );
}
