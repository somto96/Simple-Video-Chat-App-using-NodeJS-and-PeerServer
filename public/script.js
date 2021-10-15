const socket = io("/");
const myPeer = new Peer(undefined, {
	host: "/",
	port: "3001",
});
const peers = {}
myPeer.on("open", (id) => {
	socket.emit("join-room", ROOM_ID, id);
});
const videoGrid = document.getElementById("video-grid");

const myVideo = document.createElement("video");

/**
 *  Muting my own mic so that i don't hear myself talk or Listen to my own video
 *  P.S It doesn't mute my mic for other people.
 */
myVideo.muted = true;

navigator.mediaDevices
	.getUserMedia({
		video: true,
		audio: true,
	})
	.then((stream) => {
		addVideoStream(myVideo, stream);

		myPeer.on("call", (call) => {
			call.answer(stream);
			const video = document.createElement("video");
			call.on("stream", (userVideoStream) => {
				addVideoStream(video, userVideoStream);
			});
		});

		socket.on("user-connected", (userId) => {
			setTimeout(() => {
				// user joined
				connectToNewUser(userId, stream);
			}, 1000);
		});
	});

// This handles client disconnection
socket.on("user-disconnected", (userId) => {
    console.log("User disconnected", userId);
    if(peers[userId]) peers[userId].close();
})

function addVideoStream(video, stream) {
	video.srcObject = stream;

	/**
	 * Once it loads the stream and the video has loaded on our page,
	 * It should play the video
	 */
	video.addEventListener("loadedmetadata", () => {
		video.play();
	});
	videoGrid.append(video);
}

function connectToNewUser(userId, stream) {
	// Calls a user that we've given a certain id to
	const call = myPeer.call(userId, stream);
	const video = document.createElement("video");
	call.on("stream", (userVideoStream) => {
		addVideoStream(video, userVideoStream);
	});

	// Once a call ends, this removes the video in order to prevent random vids laying around
	call.on("close", () => {
		video.remove();
	});

    peers[userId] = call;
}

