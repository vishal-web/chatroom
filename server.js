const path = require('path');
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getUserById, userLeave, getRoomUsers } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 4182;

// set static folder
app.use(express.static(path.join(__dirname, 'public')));


const botName = 'ChatCord Bot';

// Run when client is connect
io.on('connection', socket => {
    
    socket.on('joinRoom', ({ username, room }) => {

        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        // Welcome current user
        socket.emit(
            'message', 
            formatMessage(botName, 'Welcome to ChatCord!')
        );
    
        // Broadcast when a user connects, It will be for other users 
        socket.broadcast
            .to(user.room)
            .emit('message', formatMessage(botName, `${user.username} has joined the chat`)
        );

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    // Listen for chatMessage
    socket.on('chatMessage', (message) => {
        const user = getUserById(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, message));
    });

    // Runs on client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        if (user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));
            
            // Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });

    socket.on('make-offer', (data) => {
        io.to(data.to).emit('offer-made', {
            offer: data.offer,
            socket: socket.id
        });
    });

    socket.on('make-answer', function (data) {
        console.log("make-answer", data.to);
        io.to(data.to).emit('answer-made', {
            socket: socket.id,
            answer: data.answer
        });
    });

    socket.on("call-user", data => {
        io.to(data.to).emit("call-made", {
            offer: data.offer,
            socket: socket.id
        });
    });
});

server.listen(PORT, '0.0.0.0', () => console.log(`Server is running on port ${PORT}`));


