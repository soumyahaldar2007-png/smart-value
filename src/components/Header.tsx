/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface HeaderProps {
  onMenuClick: (type: 'about' | 'contacts') => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const menuItems = [
    { label: 'About', id: 'about' as const },
    { label: 'Contacts', id: 'contacts' as const }
  ];

  return (
    <header
      id="main-app-header"
      className="absolute top-0 left-0 w-full px-6 py-6 md:px-12 md:py-8 flex items-center justify-between z-30 select-none"
    >
      {/* Circle Brand Mark Logo (Exactly matching the minimalist 'A' in circle from picture) */}
      <div
        id="brand-mark-wrapper"
        onClick={() => onMenuClick('about')}
        className="flex items-center gap-3 cursor-pointer group pointer-events-auto"
        role="button"
        tabIndex={0}
        aria-label="Education logo home link"
        onKeyDown={(e) => { if (e.key === 'Enter') onMenuClick('about'); }}
      >
        <div className="w-10 h-10 rounded-full border border-zinc-700/80 group-hover:border-white group-hover:scale-105 flex items-center justify-center transition-all duration-500 ease-out">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            {/* The stylized elegant delta triangle/A representation */}
            <path d="M12 4L4 18H20L12 4Z" />
            <line x1="8.5" y1="13.5" x2="15.5" y2="13.5" />
          </svg>
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-xs uppercase font-medium tracking-widest text-zinc-400 group-hover:text-white transition-colors duration-300">
            EDUCATION
          </div>
          <div className="text-[9px] font-mono tracking-widest text-zinc-600">
            SYSTEM.026 // ON
          </div>
        </div>
      </div>

      {/* Navigation list (About, Contacts) styled exactly like the 3D Liquid Glass gel buttons */}
      <nav id="top-nav-menu" className="flex items-center gap-4 sm:gap-6 pointer-events-auto">
        {menuItems.map((item) => {
          return (
            <button
              key={item.id}
              id={`nav-link-${item.id}`}
              onClick={() => onMenuClick(item.id)}
              className="btn-liquid-base btn-liquid-glass px-6 py-2.5 text-xs sm:text-sm tracking-widest shadow-md transition-all duration-300"
            >
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
