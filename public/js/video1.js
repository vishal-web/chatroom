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

// Offer made
socket.on('offer-made', (data) => {
	pc.setRemoteDescription(new sessionDescription(data.offer), function () {
		pc.createAnswer(function (answer) {
			pc.setLocalDescription(new sessionDescription(answer), function () {
        		console.log("make-answer", data.to);
				socket.emit('make-answer', {
					answer: answer,
					to: data.to
				});
			}, error);
		}, error);
	}, error);
});


var answersFrom = {}, offer;

socket.on('answer-made', function (data) {
	console.log('Hellloo');
	pc.setRemoteDescription(new sessionDescription(data.answer), function () {
		document.getElementById(data.socket).setAttribute('class', 'active');
		console.log('Answer Made', data);

		if (!answersFrom[data.socket]) {
			createOffer(data.socket);
			answersFrom[data.socket] = true;
		}
	}, error);
});



// Add users to DOM
function outputUsers(users) {

	for (var i = 0; i < users.length; i++) {
		var el = document.createElement('li'),
		user = users[i];

		el.setAttribute('id', user.id);
		el.innerHTML = user.username;
		el.addEventListener('click', function () {
			// TODO: We will create this method
			createOffer(user.id);
		});
		userList.appendChild(el);
	}

	// userList.innerHTML = `
	//     ${users.map(user => `<li>${user.username}</li>`).join('')}
	// `;
}

// Add room name to DOM
function outputRoomName(room) {
	roomName.innerHTML = room
}


var peerConnection = window.RTCPeerConnection ||
	window.mozRTCPeerConnection ||
	window.webkitRTCPeerConnection ||
	window.msRTCPeerConnection;

var sessionDescription = window.RTCSessionDescription ||
	window.mozRTCSessionDescription ||
	window.webkitRTCSessionDescription ||
	window.msRTCSessionDescription;

	navigator.getUserMedia  = navigator.getUserMedia ||
	navigator.webkitGetUserMedia ||
	navigator.mozGetUserMedia ||
	navigator.msGetUserMedia;


var pc = new peerConnection({
	iceServers: [{
		url: "stun:stun.services.mozilla.com",
		username: "vishal",
		credential: "123456789"
	}]
});


pc.onaddstream = function (obj) {
	var vid = document.createElement('video');
	vid.setAttribute('class', 'videoChat');
	vid.setAttribute('autoplay', 'autoplay');
	vid.setAttribute('id', 'videoChat');
	document.querySelector('.chat-messages').appendChild(vid);
	vid.srcObject = obj.stream;
	vid.onloadedmetadata = function(e) {
		vid.play();
	};
}

navigator.getUserMedia(
	{video: { width: 300, height: 220 }, audio: true}, 
	function (stream) {
		const localVideo = document.getElementById('local-video');
		if (localVideo) {
			localVideo.srcObject = stream;
		}
		var video = document.querySelector('video');
		pc.addStream(stream);
		video.onloadedmetadata = function(e) {
			video.play();
		};
	},
	function(err) {
        console.log("The following error occurred: " + err.name);
    } 
);


function createOffer(id) {
	pc.createOffer(function (offer) {
		pc.setLocalDescription(new sessionDescription(offer), function () {
			console.log({
				offer: offer,
				to: id
			});

			socket.emit('make-offer', {
				offer: offer,
				to: id
			});
		}, error);
	}, error);
}

function error(err) {
	console.warn('Error', err);
}