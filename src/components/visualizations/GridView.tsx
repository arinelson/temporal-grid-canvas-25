
import React, { useMemo, useCallback, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getGridDimensions, getDateFromIndex, TimeUnit } from "@/utils/timeCalculations";
import { useIsMobile } from "@/hooks/use-mobile";

interface GridViewProps {
  elapsedUnits: number;
  totalUnits: number;
  timeUnit: TimeUnit;
  birthDate: Date;
  lifeExpectancy: number;
}

export function GridView({ 
  elapsedUnits,
  totalUnits,
  timeUnit,
  birthDate 
}: GridViewProps) {
  const isMobile = useIsMobile();
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const isInitialRender = useRef(true);

  const grid = useMemo(() => {
    return getGridDimensions(totalUnits, timeUnit);
  }, [totalUnits, timeUnit]);

  const currentYear = useMemo(() => {
    return new Date().getFullYear();
  }, []);

  const getCellClass = useCallback((index: number) => {
    // For years, we need to ensure the current year is marked as present
    if (timeUnit === "years") {
      const date = getDateFromIndex(birthDate, index, timeUnit);
      const year = date.getFullYear();
      
      if (year === currentYear) {
        return "canvas-present";
      }
      if (year < currentYear) {
        return "canvas-past";
      }
      return "canvas-future";
    } else {
      // For other time units, use the elapsed units for comparison
      if (index === elapsedUnits) {
        return "canvas-present";
      }
      if (index < elapsedUnits) {
        return "canvas-past";
      }
      return "canvas-future";
    }
  }, [elapsedUnits, birthDate, timeUnit, currentYear]);

  const getCellContent = useCallback((index: number) => {
    if (!birthDate) return null;

    if (timeUnit === "years") {
      const date = getDateFromIndex(birthDate, index, timeUnit);
      return date.getFullYear();
    }
    
    return null;
  }, [birthDate, timeUnit]);

  const getCellTooltip = useCallback((index: number) => {
    if (!birthDate) return "";
    
    const date = getDateFromIndex(birthDate, index, timeUnit);
    return format(date, "PP");
  }, [birthDate, timeUnit]);

  const renderAllCells = useMemo(() => {
    const cells = [];
    
    for (let i = 0; i < totalUnits; i++) {
      const content = getCellContent(i);
      const cellClass = getCellClass(i);
      
      cells.push(
        <div
          key={i}
          className={`canvas-cell ${cellClass}`}
          title={getCellTooltip(i)}
          data-index={i}
        >
          {content}
        </div>
      );
    }
    return cells;
  }, [totalUnits, getCellClass, getCellContent, getCellTooltip]);

  useEffect(() => {
    const scrollToPresent = () => {
      if (!gridContainerRef.current) return;
      
      const presentCell = gridContainerRef.current.querySelector(".canvas-present");
      if (presentCell) {
        const scrollAreaViewport = gridContainerRef.current.closest("[data-radix-scroll-area-viewport]") as HTMLElement;
        
        if (scrollAreaViewport) {
          const cellRect = (presentCell as HTMLElement).getBoundingClientRect();
          const viewportRect = scrollAreaViewport.getBoundingClientRect();
          
          const scrollLeft = (presentCell as HTMLElement).offsetLeft - (viewportRect.width / 2) + (cellRect.width / 2);
          
          scrollAreaViewport.scrollTo({
            left: scrollLeft,
            behavior: isInitialRender.current ? 'auto' : 'smooth'
          });
        }
      }
      isInitialRender.current = false;
    };

    const timer = setTimeout(scrollToPresent, 100);
    return () => clearTimeout(timer);
  }, [elapsedUnits, totalUnits]);

  return (
    <ScrollArea 
      className="border rounded-lg p-4" 
      style={{ height: timeUnit === "years" ? "auto" : "500px" }}
      orientation="both"
      ref={gridContainerRef}
    >
      <div 
        className="canvas-grid"
        style={{ 
          gridTemplateRows: `repeat(${grid.rows}, minmax(20px, 1fr))`,
          gridTemplateColumns: `repeat(${grid.cols}, minmax(20px, 1fr))`,
          width: isMobile ? `${grid.cols * 25}px` : '100%',
          minWidth: '100%',
          minHeight: timeUnit === "years" ? "auto" : "450px"
        }}
      >
        {renderAllCells}
      </div>
    </ScrollArea>
  );
}

export default GridView;
