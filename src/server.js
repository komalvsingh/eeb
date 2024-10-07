import { createServer } from 'http'; // Importing the createServer function from 'http'
import app from './app.js'; // Importing your Express app
import { Server as SocketIO } from 'socket.io'; // Importing Socket.IO
import logger from './utils/logger.js'; // Importing your logger

const server = createServer(app); // Creating the HTTP server with your Express app
const io = new SocketIO(server); // Creating a new Socket.IO server

let users = []; // Array to store connected users

// Function to add a user to the users array
const addUser = (userId, socketId) => {
  logger.info({ userId }); // Log the userId
  if (!users.some((user) => user.userId === userId)) {
    users.push({ userId, socketId }); // Add the user if they don't already exist
  }
};

// Function to remove a user from the users array
const removeUser = (socketId) => {
  logger.info({ socketId }); // Log the socketId
  users = users.filter((user) => user.socketId !== socketId); // Filter out the user
};

// Function to get a user by userId
const getUser = (userId) => {
  return users.find((user) => user.userId === userId); // Return the user object
};

// Socket.IO connection event
io.on('connection', (socket) => {
  logger.info('A user connected.'); // Log when a user connects

  // Event for adding a user
  socket.on('addUser', (userId) => {
    addUser(userId, socket.id); // Add the user with their socketId
    io.emit('getUsers', users); // Emit the updated user list to all clients
  });

  // Event for sending messages
  socket.on('sendMessage', ({ senderId, receiverId, text }) => {
    const user = getUser(receiverId); // Find the receiver in the users array
    if (user) { // Check if the user exists
      io.to(user.socketId).emit('getMessage', { // Send the message to the receiver
        senderId,
        text,
      });
    }
  });

  // Event for disconnecting a user
  socket.on('disconnect', () => {
    logger.info('A user disconnected!'); // Log when a user disconnects
    removeUser(socket.id); // Remove the user from the users array
    io.emit('getUsers', users); // Emit the updated user list to all clients
  });
});

// Start the server
const PORT = process.env.PORT; // Set the port
server.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`); // Log that the server has started
});

export default server; // Export the server
