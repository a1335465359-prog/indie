
import React from 'react';
import { Site } from '../types';

interface SiteCardProps {
  site: Site;
  onTagAdd: (url: string) => void;
  onContextMenu: (e: React.MouseEvent, site: Site) => void;
  themeName?: string;
}

const SiteCard: React.FC<SiteCardProps> = ({ site, onTagAdd, onContextMenu, themeName }) => {
  const isShein = site.c === 'shein';
  const domain = site.u.replace('https://', '').replace('www.', '').split('/')[0];
  const stars = '★'.repeat(site.rating || 0);

  // Use shadow style from vars + dynamic blur
  const cardStyle = {
    boxShadow: 'var(--card-shadow)',
    backdropFilter: 'blur(var(--card-blur))'
  };

  let cardClass = `
    card group relative flex flex-col justify-between p-3.5 h-[110px] rounded-xl border border-[var(--glass-border)]
    bg-[var(--glass-surface)] text-decoration-none transition-all duration-300
    hover:-translate-y-1
    cursor-pointer
  `;

  if (isShein) {
    cardClass += ` border-[rgba(255,215,0,0.3)]`;
  }

  const titleClass = `
    text-[15px] font-semibold mb-1 whitespace-nowrap overflow-hidden text-ellipsis
    text-[var(--text-main)]
    ${isShein ? 'text-[#ffe066]' : ''}
    ${isShein && themeName === 'White' ? '!text-[#d4a017]' : ''}
  `;

  return (
    <a 
      href={site.u} 
      target="_blank" 
      rel="noopener noreferrer"
      className={cardClass}
      style={cardStyle}
      onContextMenu={(e) => onContextMenu(e, site)}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--card-shadow-hover)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--card-shadow)'}
    >
      {site.pinned && (
        <div className="absolute top-0 right-0 w-3 h-3 bg-[var(--accent)] rounded-bl-lg rounded-tr-lg shadow-[0_0_5px_var(--accent)]" />
      )}

      <div>
        <div className={titleClass}>{site.n}</div>
        <div className="text-[#ffd700] text-[11px] tracking-widest h-4 drop-shadow-sm">{stars}</div>
        <div className="text-[11px] text-[var(--text-sub)] font-mono opacity-80">{domain}</div>
      </div>
      
      <div className="flex justify-between items-center mt-auto">
        <div className="flex gap-1 flex-wrap flex-1 overflow-hidden h-5">
          {site.t.map((tag, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[var(--text-sub)] whitespace-nowrap">
              {tag}
            </span>
          ))}
        </div>
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTagAdd(site.u);
          }}
          className="ml-1 w-5 h-5 rounded flex items-center justify-center bg-[var(--glass-border)] text-[var(--text-main)] hover:bg-[var(--accent)] hover:text-black transition-colors"
        >
          +
        </button>
      </div>
    </a>
  );
};

export default SiteCard;