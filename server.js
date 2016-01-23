var
	http  = require( 'http' ),	// http 
	fs    = require( 'fs' ),	// fileSystem
	path  = require( 'path' ),	// fileSystem path
	mime  = require( 'mime' ),	// to derive mimi type base on filename extension
	cache = {};	// cache obj is where the contets of cached files are stored

// sending 404 message if the file
// requested did't found
function send404 ( response ) {

	response.writeHead( 404, { 'Content-Type ' : 'text/plain' } );
	response.write( 'Error 404 : resource not found, sorry mate' );
	response.end();
}

// sent content of the files
function sendFile ( res, filePath, fileContents ) {

	res.writeHead( 200, { 'Content-Type ' : mime.lookup( path.basename( filePath ) ) } );
	res.end( fileContents );
}

function serveStatic( res, cache, absPath ) {
	// if do exist in cache
	if ( cache[absPath] ) {
		// then serve file from memory 
		// instead rather than disk
		sendFile( res, absPath, cache[absPath] );
	}
	// if do not exist in cache
	else {
		// then checking in the disk
		fs.exists( absPath, function ( exists ) {
			// if really exist
			if ( exists ) {
				// then read those file
				fs.readFile( absPath, function ( err, data ) {
					// if anything error happens
					// throws this error message instead
					if ( err )
						send404( res );
					// if succcess
					// then serve file read from disk
					// and cached data
					else {

						cache[absPath] = data;
						sendFile( res, absPath, data );
					}
				});
			}
			// if doesn't exist
			// then throw an errors
			else {

				send404( res );
			}
		});
	}
}

// create http server using anonnymous function
var server = http.createServer( function( req, res ) {
 	console.log( 'I\'m called every time GET or POSt were requested' );
	var filePath = false;
	// default html file to serve
	if ( req.url == '/' ) {
		filePath = 'public/index.html';
	}
	// else showing this instead
	else {
		filePath = 'public' + req.url;
	}

	var absPath = './' + filePath;
	serveStatic( res, cache, absPath );

});

server.listen( 3000, function () {
	console.log( ' Server listening on port 3000 ');
});

var chatServer = require('./lib/chat_server');
chatServer.listen( server );