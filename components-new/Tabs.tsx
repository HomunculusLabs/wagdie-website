'use client'

import React, { useState, useCallback, useRef, useMemo } from 'react';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  content?: React.ReactNode;
  icon?: React.ReactComponentElement<React.ComponentType<{ size?: number }>>;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  defaultActiveId?: string;
  activeId?: string;
  onChange?: (id: string) => void;
  className?: string;
  /** Unique ID for accessibility */
  id?: string;
  /** Orientation affects arrow key behavior */
  orientation?: 'horizontal' | 'vertical';
}

let tabsIdCounter = 0;

export const Tabs = React.memo<TabsProps>(({
  items,
  defaultActiveId,
  activeId: controlledActiveId,
  onChange,
  className = '',
  id,
  orientation = 'horizontal'
}) => {
  const [internalActiveId, setInternalActiveId] = useState(defaultActiveId || items[0]?.id);
  const tabsId = useRef(id || `tabs-${++tabsIdCounter}`);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const activeId = controlledActiveId !== undefined ? controlledActiveId : internalActiveId;

  const enabledItems = useMemo(() =>
    items.filter(item => !item.disabled),
    [items]
  );

  const handleTabClick = useCallback((itemId: string) => {
    if (onChange) {
      onChange(itemId);
    } else {
      setInternalActiveId(itemId);
    }
  }, [onChange]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent, currentId: string) => {
    const currentIndex = enabledItems.findIndex(item => item.id === currentId);
    let nextIndex: number | null = null;

    const isHorizontal = orientation === 'horizontal';

    switch (event.key) {
      case isHorizontal ? 'ArrowRight' : 'ArrowDown':
        event.preventDefault();
        nextIndex = currentIndex < enabledItems.length - 1 ? currentIndex + 1 : 0;
        break;
      case isHorizontal ? 'ArrowLeft' : 'ArrowUp':
        event.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : enabledItems.length - 1;
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = enabledItems.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleTabClick(currentId);
        return;
    }

    if (nextIndex !== null) {
      const nextItem = enabledItems[nextIndex];
      const nextTab = tabRefs.current.get(nextItem.id);
      nextTab?.focus();
      handleTabClick(nextItem.id);
    }
  }, [enabledItems, orientation, handleTabClick]);

  const setTabRef = useCallback((id: string, element: HTMLButtonElement | null) => {
    if (element) {
      tabRefs.current.set(id, element);
    } else {
      tabRefs.current.delete(id);
    }
  }, []);

  const activeItem = items.find(item => item.id === activeId);

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Navigation */}
      <div
        role="tablist"
        aria-orientation={orientation}
        className={`flex flex-wrap justify-center gap-2 md:gap-4 border-b border-neutral-800 pb-1 mb-8 ${
          orientation === 'vertical' ? 'flex-col items-start border-b-0 border-r' : ''
        }`}
      >
        {items.map((item) => {
          const isActive = activeId === item.id;
          const isDisabled = item.disabled;

          return (
            <button
              key={item.id}
              ref={(el) => setTabRef(item.id, el)}
              role="tab"
              id={`${tabsId.current}-tab-${item.id}`}
              aria-selected={isActive}
              aria-controls={`${tabsId.current}-panel-${item.id}`}
              aria-disabled={isDisabled}
              tabIndex={isActive ? 0 : -1}
              disabled={isDisabled}
              onClick={() => !isDisabled && handleTabClick(item.id)}
              onKeyDown={(e) => !isDisabled && handleKeyDown(e, item.id)}
              className={`
                flex items-center gap-2 px-4 md:px-6 py-3
                font-display  text-lg
                transition-all duration-300 border-b-2
                group relative overflow-hidden
                focus:outline-none focus-visible:ring-2 focus-visible:ring-soul-accent/50
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${isActive
                  ? 'border-soul-accent text-soul-accent drop-shadow-[0_0_8px_rgba(200,170,110,0.4)]'
                  : 'border-transparent text-neutral-600 hover:text-neutral-400 hover:border-neutral-800'
                }
              `}
            >
              {/* Hover Glow Background */}
              <div
                aria-hidden="true"
                className={`absolute inset-0 bg-soul-accent/5 translate-y-full transition-transform duration-300 ${isActive ? 'translate-y-0' : 'group-hover:translate-y-0'}`}
              />

              <span className="relative z-10 flex items-center gap-2">
                {item.icon && React.cloneElement(item.icon, { size: 16 })}
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="relative">
        {items.map((item) => {
          const isActive = item.id === activeId;

          if (!item.content) return null;

          return (
            <div
              key={item.id}
              role="tabpanel"
              id={`${tabsId.current}-panel-${item.id}`}
              aria-labelledby={`${tabsId.current}-tab-${item.id}`}
              hidden={!isActive}
              tabIndex={0}
              className={`w-full ${isActive ? 'animate-fade-in' : ''}`}
            >
              {isActive && item.content}
            </div>
          );
        })}
      </div>
    </div>
  );
});

Tabs.displayName = 'Tabs';
