var swake = require( 'swake' );

exports.seed = function() {

swake.swake( 'seed:loadDependency', 
  [ 'cloudservers', '0.2.6' ], {}, function ( code ) {
  
swake.swake( 'seed:createControlCluster',
  [ 'rackspace', 'your-username', 'your-api-key' ], {} );
  
}); // seed:loadDependency

}; // exports.seed