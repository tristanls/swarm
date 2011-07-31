exports.version = "0.0.1-pre";

var path = require( 'path' ), 
    spawn = require( 'child_process' ).spawn;

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
      'vows',
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
  while ( arg = argv.shift() ) {
    if ( arg === executableName ) continue;
    
    if ( arg[ 0 ] !== '-' ) {
      
      switch ( arg ) {
        case 'help':
          var command = argv.shift();
          console.log( commandHelp[ command ] );
          process.exit( 0 );
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
          console.log( [ executableName, swarm.version ].join( ' ' ) );
          process.exit( 0 );
          break;
      } // switch ( arg )
    } // else 
  } // while ( arg = argv.shift() )
}; // exports.swarm()