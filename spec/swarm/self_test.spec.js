var assert = require( 'assert' ),
    events = require( 'events' ),
    exec = require( 'child_process' ).exec,
    findit = require( 'findit' ),
    fs = require( 'fs' ),
    path = require( 'path' ),
    vows = require( 'vows' );

vows.describe( 'swarm' ).addBatch( {
  
  'executables': {
  
    'node': {
      
      topic: function() {
        exec( '/usr/bin/which node', this.callback );
      },
      'should be installed in /opt/node/bin/node': function( error, stdout, stderr ) {
        assert.equal( stdout, '/opt/node/bin/node\n' );
        assert.isEmpty( stderr );
      }, // /usr/bin/which node
      
      'sudo': {
        
        topic: function() {
          exec( 'sudo env PATH=$PATH /usr/bin/which node', this.callback );
        },
        'should be installed and visible as sudo in /opt/node/bin/node':
          function( error, stdout, stderr ) {
          assert.equal( stdout, '/opt/node/bin/node\n' );
          assert.isEmpty( stderr );
        } // sudo env PATH=$PATH /usr/bin/which node
        
      } // sudo
      
    }, // node
    
    'npm': {
      
      topic: function() {
        exec( '/usr/bin/which npm', this.callback );
      },
      'should be installed in /opt/node/bin/npm': function( error, stdout, stderr ) {
        assert.equal( stdout, '/opt/node/bin/npm\n' );
        assert.isEmpty( stderr );
      }, // /usr/bin/which npm
      
      'sudo': {
        
        topic: function() {
          exec( 'sudo env PATH=$PATH /usr/bin/which npm', this.callback );
        },
        'should be installed and visible as sudo in /opt/node/bin/npm':
          function( error, stdout, stderr ) {
          assert.equal( stdout, '/opt/node/bin/npm\n' );
          assert.isEmpty( stderr );
        } // sudo env PATH=$PATH /usr/bin/which npm
        
      } // sudo
      
    }, // npm
   
    'swarm': {
    
      topic: function() {
        exec( '/usr/bin/which swarm', this.callback );
      },
      'should be installed in /opt/node/bin/swarm': function( error, stdout, stderr ) {
        assert.equal( stdout, '/opt/node/bin/swarm\n' );
        assert.isEmpty( stderr );
      }, // /usr/bin/which swarm
      
      'sudo': {
        
        topic: function() {
          exec( 'sudo env PATH=$PATH /usr/bin/which swarm', this.callback );
        },
        'should be installed and visible as sudo in /opt/node/bin/swarm':
          function( error, stdout, stderr ) {
          assert.equal( stdout, '/opt/node/bin/swarm\n' );
          assert.isEmpty( stderr );
        } // sudo env PATH=$PATH /usr/bin/which swarm
        
      } // sudo
      
    }, // swarm
    
    'swake': {
      
      topic: function() {
        exec( '/usr/bin/which swake', this.callback );
      },
      'should be installed in /opt/node/bin/swake': function( error, stdout, stderr ) {
        assert.equal( stdout, '/opt/node/bin/swake\n' );
        assert.isEmpty( stderr );
      }, // /usr/bin/which swake
      
      'sudo': {
        
        topic: function() {
          exec( 'sudo env PATH=$PATH /usr/bin/which swake', this.callback );
        },
        'should be installed and visible as sudo in /opt/node/bin/swake':
          function( error, stdout, stderr ) {
          assert.equal( stdout, '/opt/node/bin/swake\n' );
          assert.isEmpty( stderr );
        } // sudo env PATH=$PATH /usr/bin/which swake
        
      } // sudo
      
    } // swake
  
  } // executables

}).addBatch( {
  
  'file permissions': {
    
    topic: function() {
      
      var uid = null, gid = null;
      
      var promise = new( events.EventEmitter );
      
      var checkHaveBoth = function() {
        if ( uid && gid ) {
          promise.emit( 'success', uid, gid );
        }
      };
     
      // get swarm user uid
      exec( 'id -u swarm', function( error, stdout, stderr ) {
      
        if ( error ) {
          promise.emit( 'error', error );
          return;
        }
        if ( stderr ) {
          promise.emit( 'error', stderr );
          return;
        }
        uid = parseInt( stdout );
        checkHaveBoth();
        
      }); // exec
      
      // get swarm user gid
      exec( 'id -g swarm', function( error, stdout, stderr ) {
        
        if ( error ) {
          promise.emit( 'error', error );
          return;
        }
        if ( stderr ) {
          promise.emit( 'error', stderr );
          return;
        }
        gid = parseInt( stdout );
        checkHaveBoth();
        
      }); // exec
      
      return promise;
      
    }, // topic
    
//    '/opt/node directory and contents': {
//      
//      topic: function( uid, gid ) {
//        
//        var contents = [];
//        
//        var promise = new( events.EventEmitter );
//        
//        var finder = findit.find( '/opt/node' );
//        
//        finder.on( 'path', function( path ) {
//         
//          contents.push( path );
//          
//        });
//        
//        finder.on( 'end', function() {
//          
//          promise.emit( 'success', contents, uid, gid );
//          
//        });
//        
//        return promise;
//        
//      }, // topic
//      'should belong to swarm user and swarm group': 
//        function( error, contents, uid, gid ) {
//        
//        for ( var i = 0; i < contents.length; i++ ) {
//          
//          fs.stat( contents[ i ], function( error, stats ) {
//            
//            assert.equal( error, undefined );
//            assert.equal( stats.uid, uid );
//            assert.equal( stats.gid, gid );
//            
//          });
//          
//        } // for contents
//
//      } // stat /opt/node
//      
//    }, // /opt/node
    
    '/opt/npm directory and contents': {
      
      topic: function( uid, gid ) {
        
        var contents = [];
        
        var promise = new( events.EventEmitter );
        
        var finder = findit.find( '/opt/npm' );
        
        finder.on( 'path', function( path ) {
         
          contents.push( path );
          
        });
        
        finder.on( 'end', function() {
          
          promise.emit( 'success', contents, uid, gid );
          
        });
        
        return promise;
        
      }, // topic
      'should belong to swarm user and swarm group': 
        function( error, contents, uid, gid ) {
        
        for ( var i = 0; i < contents.length; i++ ) {
          
          fs.stat( contents[ i ], function( error, stats ) {
            
            assert.equal( error, undefined );
            assert.equal( stats.uid, uid );
            assert.equal( stats.gid, gid );
            
          });
          
        } // for contents

      } // stat /opt/npm
      
    }, // /opt/npm
    
    '/opt/swake directory and contents': {
      
      topic: function( uid, gid ) {
        
        var contents = [];
        
        var promise = new( events.EventEmitter );
        
        var finder = findit.find( '/opt/swake' );
        
        finder.on( 'path', function( path ) {
         
          contents.push( path );
          
        });
        
        finder.on( 'end', function() {
          
          promise.emit( 'success', contents, uid, gid );
          
        });
        
        return promise;
        
      }, // topic
      'should belong to swarm user and swarm group': 
        function( error, contents, uid, gid ) {
        
        for ( var i = 0; i < contents.length; i++ ) {
          
          fs.stat( contents[ i ], function( error, stats ) {
            
            assert.equal( error, undefined );
            assert.equal( stats.uid, uid );
            assert.equal( stats.gid, gid );
            
          });
          
        } // for contents

      } // stat /opt/swake
      
    }, // /opt/swake
    
    '/opt/swarm directory and contents': {
      
      topic: function( uid, gid ) {
        
        var contents = [];
        
        var promise = new( events.EventEmitter );
        
        var finder = findit.find( '/opt/swarm' );
        
        finder.on( 'path', function( path ) {
         
          contents.push( path );
          
        });
        
        finder.on( 'end', function() {
          
          promise.emit( 'success', contents, uid, gid );
          
        });
        
        return promise;
        
      }, // topic
      'should belong to swarm user and swarm group': 
        function( error, contents, uid, gid ) {
        
        for ( var i = 0; i < contents.length; i++ ) {
          
          fs.stat( contents[ i ], function( error, stats ) {
            
            assert.equal( error, undefined );
            assert.equal( stats.uid, uid );
            assert.equal( stats.gid, gid );
            
          });
          
        } // for contents

      } // stat /opt/swarm
      
    } // /opt/swarm
    
  } // file permissions
  
}).addBatch( {
  
  'seeds': {
    
    'swarm': {
    
      '_init': {
        
        topic: '/opt/swarm/seeds/swarm/_init.seed.js',
        'seed should be present': function( topic ) {
          
          path.exists( topic, function( exists ) {
            
            assert.isTrue( exists );
            
          }); 
          
        } // should be present
        
      }, // _init
      
      'swarm': {
        
        topic: '/opt/swarm/seeds/swarm/swarm.seed.js',
        'seed should be present': function( topic ) {
          
          path.exists( topic, function( exists ) {
            
            assert.isTrue( exists );
            
          }); 
          
        } // should be present
        
      } // swarm

    } // swarm
    
  } // seeds

}).export( module );