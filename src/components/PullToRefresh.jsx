import React, { useRef, useState, useCallback } from "react";
import { Loader2, ArrowDown } from "lucide-react";

export default function PullToRefresh({ onRefresh, children }) {
  const containerRef = useRef(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const handleTouchStart = useCallback((e) => {
    const scroller = containerRef.current?.parentElement?.closest('.overflow-auto, .overflow-y-auto');
    if (scroller && scroller.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!pulling.current || isRefreshing) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0 && diff < 150) {
      setPullDistance(diff * 0.4);
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullDistance > 50) {
      setIsRefreshing(true);
      setPullDistance(40);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, onRefresh]);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="flex items-center justify-center overflow-hidden"
          style={{ height: pullDistance }}
        >
          {isRefreshing ? (
            <Loader2 className="w-5 h-5 animate-spin text-purple-600 dark:text-purple-400" />
          ) : (
            <ArrowDown
              className={`w-5 h-5 text-purple-600 dark:text-purple-400 transition-transform ${pullDistance > 50 ? 'rotate-180' : ''}`}
            />
          )}
        </div>
      )}
      {children}
    </div>
  );
}