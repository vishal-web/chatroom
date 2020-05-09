const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');

// Get username & room from the url
const { username, room } = Qs.parse(window.location.search, {
    ignoreQueryPrefix: true
});


const socket = io();


// Joined Chat room
socket.emit('joinRoom', {username, room});

// Get room & user
socket.on('roomUsers', ({room, users}) => {
    outputUsers(users);
    outputRoomName(room);
});

socket.on('message', message => {
    outputMessage(message);

    // Scroll down
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message submit
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get msg text
    const msg = e.target.elements.msg.value;

    // Emit a message to server
    socket.emit('chatMessage', msg);

    // Cleat input
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
});

// Output Message to dom
function outputMessage(message) {
    const div = document.createElement('div');

    div.classList.add('message');
    div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
    <p class="text">
        ${message.text}
    </p>`;

    document.querySelector('.chat-messages').appendChild(div); 
}

// Add users to DOM
function outputUsers(users) {
    console.log(users);
    userList.innerHTML = `
        ${users.map(user => `<li>${user.username}</li>`).join('')}
    `;
}

// Add room name to DOM
function outputRoomName(room) {
    roomName.innerHTML = room
}