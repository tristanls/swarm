var assert = require( 'assert' ),
    exec = require( 'child_process' ).exec,
    vows = require( 'vows' );

vows.describe( '--self-test option' ).addBatch( {
  'swarm executable': {
    topic: function() {
      exec( 'which swarm', this.callback );
    },
    'should be installed in /opt/node/bin/swarm': function( error, stdout, stderr ) {
      assert.equal( stdout, '/opt/node/bin/swarm\n' );
      assert.equal( stderr, '' );
    }
  }
}).export( module );