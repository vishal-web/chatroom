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


var answersFrom = {}, offer;


// Add users to DOM
function outputUsers(users) {

	users.forEach(function(user) {
		const alreadyExistingUser = document.getElementById(user.id);
		if (!alreadyExistingUser) {
			const userContainerEl = createUserItemContainer(user);
			userList.appendChild(userContainerEl);
		}
	});
}


function createUserItemContainer(user) {
	const userContainerEl = document.createElement("li");

	const usernameEl = document.createElement("p");

	userContainerEl.setAttribute("class", "active-user");
	userContainerEl.setAttribute("id", user.id);
	usernameEl.setAttribute("class", "username");
	usernameEl.innerHTML = `${user.username}`;

	userContainerEl.appendChild(usernameEl);

	userContainerEl.addEventListener("click", () => {
		// unselectUsersFromList();
		userContainerEl.setAttribute("class", "active-user active-user--selected");
		// const talkingWithInfo = document.getElementById("talking-with-info");
		// talkingWithInfo.innerHTML = `Talking with: "Socket: ${user.id}"`;
		callUser(user.id);
	}); 

	return userContainerEl;
}

// Add room name to DOM
function outputRoomName(room) {
	roomName.innerHTML = room
}


const { RTCPeerConnection, RTCSessionDescription } = window;

const peerConnection = new RTCPeerConnection();

navigator.getUserMedia(
	{video: { width: 300, height: 220 }, audio: true}, 
	function (stream) {
		const localVideo = document.getElementById('local-video');
		if (localVideo) {
			localVideo.srcObject = stream;
		}

		stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
	},
	function(err) {
        console.log("The following error occurred: " + err.name);
    } 
);


peerConnection.ontrack = function({ streams: [stream] }) {
 	const remoteVideo = document.getElementById("remote-video");
 	if (remoteVideo) {
   		remoteVideo.srcObject = stream;
 	}
};

async function callUser(socketId) {
	const offer = await peerConnection.createOffer();
	await peerConnection.setLocalDescription(new RTCSessionDescription(offer));
	socket.emit("call-user", {
		offer,
		to: socketId
	});
}


socket.on("call-made", async (data) => {
	await peerConnection.setRemoteDescription(
	   new RTCSessionDescription(data.offer)
	);
	
	const answer = await peerConnection.createAnswer();
	await peerConnection.setLocalDescription(new RTCSessionDescription(answer));
	 
	socket.emit("make-answer", {
	   answer,
	   to: data.socket
	});
});

var isAlreadyCalling;
socket.on("answer-made", async data => {
 	await peerConnection.setRemoteDescription(
   		new RTCSessionDescription(data.answer)
 	);
 
 	if (!isAlreadyCalling) {
   		callUser(data.socket);
   		isAlreadyCalling = true;
 	}
});