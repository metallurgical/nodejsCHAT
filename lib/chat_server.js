var 
	socketio    = require('socket.io'),
	io,
	guestNumber = 1,
	nickNames   = {},
	namesUsed   = [],
	currentRoom = {};

exports.listen = function ( server ) {

	io = socketio.listen( server ); // Start Socket.IO server, allowing it to piggyback on existing HTTP server
	io.set( 'Log level', 1 );

	io.sockets.on( 'connection', function ( socket )  { // Define how each user connection will be handled

		guestNumber = assignGuestName( socket, guestNumber, nickNames, namesUsed ); // Assign user a guest name 																				  // when they connect
		joinRoom( socket, 'Lobby' ); // Place user in Lobby room when they connect

		handleMessageBroadcasting( socket, nickNames ); // Handle user messages, namechange attempts, and room 														// creation/changes
		handleNameChangeAttempts( socket, nickNames, namesUsed );
		handleRoomJoining( socket );

		socket.on( 'rooms', function () { // Provide user with list of occupied rooms on request

			socket.emit( 'rooms', io.socket.manager.rooms );
		});

		handleClientDisconnection( socket, nickNames, namesUsed ); // Define cleanup logic for when user disconnects
	});
}

function assignGuestName( socket, guestNumber, nickNames, namesUsed ) {

	var name = 'Guest' + guestNumber; // Generate new guest name

	nickNames[socket.id] = name;  // Associate guest name with client connection ID

	socket.emit( 'nameResult', { // Let user know their guest name
		success : true,
		name : name
	});

	namesUsed.push( name ); // Note that guest name is now used
	return guestNumber + 1;
}

function joinRoom( socket, room ) {

	socket.join( room ); // Make user join room

	currentRoom[socket.id] = room; // Note that user is now in this room

	socket.emit( 'joinResult', { // Let user know they’re now in new room
		room : room
	});

	socket.broadcast.to( room ).emit( 'message', {	// Let other users in room know that user has joined
		text : nickNames[socket.id] + ' has joined ' + room + '.'
	});

	var usersInRoom = io.sockets.clients( room ); // Determine what other users are in same room as user

	if ( usersInRoom.length > 1 ) { // If other users exist, summarize who they are

		var usersInRoomSummary = 'User curently in ' + room + ':';

		for ( var index in usersInRoom ) {

			var userSocketId = usersInRoom[ index ].id;

			if ( userSocketId != socket.id ) {

				if ( index > 0 ) {
					usersInRoomSummary += ', ';
				}

				usersInRoomSummary += nickNames[userSocketId];
			}

			usersInRoomSummary += '.';
			socket.emit('message', {text: usersInRoomSummary}); // Send summary of other users in the room to the user
		}
	}
}

function handleNameChangeAttempts ( socket, nickNames, namesUsed ) {

	socket.on( 'nameAttempt', function ( name ) { // Add listener for nameAttempt events
		// if user type in new name with start with Guest
		if ( name.indexOf( 'Guest' ) == 0 ) { // Don’t allow nicknames to begin with Guest
			// the show him/her error message
			socket.emit( 'nameResult', {
				success : false,
				message : 'Name cannot begin with Guest.!!'
			});
		}
		// if did't not
		else {
			// if really did not existed
			// then proceed
			if ( namesUsed.indexOf( name ) == -1 ) { // If name isn’t already registered, register it
				// get back the original name by its socket id
				var previousName = nickNames[socket.id];
				// and get it index of array
				var previousNameIndex = namesUsed.indexOf( previousName );
				// then store newly created name into container
				namesUsed.push( name );
				// asscoiated new name with socket id
				nickNames[socket.id] = name;
				// delete previous name
				delete namesUsed[previousNameIndex]; // Remove previous name to make available to other clients
				// emit/call the nameResult event to showing user is success
				socket.emit( 'nameResult', {
					success : true,
					name : name
				});
				// send message to all users in a room
				socket.broadcast.to( currentRoom[socket.id]).emit( 'message', {
					text : previousName + 'is now known as ' + name + '.'
				});
			}
			else {
				// showing error instead
				socket.emit( 'nameResult', { // Send error to client if name is already registered
					success : false,
					message : 'That name is already in use'
				});
			}
		}
	})
}

function handleMessageBroadcasting ( socket ) {

	socket.on( 'message', function ( message ) {
		socket.broadcast.to( message.room ).emit( 'message', {
			text : nickNames[socket.id] + ':' + message.text
		});
	});
}

function handleRoomJoining( socket ) {

	socket.on( 'join', function ( room ) {

		socket.leave( currentRoom[socket.id] );
		joinRoom( socket, room.newRoom );
	});
}

function handleClientDisconnection( socket ) {

	socket.on( 'disconnect', function() {

		var nameIndex = namesUsed.indexOf( nickNames[socket.id] );
		delete namesUsed[nameIndex];
		delete nickNames[socket.id];
	})
}