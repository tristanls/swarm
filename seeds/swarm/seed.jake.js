namespace( 'seed', function() {
  
  desc( 'Creates a control cluster from the rackspace provider.' );
  task( 'create_control_cluster', function( username, apiKey, clusterSize ) {
    // check for defaults that weren't changed
    if ( username == 'your-username' || apiKey == 'your-api-key' ) {
      process.stderr.write( 'Please configure rackspace username and apiKey\n' );
      process.exit( 0 );
    }
    
    var cloudservers = require( 'cloudservers' );
    var config = {
      auth : {
        username: username,
        apiKey: apiKey
      }
    };
    var client = cloudservers.createClient( config );
    
    var namePrefix = 'swarm-control-';
    for ( var i = 0; i < clusterSize; i++ ) {
      var options = {
        name: namePrefix + i,
        image: 69, // Ubuntu 10.10 on rackspace
        flavor: 1, // '256 server' on rackspace
      };
      client.createServer( options, function ( err, server ) {
        console.log( 'creating ' + server.name + '...' );
        server.setWait( { status: 'ACTIVE' }, 5000, function() {
          console.log( server.name + ' is now active' );
        });
      });
    }
    console.log( 'waiting for servers to become active...' );
  });
  
});
    
