import React, { useState, useEffect } from 'react';
import { Site, ContextMenuState, CategoryFilter } from './types';
import { THEMES } from './constants';
import { getSites, saveSites } from './services/storageService';
import AuroraBackground from './components/AuroraBackground';
import AuthScreen from './components/AuthScreen';
import Sidebar from './components/Sidebar';
import SiteCard from './components/SiteCard';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [sites, setSites] = useState<Site[]>([]);
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [search, setSearch] = useState('');
  // Default to Stars theme (index 3 in THEMES array)
  const [themeIndex, setThemeIndex] = useState(3);
  
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, siteUrl: null });
  const [showAddModal, setShowAddModal] = useState(false);

  // New Site Form State
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newCat, setNewCat] = useState('custom');

  useEffect(() => {
    // Load sites
    setSites(getSites());
  }, []);

  const currentTheme = THEMES[themeIndex];

  useEffect(() => {
    // Apply theme
    const root = document.documentElement;
    // Apply vars
    Object.entries(currentTheme.vars).forEach(([key, value]) => {
      // @ts-ignore
      root.style.setProperty(key, value);
    });
  }, [themeIndex]);

  const toggleTheme = () => {
    setThemeIndex((prev) => (prev + 1) % THEMES.length);
  };

  const handleLogin = (admin: boolean) => {
    setIsAuthenticated(true);
    setIsAdmin(admin);
  };

  const filteredSites = sites.filter(site => {
    // Category Filter
    if (filter !== 'all') {
      if (filter === 'custom') {
         if (site.c !== 'custom') return false; 
      } else if (filter === '5star') {
        if ((site.rating || 0) !== 5) return false;
      } else {
        if (site.c !== filter) return false;
      }
    }
    
    // Search Filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      const inName = site.n.toLowerCase().includes(lowerSearch);
      const inTags = site.t.some(t => t.toLowerCase().includes(lowerSearch));
      if (!inName && !inTags) return false;
    }
    
    return true;
  });

  const sortedSites = [...filteredSites].sort((a, b) => {
    // 1. Pinned (Absolute Top)
    if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
    }

    // Rating Logic
    const rA = a.rating || 0;
    const rB = b.rating || 0;

    // Define categories:
    // Good: Rating > 2 OR Rating is 0/undefined (New/Unrated sites start in middle)
    // Bad: Rating is 1 or 2
    const isBadA = rA > 0 && rA <= 2;
    const isBadB = rB > 0 && rB <= 2;

    // 2. Sink bad ratings to bottom
    if (isBadA !== isBadB) {
        return isBadA ? 1 : -1; // If A is bad, move it down (1). If B is bad, move A up (-1).
    }

    // 3. Keep existing insertion order for everything else (Stable Sort)
    // or optionally sort good ratings by score
    // if (rA !== rB) return rB - rA; 

    return 0;
  });

  const handleAddTag = (url: string) => {
    const tag = prompt("输入新标签:");
    if (tag) {
      const newSites = sites.map(s => {
        if (s.u === url) {
          return { ...s, t: [...s.t, tag] };
        }
        return s;
      });
      setSites(newSites);
      saveSites(newSites);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, site: Site) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      siteUrl: site.u
    });
  };

  const closeContextMenu = () => {
    if (contextMenu.visible) {
      setContextMenu({ ...contextMenu, visible: false });
    }
  };

  const handleRate = (rating: number) => {
    if (!contextMenu.siteUrl) return;
    const newSites = sites.map(s => {
      if (s.u === contextMenu.siteUrl) {
        return { ...s, rating };
      }
      return s;
    });
    setSites(newSites);
    saveSites(newSites);
    closeContextMenu();
  };

  const handlePin = () => {
    if (!isAdmin || !contextMenu.siteUrl) return;
    const newSites = sites.map(s => {
      if (s.u === contextMenu.siteUrl) {
        return { ...s, pinned: !s.pinned };
      }
      return s;
    });
    setSites(newSites);
    saveSites(newSites);
    closeContextMenu();
  };

  const handleDelete = () => {
    if (!isAdmin || !contextMenu.siteUrl) return;
    if (confirm("确定删除此网站？")) {
      const newSites = sites.filter(s => s.u !== contextMenu.siteUrl);
      setSites(newSites);
      saveSites(newSites);
      closeContextMenu();
    }
  };

  const handleRename = () => {
    if (!contextMenu.siteUrl) return;
    const newName = prompt("输入新名称:");
    if (newName) {
       const newSites = sites.map(s => {
        if (s.u === contextMenu.siteUrl) {
          return { ...s, n: newName };
        }
        return s;
      });
      setSites(newSites);
      saveSites(newSites);
      closeContextMenu();
    }
  };

  const handleManageTags = () => {
    if (!isAdmin || !contextMenu.siteUrl) return;
    const site = sites.find(s => s.u === contextMenu.siteUrl);
    if (!site) return;
    const newTagsStr = prompt("编辑标签 (逗号分隔，留空则清空):", site.t.join(", "));
    if (newTagsStr !== null) {
      const newTagsArr = newTagsStr.trim() ? newTagsStr.split(/,|，/).map(s => s.trim()) : [];
       const newSites = sites.map(s => {
        if (s.u === contextMenu.siteUrl) {
          return { ...s, t: newTagsArr };
        }
        return s;
      });
      setSites(newSites);
      saveSites(newSites);
      closeContextMenu();
    }
  };

  const submitNewSite = () => {
    if (!newUrl || !newName) return alert("请输入名称和网址");
    let formattedUrl = newUrl;
    if (!formattedUrl.startsWith('http')) formattedUrl = 'https://' + formattedUrl;

    const newSite: Site = {
      n: newName,
      u: formattedUrl,
      c: newCat,
      t: newTags ? newTags.split(/,|，/) : ['网友推荐'],
      rating: 0,
      pinned: false
    };

    // Add new site to the BEGINNING of the list so it appears first
    const newSites = [newSite, ...sites];
    setSites(newSites);
    saveSites(newSites);
    setShowAddModal(false);
    setNewUrl('');
    setNewName('');
    setNewTags('');
    alert("添加成功！");
    setFilter('custom');
  };

  const autoFillName = () => {
     if (newUrl && !newName) {
       try {
         const urlObj = new URL(newUrl.startsWith('http') ? newUrl : 'https://' + newUrl);
         setNewName(urlObj.hostname.replace('www.', '').split('.')[0]);
       } catch (e) {}
     }
  };

  // Click outside listener for context menu
  useEffect(() => {
    const handleClick = () => closeContextMenu();
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu]);

  // Determine if the currently right-clicked site is pinned
  const currentSite = sites.find(s => s.u === contextMenu.siteUrl);
  const isPinned = currentSite?.pinned;

  if (!isAuthenticated) {
    return (
      <>
        <AuroraBackground mode="particles" />
        <AuthScreen onLogin={handleLogin} />
      </>
    );
  }

  return (
    <div className="flex w-full h-screen overflow-hidden relative text-[var(--text-main)] transition-colors duration-300 font-sans">
      <AuroraBackground mode={currentTheme.bgMode} />
      
      <div className="relative z-10 flex w-full h-full max-w-[1920px] mx-auto p-4 gap-4 flex-col md:flex-row">
        <Sidebar currentFilter={filter} setFilter={setFilter} />

        <main 
          className="flex-1 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl flex flex-col overflow-hidden relative transition-colors duration-500 shadow-2xl"
          style={{ backdropFilter: 'blur(var(--panel-blur))' }}
        >
          <div className="p-4 md:px-6 md:py-3.5 flex justify-between items-center border-b border-[var(--glass-border)]">
            <input 
              type="text" 
              placeholder="搜索..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[280px] py-2 px-3.5 rounded-lg border border-[var(--glass-border)] bg-white/10 text-[var(--text-main)] focus:bg-white/20 focus:border-[var(--accent)] outline-none transition-all placeholder-white/30"
            />
            <button 
              onClick={toggleTheme} 
              className="w-8 h-8 rounded-full bg-[var(--glass-border)] text-[var(--text-main)] flex items-center justify-center hover:bg-[var(--accent)] hover:text-black transition-colors"
              title={`切换主题 (${currentTheme.name})`}
            >
              🎨
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
              {sortedSites.map((site) => (
                <SiteCard 
                  key={site.u} 
                  site={site} 
                  onTagAdd={handleAddTag} 
                  onContextMenu={handleContextMenu}
                  themeName={currentTheme.name}
                />
              ))}
            </div>
          </div>

          <button 
            onClick={() => setShowAddModal(true)}
            className="absolute bottom-8 right-8 w-[50px] h-[50px] rounded-full bg-[var(--accent)] text-black text-3xl flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:scale-110 hover:bg-white transition-all z-50 cursor-pointer"
          >
            +
          </button>
        </main>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center" onClick={() => setShowAddModal(false)}>
          <div className="bg-[#222] p-6 rounded-2xl w-[380px] border border-white/20 text-white" onClick={e => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-bold">添加新网站</h3>
            <input 
              value={newUrl} 
              onChange={e => setNewUrl(e.target.value)} 
              onBlur={autoFillName}
              placeholder="网址 (https://...)" 
              className="w-full p-3 bg-white/10 border border-white/10 rounded-lg mb-3 text-white outline-none"
            />
            <input 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
              placeholder="网站名称" 
              className="w-full p-3 bg-white/10 border border-white/10 rounded-lg mb-3 text-white outline-none"
            />
            <input 
              value={newTags} 
              onChange={e => setNewTags(e.target.value)} 
              placeholder="标签 (逗号分隔)" 
              className="w-full p-3 bg-white/10 border border-white/10 rounded-lg mb-3 text-white outline-none"
            />
            <select 
              value={newCat} 
              onChange={e => setNewCat(e.target.value)}
              className="w-full p-3 bg-[#333] border border-white/10 rounded-lg mb-3 text-white outline-none"
            >
              <option value="custom">-- 默认分类 (Custom) --</option>
              <option value="young">年轻 / 辣妹</option>
              <option value="elegant">轻熟 / 通勤</option>
              <option value="sport">运动 / 潮牌</option>
              <option value="french">法式 / 极简</option>
              <option value="gown">礼服 / 派对</option>
              <option value="denim">牛仔 / 复古</option>
              <option value="linen">棉麻 / 文青</option>
              <option value="curve">大码 / 曲线</option>
              <option value="fast">全球快时尚</option>
              <option value="euro">欧洲 / 小众</option>
              <option value="shein">SHEIN</option>
            </select>
            <button onClick={submitNewSite} className="w-full p-3 bg-[var(--accent)] text-black font-bold rounded-lg mb-2">保存</button>
            <button onClick={() => setShowAddModal(false)} className="w-full p-3 bg-white/10 text-white font-bold rounded-lg">取消</button>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.visible && (
        <div 
          className="fixed bg-[#222] border border-[#444] rounded-lg p-1.5 z-[100] shadow-xl w-[140px]"
          style={{ top: contextMenu.y, left: Math.min(contextMenu.x, window.innerWidth - 150) }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-center gap-1 p-1">
            {[1, 2, 3, 4, 5].map(num => {
               const site = sites.find(s => s.u === contextMenu.siteUrl);
               const currentRating = site?.rating || 0;
               return (
                 <span 
                   key={num} 
                   onClick={() => handleRate(num)}
                   className={`text-lg cursor-pointer hover:text-[#ffd700] ${num <= currentRating ? 'text-[#ffd700]' : 'text-[#555]'}`}
                 >
                   ★
                 </span>
               )
            })}
          </div>
          <div className="h-px bg-[#444] my-1"></div>
          
          {isAdmin && (
            <div onClick={handlePin} className="p-2 text-sm text-[#ddd] cursor-pointer hover:bg-[#333] hover:text-white rounded flex items-center justify-between">
              <span>{isPinned ? '📍 取消置顶' : '📍 置顶'}</span>
            </div>
          )}

          <div onClick={handleRename} className="p-2 text-sm text-[#ddd] cursor-pointer hover:bg-[#333] hover:text-white rounded">
            ✏️ 重命名
          </div>
          {isAdmin && (
            <>
              <div onClick={handleManageTags} className="p-2 text-sm text-[#ddd] cursor-pointer hover:bg-[#333] hover:text-white rounded">
                🏷️ 管理标签
              </div>
              <div onClick={handleDelete} className="p-2 text-sm text-[#ff453a] cursor-pointer hover:bg-[#333] hover:text-white rounded">
                🗑 删除网站
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default App;