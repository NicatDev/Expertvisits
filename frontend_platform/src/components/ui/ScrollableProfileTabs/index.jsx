'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './style.module.scss';

const SCROLL_STEP = 220;
const EDGE_EPS = 2;
/** After a drag-scroll, skip one link click; must be cleared or navigation stays broken forever. */
const SUPPRESS_CLICK_MS = 350;

export default function ScrollableProfileTabs({ tabs, className = '' }) {
  const scrollerRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  const dragRef = useRef({
    active: false,
    startX: 0,
    startScroll: 0,
    moved: false,
    pointerId: null,
  });
  const suppressClickRef = useRef(false);
  const suppressClickTimerRef = useRef(null);

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const max = scrollWidth - clientWidth;
    setAtStart(scrollLeft <= EDGE_EPS);
    setAtEnd(max <= EDGE_EPS || scrollLeft >= max - EDGE_EPS);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateEdges();
    const ro = new ResizeObserver(() => updateEdges());
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateEdges, tabs]);

  useEffect(
    () => () => {
      if (suppressClickTimerRef.current != null) {
        window.clearTimeout(suppressClickTimerRef.current);
      }
    },
    []
  );

  useLayoutEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const activeEl = root.querySelector(`.${styles.tabActive}`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [tabs]);

  const scrollByDir = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * SCROLL_STEP, behavior: 'smooth' });
  };

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const t = e.target;
    // Do not capture pointer or start drag when the user is clicking a tab link — otherwise
    // setPointerCapture on the scroller breaks the click / Next.js <Link> navigation.
    if (t instanceof Element && t.closest('a[href]')) {
      return;
    }
    const el = scrollerRef.current;
    if (!el) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
      pointerId: e.pointerId,
    };
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onPointerMove = (e) => {
    if (!dragRef.current.active) return;
    const el = scrollerRef.current;
    if (!el) return;
    const dx = e.clientX - dragRef.current.startX;
    if (Math.abs(dx) > 6) {
      dragRef.current.moved = true;
    }
    el.scrollLeft = dragRef.current.startScroll - dx;
    updateEdges();
  };

  const endDrag = (e) => {
    const el = scrollerRef.current;
    const { active, moved, pointerId } = dragRef.current;
    if (!active) return;
    dragRef.current.active = false;
    if (el && pointerId != null) {
      try {
        if (el.hasPointerCapture(pointerId)) {
          el.releasePointerCapture(pointerId);
        }
      } catch {
        /* ignore */
      }
    }
    if (moved) {
      if (suppressClickTimerRef.current != null) {
        window.clearTimeout(suppressClickTimerRef.current);
      }
      suppressClickRef.current = true;
      suppressClickTimerRef.current = window.setTimeout(() => {
        suppressClickRef.current = false;
        suppressClickTimerRef.current = null;
      }, SUPPRESS_CLICK_MS);
    }
    dragRef.current.moved = false;
    updateEdges();
  };

  const onTabClick = (e) => {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClickRef.current = false;
      if (suppressClickTimerRef.current != null) {
        window.clearTimeout(suppressClickTimerRef.current);
        suppressClickTimerRef.current = null;
      }
    }
  };

  return (
    <div className={`${styles.root} ${className}`.trim()}>
      <button
        type="button"
        className={`${styles.arrow} ${atStart ? styles.arrowMuted : ''}`}
        aria-label="Scroll tabs left"
        disabled={atStart}
        onClick={() => scrollByDir(-1)}
      >
        <ChevronLeft size={20} strokeWidth={2.2} />
      </button>

      <div
        ref={scrollerRef}
        className={styles.scroller}
        onScroll={updateEdges}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={(e) => {
          if (dragRef.current.active && e.pointerId === dragRef.current.pointerId) {
            endDrag(e);
          }
        }}
      >
        <nav className={styles.track}>
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`${styles.tab} ${tab.active ? styles.tabActive : ''}`}
              onClick={onTabClick}
              draggable={false}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      <button
        type="button"
        className={`${styles.arrow} ${atEnd ? styles.arrowMuted : ''}`}
        aria-label="Scroll tabs right"
        disabled={atEnd}
        onClick={() => scrollByDir(1)}
      >
        <ChevronRight size={20} strokeWidth={2.2} />
      </button>
    </div>
  );
}
