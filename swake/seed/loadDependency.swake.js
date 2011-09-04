// loads an npm dependency

var spawn = require( 'child_process' ).spawn;

exports = function( dependency, version ) {
  
  // check if the dependency is already installed
  try {
    
    require( dependency );
    
    // dependency is already available
    process.exit( 0 );
    
  } catch ( notInstalled ) {
  
    var installer = spawn( 'sudo',
      [ 'env', 'PATH=' + process.env.PATH, '/opt/node/bin/npm', '-g', 'install',
        dependency + '@' + version ] );
    
    installer.on( 'exit', function( code ) {
      
      // verify that dependency was installed correctly
      try {
        
        require( dependency );
        
        process.exit( 0 );
        
      } catch ( error ) {
        
        // installation failed
        // TODO: some sort of notification
        process.exit( 1 );
        
      } // catch error
      
    }); // installer.on( 'exit' )
  
  } // catch ( notInstalled )
  
}; // exports