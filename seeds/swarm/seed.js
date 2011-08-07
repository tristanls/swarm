exports.dependencies = {
  "cloudservers" : "0.2.6",
  "jake" : "0.1.14"
};

exports.jakefile = "seed.jake.js";

exports.cloudservers = {
  rackspace : {
    auth : {
      username : 'your-username',
      apiKey : 'your-api-key' 
    }
  }
};

exports.controlCluster = {
    size: 3
  };

exports.configure = {
    "seed:create_control_cluster" : [ 
      exports.cloudservers.rackspace.auth.username,
      exports.cloudservers.rackspace.auth.apiKey,
      exports.controlCluster.size
    ]
  };