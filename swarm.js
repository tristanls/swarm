var fs = require( 'fs' ),
    path = require( 'path' ), 
    spawn = require( 'child_process' ).spawn;

var packageJson = JSON.parse( fs.readFileSync( __dirname + '/package.json' ) );

exports.version = packageJson.version;

exports.initialize = function( seedModule ) {  

  // run swarm self test
  var runner = spawn(
    'swarm',
    [ 'self-test', '--json' ],
    { cwd: __dirname } );
  
  var results = '';
  
  runner.stdout.on( 'data', function( data ) {
    results += data;
  });
  
  runner.stderr.on( 'data', function( data ) {
    results += data;
  });
  
  runner.on( 'exit', function( code ) {    
    // results now contains all output
    results = results.split( '\n' ); // split results back into lines
    results.pop(); // get rid of empty line at the end
    // look backwards ( since finish will probably be the last line ) for success or failure
    for ( var i = results.length - 1; i >= 0; i-- ) {
      var finish = JSON.parse( results[ i ] );
      if ( finish && finish.length > 0 && finish[ 0 ] == 'finish' ) {
        // we found the result line
        // ["finish",{"honored":1,"broken":0,"errored":0,"pending":0,"total":1,"time":0006}]
        var res = finish[ 1 ];
        if ( res.broken == 0 && res.errored == 0 && res.pending == 0 ) {
          // no failures!
          console.log( 'swarm ok' );
        } else {
          // TODO: send the log to control server or some central logging system
          //console.log( results.join( '\n' ) );
          console.log( 'swarm error, aborting...' );
          process.exit( 0 );
        }
        break; // found what we were looking for
      }
      // if we got here, we did not find finish results, fail!
      console.log( 'swarm error, aborting...' );
      process.exit( 0 );
    }
    // made it through tests, continue initialization
    require( seedModule ).seed();
  });
};

exports.selfTest = function( reporter ) {
  if ( ! reporter ) { 
    reporter = '--json'; // set default reporter to --json
  }
  // walk the spec/swarm directory and add all tests/specs from there
  var specs = [],
      finder = require( 'findit' ).find( __dirname + '/spec/swarm' );
  finder.on( 'file', function ( file ) {
    specs.push( file.replace( __dirname, '' ) );
  });
  
  finder.on( 'end', function() {
    var runner = spawn(
      './node_modules/.bin/vows',
      [ reporter ].concat( specs ),
      { cwd: __dirname } );
    
    runner.stdout.on( 'data', function( data ) {
      process.stdout.write( data );
    });
    
    runner.stderr.on( 'data', function( data ) {
      process.stderr.write( data );
    });
    
    runner.on( 'exit', function( code ) {    
      process.exit( code );
    });
  }); // finder.on( 'end' )
}; // exports.selfTest()

exports.swarm = function( executableName, argv ) {
  var usage = [
    "usage:",
    "  " + executableName + " [options]",
    "  " + executableName + " [command] [command-options]",
    "  " + executableName + " help <command>",
  ].join( '\n' );  
  
  var commands = [
    "commands:",
    "  help              Shows help for specific command",
    "  initialize        Initializes the swarm node from configuration and jake files",
    "  self-test         Executes swarm self-test suite after installation",
    "",
  ].join( '\n' );
  
  var help = [
    usage,
    "",
    commands,
    "options:",
    "  -h, --help        Displays this information",
    "  -v, --version     Displays version information",
    ""
  ].join( '\n' ); // help
  
  var commandHelp = {
    'help': [
      "usage: " + executableName + " help <command>",
      "",
      commands
    ].join( '\n' ),
    'initialize': [
      "usage: " + executableName + " initialize SEEDFILE",
      ""
    ].join( '\n' ),
    'self-test': [
      "usage: " + executableName + " self-test [options]",
      "",
      "options:",
      "  --json            Use JSON reporter ( default )",
      "  --spec            Use Spec reporter",
      "  --dot-matrix      Use Dot-Matrix reporter",
      ""
    ].join( '\n' )
  }; // commandHelp
  
  // Retrieve command-line parameters
  var arg, args = [], options = { input: [] };
  
  // Parse command-line parameters
  if ( argv.length == 0 ) {
    console.log( help );
    process.exit( 0 );
  }
  while ( arg = argv.shift() ) {
    if ( arg === executableName ) continue;
    
    if ( arg[ 0 ] !== '-' ) {
      
      switch ( arg ) {
        case 'help':
          var command = argv.shift();
          if ( ! command ) {
            console.log( usage );
            process.exit( 0 );
          }
          console.log( commandHelp[ command ] );
          process.exit( 0 );
          break;
        case 'initialize':
          var seedFile = argv.shift();
          if ( ! seedFile ) {
            console.log( commandHelp[ 'initialize' ] );
            process.exit( 0 );
          }
          exports.initialize( seedFile );
          break;
        case 'self-test':
          exports.selfTest( argv.shift() );
          break;
      }
    } else {
      arg = arg.match( /^--?(.+)/ )[ 1 ];
      
      switch ( arg ) {
        case 'help':
        case 'h':
          console.log( help );
          process.exit( 0 );
          break;
        case 'version':
        case 'v':
          console.log( [ executableName, exports.version ].join( ' ' ) );
          process.exit( 0 );
          break;
      } // switch ( arg )
    } // else 
  } // while ( arg = argv.shift() )
}; // exports.swarm()