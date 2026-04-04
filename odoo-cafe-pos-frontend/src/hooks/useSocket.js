import { useEffect } from "react";
import { socket } from "../lib/socket";

/**
 * Subscribe to a socket event and auto-cleanup on unmount.
 *
 * @param {string} event   - Socket event name to listen to
 * @param {Function} handler - Callback invoked when event fires
 * @param {Array} deps     - Extra deps that should re-register the listener
 */
export const useSocketEvent = (event, handler, deps = []) => {
  useEffect(() => {
    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...deps]);
};

/**
 * Join a socket room on mount and leave on unmount.
 *
 * @param {string} room - Room name to join (e.g. "kitchen", "display")
 */
export const useSocketRoom = (room) => {
  useEffect(() => {
    if (!room) return;
    socket.emit("join", room);
    return () => {
      socket.emit("leave", room);
    };
  }, [room]);
};