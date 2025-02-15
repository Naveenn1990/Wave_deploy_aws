const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

class SocketService {
  constructor(server) {
    this.io = socketIO(server);
    this.userSockets = new Map(); // userId -> socket
    this.partnerSockets = new Map(); // partnerId -> socket
    this.initialize();
  }

  initialize() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId || decoded.partnerId;
        socket.userType = decoded.userId ? 'user' : 'partner';
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`New ${socket.userType} connected:`, socket.userId);
      
      // Store socket reference
      if (socket.userType === 'user') {
        this.userSockets.set(socket.userId, socket);
      } else {
        this.partnerSockets.set(socket.userId, socket);
      }

      // Handle chat messages
      socket.on('send_message', async (data) => {
        const { recipientId, message } = data;
        const recipientSocket = this.userSockets.get(recipientId) || this.partnerSockets.get(recipientId);
        if (recipientSocket) {
          recipientSocket.emit('new_message', {
            senderId: socket.userId,
            senderType: socket.userType,
            message
          });
        }
        // Store message in database
        await this.storeMessage(socket.userId, recipientId, message);
      });

      // Handle booking notifications
      socket.on('booking_update', (data) => {
        const { recipientId, bookingId, status, message } = data;
        const recipientSocket = this.userSockets.get(recipientId) || this.partnerSockets.get(recipientId);
        if (recipientSocket) {
          recipientSocket.emit('booking_notification', {
            bookingId,
            status,
            message
          });
        }
      });

      // Handle support requests
      socket.on('support_request', async (data) => {
        const { type, details } = data;
        await this.handleSupportRequest(socket.userId, type, details);
      });

      socket.on('disconnect', () => {
        if (socket.userType === 'user') {
          this.userSockets.delete(socket.userId);
        } else {
          this.partnerSockets.delete(socket.userId);
        }
      });
    });
  }

  // Utility methods
  async storeMessage(senderId, recipientId, message) {
    // Implementation for storing messages in database
  }

  async handleSupportRequest(userId, type, details) {
    // Implementation for handling support requests
  }

  // Methods for external use
  notifyBooking(partnerId, bookingData) {
    const partnerSocket = this.partnerSockets.get(partnerId);
    if (partnerSocket) {
      partnerSocket.emit('new_booking', bookingData);
    }
  }

  notifyUser(userId, notification) {
    const userSocket = this.userSockets.get(userId);
    if (userSocket) {
      userSocket.emit('notification', notification);
    }
  }
}

module.exports = SocketService;
