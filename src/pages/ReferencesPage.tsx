import React, { useState } from 'react';
import { Search, LayoutGrid } from 'lucide-react';
import { AppHeader } from '../components/AppHeader';
import { BottomNavigation } from '../components/BottomNavigation';
import { CategoryChip } from '../components/CategoryChip';
import { ReferenceCard } from '../components/ReferenceCard';
import { SectionHeader } from '../components/SectionHeader';
import { MOCK_REFERENCES } from '../data/mockData';
import { Reference } from '../types';

const CATEGORIES = ['All', 'Characters', 'Landscapes', 'Poses', 'Color'];

export const ReferencesPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [references, setReferences] = useState<Reference[]>(MOCK_REFERENCES);

  const handleBookmarkToggle = (id: string) => {
    setReferences((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isBookmarked: !item.isBookmarked } : item
      )
    );
  };

  const filteredReferences = references.filter((ref) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      ref.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      ref.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#191715] text-[#F1E2CB] max-w-[440px] mx-auto relative pb-24">
      <AppHeader />

      <main className="px-4 sm:px-5 space-y-4 pt-1">
        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-[#A99D8E]" />
          <input
            type="text"
            placeholder="Search references"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm font-sans bg-[#272320] border border-[#3A332C] rounded-2xl text-[#F1E2CB] placeholder-[#A99D8E] focus:outline-none focus:border-[#514940] transition-colors"
          />
        </div>

        {/* Horizontal Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:-mx-5 sm:px-5">
          {CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat}
              label={cat}
              isSelected={selectedCategory === cat}
              onClick={() => setSelectedCategory(cat)}
            />
          ))}
        </div>

        {/* Saved References Section Header */}
        <div className="pt-2">
          <SectionHeader
            title="Saved References"
            rightElement={
              <div className="p-1.5 rounded-lg bg-[#272320] border border-[#3A332C] text-[#D9B98D]">
                <LayoutGrid className="w-4 h-4" />
              </div>
            }
          />

          {/* 2-Column Responsive Grid */}
          {filteredReferences.length > 0 ? (
            <div className="grid grid-cols-2 gap-3.5">
              {filteredReferences.map((ref) => (
                <ReferenceCard
                  key={ref.id}
                  reference={ref}
                  onBookmarkToggle={handleBookmarkToggle}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-[#A99D8E]">
              <p className="text-sm font-sans">No references found</p>
            </div>
          )}
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};
