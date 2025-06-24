let ioInstance = null;

function setIo(io) {
  ioInstance = io;
  console.log('Socket.IO инициализировано в модуле socket.js');
}

function getIo() {
  if (!ioInstance) {
    console.error('Ошибка: Socket.IO не инициализировано');
  }
  return ioInstance;
}

module.exports = { setIo, getIo };