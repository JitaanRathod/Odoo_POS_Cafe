let _io = null;
const init = (io) => {
  _io = io;
};
const getIO = () => {
  if (!_io) throw new Error('Socket.io not initialized');
  return _io;
};
const emit = (event, data) => {
  try {
    getIO().emit(event, data);
  } catch (err) {
    console.warn(`[Socket] Could not emit "${event}":`, err.message);
  }
};
const emitToRoom = (room, event, data) => {
  try {
    getIO().to(room).emit(event, data);
  } catch (err) {
    console.warn(`[Socket] Could not emit to room "${room}":`, err.message);
  }
};
module.exports = { init, getIO, emit, emitToRoom };
