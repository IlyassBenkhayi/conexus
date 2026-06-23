import { useEffect, useRef, useCallback } from 'react';
import { useRoomStore } from '../store/useRoomStore';

interface Position {
  x: number;
  y: number;
}

export const useWASD = (
  initialPosition: Position, 
  onMove: (pos: Position) => void,
  speed: number = 300 // pixels per second
) => {
  // Use refs to track keys currently held down to avoid React state re-render lag
  const keys = useRef<{ [key: string]: boolean }>({});
  const lastTimeRef = useRef<number>(0);
  const requestRef = useRef<number>(0);
  
  // Throttle network emissions
  const lastEmitTimeRef = useRef<number>(0);
  const EMIT_THROTTLE_MS = 50; // 20 times per second

  // Synchronize if parent forcefully changes initial position (like a teleport)
  useEffect(() => {
    useRoomStore.getState().setLocalPosition(initialPosition);
  }, [initialPosition.x, initialPosition.y]);

  const updatePosition = useCallback((time: number) => {
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = time;
    }
    
    const deltaTime = (time - lastTimeRef.current) / 1000; // convert to seconds
    lastTimeRef.current = time;

    const { movementType } = useRoomStore.getState();
    if (movementType === 'drag') {
      requestRef.current = requestAnimationFrame(updatePosition);
      return;
    }

    let dx = 0;
    let dy = 0;

    if (keys.current['w'] || keys.current['W'] || keys.current['ArrowUp']) dy -= 1;
    if (keys.current['s'] || keys.current['S'] || keys.current['ArrowDown']) dy += 1;
    if (keys.current['a'] || keys.current['A'] || keys.current['ArrowLeft']) dx -= 1;
    if (keys.current['d'] || keys.current['D'] || keys.current['ArrowRight']) dx += 1;

    if (dx !== 0 || dy !== 0) {
      // Normalize diagonal movement
      const length = Math.sqrt(dx * dx + dy * dy);
      const normalizedDx = dx / length;
      const normalizedDy = dy / length;

      const currentPos = useRoomStore.getState().localPosition;
      const newPos = {
        x: currentPos.x + normalizedDx * speed * deltaTime,
        y: currentPos.y + normalizedDy * speed * deltaTime,
      };

      useRoomStore.getState().setLocalPosition(newPos);

      // Emit network event if throttle duration has passed
      if (time - lastEmitTimeRef.current > EMIT_THROTTLE_MS) {
        // Round to 1 decimal place to save network bandwidth
        onMove({
          x: Math.round(newPos.x * 10) / 10,
          y: Math.round(newPos.y * 10) / 10
        });
        lastEmitTimeRef.current = time;
      }
    }

    requestRef.current = requestAnimationFrame(updatePosition);
  }, [speed, onMove]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      keys.current[e.key] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key] = false;
      
      // When a key is released, force an exact coordinate emit so the server gets our final stopping point
      if (['w', 'W', 'a', 'A', 's', 'S', 'd', 'D', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const currentPos = useRoomStore.getState().localPosition;
        onMove({
          x: Math.round(currentPos.x * 10) / 10,
          y: Math.round(currentPos.y * 10) / 10
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Start the animation loop
    requestRef.current = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [updatePosition, onMove]);
};
