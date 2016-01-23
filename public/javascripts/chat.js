var Chat = function ( socket ) {
	this.socket = socket;
};

// send message with name of room
// of user currrently lies
Chat.prototype.sendMessage = function ( room, text ) {

	var message = {
		room : room,
		text : message
	}

	// call server message event
	// and pass message as arguments
	this.socket.emit( 'message', message );

};

// change room
Chat.prototype.changeRoom = function ( room ) {
	// call server join event
	// and pass obj as arguments(new room name)
	this.socket.emit( 'join', {
		newRoom : room
	})
};

// processing chat room
Chat.prototype.processCommand = function ( command ) {

	var words = command.split( ' ' );
	var command = words[0].substring( 1, words[0].length ).toLowerCase();
	var message = false;

	switch( command ) {

		case 'join' :
			words.shift();
			var room = words.join( ' ' );
			this.changeRoom( room ); // Handle room changing/creating
			break;

		case 'nick' :
			words.shift();
			var name = words.join( ' ' );
			this.socket.emit( 'nameAttempt', name ); // Handle name change attempts
			break;

		default : 
			message = 'Unrecognized command!!.'; // Return error message if command isn’t recognized
			break;
	}

	return message;
};