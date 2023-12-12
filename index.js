const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const SECRET = "ROOTZ491";

const sessions = {};

io
	//* Middleware
	.use((socket, next) => {
		if (socket.handshake.query && socket.handshake.query.token) {
			// ? check if the token is valid (e.g. user is authenticated, valid JWT, etc.)
			if (socket.handshake.query.token === SECRET) {
				// Save session data
				sessions[socket.id] = {
					/* session data OR JWT info */
					createdAt: new Date(),
				};
				return next();
			} else {
				next(new Error("Authentication error: Invalid token"));
			}
		} else {
			next(new Error("Authentication error"));
		}
	})

	//* Connection
	.on("connection", (socket) => {
		console.log("New client connected");

		// Send a message to a particular client
		io.to(socket.id).emit(
			"notification",
			"This is a real-time notification to a particular client!"
		);

		// Fun event
		socket.on("bark", (data) => {
			io.to(data.id).emit("notification", "Someone is barking at you!");
		});

		socket.on("disconnect", () => {
			console.log("Client disconnected");

			//! Remove session data when a client disconnects
			delete sessions[socket.id];
		});
	});

//* Routes

/**
 *? Get all connected clients's IDs
 */
app.get("/sessions", (req, res) => {
	res.send(sessions);
});

/**
 *? The message received from the query parameter will be sent to all connected clients
 * @type {string}
 */
app.get("/sessions/all", (req, res) => {
	const msg = req.query.msg;
	io.emit("notification", msg);
	res.send("Message sent to all connected clients");
});

/**
 *? The message received from the query parameter will be sent to the client with the specified ID
 * @type {string}
 */
app.get("/sessions/:id", (req, res) => {
	const msg = req.query.msg;
	const id = req.params.id;
	io.to(id).emit("notification", msg);
	res.send(`Message sent to client with ID ${id}`);
});

server.listen(4001, () => console.log(`Listening on port 4001`));
