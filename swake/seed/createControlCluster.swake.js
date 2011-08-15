// creates a swarm control cluster

exports = function( cloudprovider, username, apiKey ) {
  
  // check for defaults that weren't changed
  if ( username == 'your-username' || apiKey == 'your-api-key' ) {
    console.error( 'Please configure your-username and your-api-key' );
    process.exit( 1 );
  }
  
  switch ( cloudprovider ) {
    case 'rackspace' :
      var cloudservers = require( 'cloudservers' );
      var config = {
        auth : {
          username: username,
          apiKey: apiKey
        } // auth
      }; // config
      var client = cloudservers.createClient( config );
      
      var namePrefix = 'swarm-control-';
      for ( var i = 0; i < 3; i++ ) { // 3 is the default cluster size
        var options = {
          name: namePrefix + i + new Date().getTime(),
          image: 69, // Ubuntu 10.10 on rackspace
          flavor: 1, // '256 server' on rackspace
        }; // options
        
        client.createServer( options, function( err, server ) {
          console.log( 'creating ' + server.name + '...' );
          server.setWait( { status: 'ACTIVE' }, 5000, function() {
            console.log( server.name + ' is now active' );
          });
        }); // client.createServer
      } // for 3 servers
  } // switch( cloudprovider )
  
}; // exports