import React, { useEffect, useRef, useState } from 'react';
import { Film, Lock } from 'lucide-react';
import type { BollywoodFilm, DifficultyConfig, TileItem } from '../types/game';

interface PosterBoardProps {
  film: BollywoodFilm;
  difficulty: DifficultyConfig;
  tiles: TileItem[];
  isSolved: boolean;
  isInteractive: boolean;
  isPeeking: boolean;
  recentlyLocked: number[];
  hintHighlight: [number, number] | null;
  comboBanner: { count: number; id: number } | null;
  onSwap: (fromIndex: number, toIndex: number) => void;
  onPickup: () => void;
}

interface DragState {
  sourceIndex: number;
  pieceId: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  tileWidth: number;
  tileHeight: number;
  isDragging: boolean;
  hoverIndex: number | null;
}

export const PosterBoard: React.FC<PosterBoardProps> = ({
  film,
  difficulty,
  tiles,
  isSolved,
  isInteractive,
  isPeeking,
  recentlyLocked,
  hintHighlight,
  comboBanner,
  onSwap,
  onPickup,
}) => {
  const { cols, rows } = difficulty;
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [imgFailed, setImgFailed] = useState<boolean>(false);

  // Reset local selection when film or board dimensions change
  useEffect(() => {
    setSelectedIndex(null);
    setDrag(null);
    setImgFailed(false);
  }, [film.id, cols, rows]);

  // Clear selection if selected slot becomes locked
  useEffect(() => {
    if (selectedIndex !== null && tiles[selectedIndex]?.locked) {
      setSelectedIndex(null);
    }
  }, [tiles, selectedIndex]);

  // Helper: map client (x, y) to tile slot index inside board
  const getSlotAtPoint = (clientX: number, clientY: number): number | null => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return null;
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return null;
    }
    const relX = (clientX - rect.left) / rect.width;
    const relY = (clientY - rect.top) / rect.height;
    const col = Math.min(cols - 1, Math.max(0, Math.floor(relX * cols)));
    const row = Math.min(rows - 1, Math.max(0, Math.floor(relY * rows)));
    return row * cols + col;
  };

  // Global pointer tracking during active pointer gesture
  useEffect(() => {
    if (!drag) return;

    const handlePointerMove = (e: PointerEvent) => {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      const movedEnough = drag.isDragging || Math.hypot(dx, dy) > 7;
      const hoverSlot = movedEnough ? getSlotAtPoint(e.clientX, e.clientY) : null;
      const validHover =
        hoverSlot !== null &&
        hoverSlot !== drag.sourceIndex &&
        !tiles[hoverSlot]?.locked
          ? hoverSlot
          : null;

      setDrag((prev) =>
        prev
          ? {
              ...prev,
              currentX: e.clientX,
              currentY: e.clientY,
              isDragging: movedEnough,
              hoverIndex: validHover,
            }
          : null
      );
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (drag.isDragging) {
        const dropSlot = getSlotAtPoint(e.clientX, e.clientY);
        if (
          dropSlot !== null &&
          dropSlot !== drag.sourceIndex &&
          !tiles[dropSlot]?.locked
        ) {
          setSelectedIndex(null);
          onSwap(drag.sourceIndex, dropSlot);
        }
      } else {
        // Treat as click / tap-to-swap
        const clicked = drag.sourceIndex;
        if (selectedIndex === null) {
          setSelectedIndex(clicked);
          onPickup();
        } else if (selectedIndex === clicked) {
          setSelectedIndex(null);
        } else {
          const from = selectedIndex;
          setSelectedIndex(null);
          onSwap(from, clicked);
        }
      }
      setDrag(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [drag, selectedIndex, tiles, cols, rows, onSwap, onPickup]);

  const handleTilePointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    slotIndex: number
  ) => {
    if (!isInteractive || isSolved) return;
    const tile = tiles[slotIndex];
    if (!tile || tile.locked) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    e.preventDefault();
    const tileRect = e.currentTarget.getBoundingClientRect();
    setFocusedIndex(slotIndex);

    setDrag({
      sourceIndex: slotIndex,
      pieceId: tile.pieceId,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      tileWidth: tileRect.width,
      tileHeight: tileRect.height,
      isDragging: false,
      hoverIndex: null,
    });
  };

  const handleBoardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isInteractive || isSolved) return;
    const total = cols * rows;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(e.key)) {
      e.preventDefault();
    }

    if (e.key === 'ArrowRight') {
      setFocusedIndex((prev) => (prev + 1) % total);
    } else if (e.key === 'ArrowLeft') {
      setFocusedIndex((prev) => (prev - 1 + total) % total);
    } else if (e.key === 'ArrowDown') {
      setFocusedIndex((prev) => (prev + cols) % total);
    } else if (e.key === 'ArrowUp') {
      setFocusedIndex((prev) => (prev - cols + total) % total);
    } else if (e.key === ' ' || e.key === 'Enter') {
      const tile = tiles[focusedIndex];
      if (!tile || tile.locked) return;
      if (selectedIndex === null) {
        setSelectedIndex(focusedIndex);
        onPickup();
      } else if (selectedIndex === focusedIndex) {
        setSelectedIndex(null);
      } else {
        const from = selectedIndex;
        setSelectedIndex(null);
        onSwap(from, focusedIndex);
      }
    }
  };

  const getTileBackgroundStyle = (pieceId: number): React.CSSProperties => {
    const origCol = pieceId % cols;
    const origRow = Math.floor(pieceId / cols);
    const posX = cols > 1 ? (origCol / (cols - 1)) * 100 : 0;
    const posY = rows > 1 ? (origRow / (rows - 1)) * 100 : 0;

    if (imgFailed) {
      return {
        backgroundImage: film.fallbackGradient,
      };
    }

    return {
      backgroundImage: `url("${film.posterUrl}")`,
      backgroundSize: `${cols * 100}% ${rows * 100}%`,
      backgroundPosition: `${posX}% ${posY}%`,
      backgroundRepeat: 'no-repeat',
    };
  };

  return (
    <div className="relative flex items-center justify-center select-none">
      {/* Hidden image probe to handle fallback cleanly and pre-warm browser cache */}
      <img
        src={film.posterUrl}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className="sr-only"
      />

      {/* Matte dark easel frame around poster */}
      <div
        className={`relative p-2.5 sm:p-3.5 rounded-[16px] bg-[#1B1B1B] border-2 transition-colors duration-300 ${
          isSolved
            ? 'border-[#F96922] shadow-[0_24px_64px_rgba(0,0,0,0.72),0_0_40px_rgba(249,105,34,0.2)]'
            : 'border-[#2D2D2D] shadow-[0_24px_60px_rgba(0,0,0,0.65)]'
        }`}
      >
        {/* Subtle registration corner ticks */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-[#F96922]/75 rounded-tl-xs"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-[#F96922]/75 rounded-tr-xs"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-[#F96922]/75 rounded-bl-xs"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-[#F96922]/75 rounded-br-xs"
        />

        {/* Floating Combo Toast (compositor-only animation, never shifts layout) */}
        {comboBanner && comboBanner.count >= 2 && (
          <div
            key={comboBanner.id}
            className="pointer-events-none absolute top-5 left-1/2 z-30 animate-combo-pop px-3.5 py-1 rounded-[8px] bg-[#111111]/95 border border-[#B748FE] text-[#DDA7FF] text-xs font-bold tracking-wide whitespace-nowrap shadow-lg"
          >
            Splice Combo ×{comboBanner.count}
          </div>
        )}

        {/* Main Poster Grid — adapts to portrait (3:4) or square (1:1) poster dimensions */}
        <div
          ref={boardRef}
          tabIndex={isInteractive && !isSolved ? 0 : -1}
          onKeyDown={handleBoardKeyDown}
          role="grid"
          aria-label="Bollywood movie poster puzzle board"
          className={`relative overflow-hidden rounded-[10px] bg-[#111111] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F96922] ${
            film.aspectRatio === 'square'
              ? 'aspect-square w-[min(88vw,420px)] sm:w-[min(60vh,460px)] lg:w-[min(66vh,500px)]'
              : 'aspect-[3/4] w-[min(86vw,390px)] sm:w-[min(56vh,430px)] lg:w-[min(64vh,460px)]'
          }`}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            touchAction: 'none',
          }}
        >
          {tiles.map((tile, slotIndex) => {
            const isSelected = selectedIndex === slotIndex;
            const isDragSource = drag?.isDragging && drag.sourceIndex === slotIndex;
            const isDropTarget = drag?.isDragging && drag.hoverIndex === slotIndex;
            const isJustLocked = recentlyLocked.includes(slotIndex);
            const isHinted =
              hintHighlight !== null &&
              (hintHighlight[0] === slotIndex || hintHighlight[1] === slotIndex);
            const isKbFocused =
              isInteractive && !isSolved && focusedIndex === slotIndex;

            // Seam fusion: hide hairline cut borders between two adjacent locked tiles
            const col = slotIndex % cols;
            const row = Math.floor(slotIndex / cols);
            const rightNeighborLocked =
              col < cols - 1 ? tiles[slotIndex + 1]?.locked : true;
            const bottomNeighborLocked =
              row < rows - 1 ? tiles[slotIndex + cols]?.locked : true;

            const showRightCut = !isSolved && !(tile.locked && rightNeighborLocked) && col < cols - 1;
            const showBottomCut = !isSolved && !(tile.locked && bottomNeighborLocked) && row < rows - 1;

            return (
              <button
                key={slotIndex}
                type="button"
                role="gridcell"
                aria-label={`Slot ${slotIndex + 1}${tile.locked ? ', locked in place' : ''}${
                  isSelected ? ', selected' : ''
                }`}
                disabled={tile.locked || !isInteractive || isSolved}
                onPointerDown={(e) => handleTilePointerDown(e, slotIndex)}
                className={`relative w-full h-full overflow-hidden transition-transform duration-150 ease-out focus:outline-none ${
                  tile.locked || isSolved
                    ? 'cursor-default'
                    : 'cursor-grab active:cursor-grabbing'
                } ${isDragSource ? 'opacity-25 scale-[0.96]' : 'opacity-100'} ${
                  isSelected ? 'z-20 scale-[0.95]' : ''
                }`}
                style={{
                  ...getTileBackgroundStyle(tile.pieceId),
                  boxShadow: [
                    showRightCut ? 'inset -1px 0 0 rgba(17, 17, 17, 0.9)' : '',
                    showBottomCut ? 'inset 0 -1px 0 rgba(17, 17, 17, 0.9)' : '',
                  ]
                    .filter(Boolean)
                    .join(', '),
                }}
              >
                {/* Fallback tile number marker only if image failed to load */}
                {imgFailed && (
                  <span className="absolute inset-0 flex flex-col items-center justify-center text-[#F0F0F0]/80 text-xs font-mono">
                    <Film className="w-4 h-4 mb-1 opacity-60" />
                    <span>#{tile.pieceId + 1}</span>
                  </span>
                )}

                {/* Unlocked subtle inner edge highlight so movable pieces feel tactile */}
                {!tile.locked && !isSolved && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 border border-[#F0F0F0]/12"
                  />
                )}

                {/* Selected highlight frame */}
                {isSelected && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-[#F96922] bg-[#F96922]/15"
                  />
                )}

                {/* Drop target highlight frame */}
                {isDropTarget && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-[#F96922] bg-[#F96922]/22"
                  />
                )}

                {/* Hint pair highlight */}
                {isHinted && !tile.locked && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-[#159BE0] bg-[#159BE0]/20"
                  />
                )}

                {/* Keyboard focus outline */}
                {isKbFocused && !isSelected && !tile.locked && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0.5 ring-1 ring-inset ring-[#F0F0F0]/65"
                  />
                )}

                {/* Brief orange flash when piece snaps into place */}
                {isJustLocked && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[#F96922]/45 ring-2 ring-inset ring-[#F96922] animate-lock-flash"
                  />
                )}

                {/* Quiet corner lock icon while puzzle is still in progress */}
                {tile.locked && !isSolved && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1.5 right-1.5 w-4 h-4 rounded-sm bg-[#111111]/75 flex items-center justify-center text-[#F96922]"
                  >
                    <Lock className="w-2.5 h-2.5" />
                  </span>
                )}
              </button>
            );
          })}

          {/* Blueprint Peek Reference Overlay (1.5s hint) */}
          {isPeeking && !isSolved && !imgFailed && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-200"
              style={{
                backgroundImage: `url("${film.posterUrl}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.78,
                filter: 'saturate(0.75) contrast(1.05)',
              }}
            >
              <div className="absolute inset-x-0 bottom-3 flex justify-center">
                <span className="px-3 py-1 rounded-[7px] bg-[#111111]/90 border border-[#159BE0]/60 text-[#92D9FE] text-xs font-semibold tracking-wide">
                  Reference Peek
                </span>
              </div>
            </div>
          )}

          {/* Full Poster Spotlight Sheen upon completing reconstruction */}
          {isSolved && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
            >
              <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-[#F0F0F0]/40 to-transparent animate-poster-sheen" />
            </div>
          )}
        </div>
      </div>

      {/* Floating GPU-transformed tile preview while dragging */}
      {drag && drag.isDragging && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed top-0 left-0 z-50 rounded-md overflow-hidden ring-2 ring-[#F96922] shadow-[0_18px_40px_rgba(0,0,0,0.78)]"
          style={{
            width: `${drag.tileWidth}px`,
            height: `${drag.tileHeight}px`,
            transform: `translate3d(${drag.currentX - drag.tileWidth / 2}px, ${
              drag.currentY - drag.tileHeight / 2
            }px, 0) scale(1.05)`,
            ...getTileBackgroundStyle(drag.pieceId),
          }}
        />
      )}
    </div>
  );
};
