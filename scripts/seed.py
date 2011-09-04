#!/usr/bin/env python
# -*- coding: utf-8 -*

import os, pwd, random, string, sys, textwrap

from subprocess import call

def cmd( command ):
  call( command, shell = True )
  
def change_password_to_random_large_password( user ):
  password = ''.join( random.choice( string.ascii_letters + string.digits ) for x in range( 2048 ) )
  cmd( '/bin/echo "' + user + ':' + password + '" | chpasswd' )

def main():
  try:
    import argparse
  except ImportError:
    cmd( '/usr/bin/apt-get install python-argparse -y' )
    import argparse
    
  parser = argparse.ArgumentParser( 
      formatter_class = argparse.RawDescriptionHelpFormatter,
      description = textwrap.dedent("""
          seed
          
          Bootstraps a raw Ubuntu installation for swarm
          1. updates the system
          2. installs UFW
          3. locks down the machine allowing only port 22 ssh access by 'swarm'
          4. installs node
          5. installs npm
          6. installs swarm
          7. installs swake
          8. runs swarm initialize script using seed_file
          9. reboots if required
          """ ) # description
  ) # ArgumentParser
  parser.add_argument( 'auth_key_file', metavar = 'ssh-authorized-key-file', 
                       type = str, nargs = 1, help = 'swarm user public key' )
  parser.add_argument( 'seed_file', metavar = 'seed-file',
                       type = str, nargs = 1, help = 'seed configuration file in node module format' )
  
  args = parser.parse_args()
  
  args.auth_key_file = args.auth_key_file[ 0 ]
  if not args.auth_key_file:
    parser.print_usage()
    sys.exit()
  elif not os.path.exists( args.auth_key_file ):
    print 'file ' + args.auth_key_file + ' does not exist'
    parser.print_usage()
    sys.exit()
  elif not os.path.isfile( args.auth_key_file ):
    print args.auth_key_file + ' is not a file'
    parser.print_usage()
    sys.exit()
    
  args.seed_file = args.seed_file[ 0 ]
  if not args.seed_file:
    parser.print_usage()
    sys.exit()
  elif not os.path.exists( args.seed_file ):
    print 'file ' + args.seed_file + ' does not exist'
    parser.print_usage()
    sys.exit()
  elif not os.path.isfile( args.seed_file ):
    print args.seed_file + ' is not a file'
    parser.print_usage()
    sys.exit()  

  change_password_to_random_large_password( 'root' )
  
  # Create swarm user and don't ask for password
  cmd( '/usr/sbin/adduser --gecos swarm,,, --disabled-login swarm' )
  
  change_password_to_random_large_password( 'swarm' )
  
  # Add swarm to be a sudo user
  cmd( '/bin/echo "swarm ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/swarm' )
  cmd( '/bin/chmod 0440 /etc/sudoers.d/swarm' )
  
  # Create swarm directory
  cmd( '/bin/mkdir /opt/swarm' )
  
  # Create swake directory
  cmd( '/bin/mkdir /opt/swake' )
  
  # Create seeds directory
  cmd( '/bin/mkdir /opt/swarm/seeds' )
  
  # Create seeds swarm directory
  cmd( '/bin/mkdir /opt/swarm/seeds/swarm' )
  
  # Copy the seed configuration file to /opt/swarm/
  cmd( '/bin/cat ' + args.seed_file + ' >> /opt/swarm/seeds/swarm/_init.seed.js' )
  
  # Give swarm user control over /home/swarm
  cmd( '/bin/chown -R swarm /home/swarm' )
  cmd( '/bin/chgrp -R swarm /home/swarm' )
  
  # Update the system
  cmd( '/usr/bin/apt-get update -y' )
  
  # Upgrade the system
  cmd( '/usr/bin/apt-get upgrade -y' )
  
  # Create .ssh directory for swarm
  cmd( '/bin/mkdir /opt/swarm/.ssh' )
  
  # Define ssh configuration
  ssh_config = textwrap.dedent("""
  # What ports, IPs and protocols we listen for
  Port 22
  Protocol 2
  HostKey /etc/ssh/ssh_host_rsa_key
  HostKey /etc/ssh/ssh_host_dsa_key
  
  # Privilege Separation is turned on for security
  UsePrivilegeSeparation yes
  
  # Lifetime and size of ephermal version 1 server key
  KeyRegenerationInterval 3600
  ServerKeyBits 2048
  
  # Logging
  SyslogFacility AUTH
  LogLevel INFO
  
  # Authentication
  LoginGraceTime 120
  PermitRootLogin no
  StrictModes yes
  
  RSAAuthentication yes
  PubkeyAuthentication yes
  AuthorizedKeysFile /opt/swarm/.ssh/authorized_keys
  
  # Don't read the user's ~/.rhosts and ~/.shosts files
  IgnoreRhosts yes
  IgnoreUserKnownHosts yes
  RhostsRSAAuthentication no
  HostbasedAuthentication no
  
  PermitEmptyPasswords no
  
  ChallengeResponseAuthentication no
  
  PasswordAuthentication no
  
  X11Forwarding no
  X11DisplayOffset 10
  PrintMotd yes
  PrintLastLog yes
  TCPKeepAlive yes
  
  # Banner /etc/issue.net
  
  # Allow client to pass locale environment variables
  AcceptEnv LANG LC_*
  
  Subsystem sftp /usr/lib/openssh/sftp-server
  
  UsePAM no
  UseDNS no
  
  AllowUsers swarm
  """)
  
  # Set the ssh configuration to the one we specified above
  cmd( '/bin/rm /etc/ssh/sshd_config' )
  cmd( '/bin/echo "' + ssh_config + '" >> /etc/ssh/sshd_config' )
  
  # Restart ssh
  cmd( '/etc/init.d/ssh restart' )
  
  # Install UFW ( uncomplicated firewall )
  cmd( '/usr/bin/apt-get install ufw -y' )
  
  # Allow only teh swarm user identified with ssh-authorized-key-file
  cmd( '/bin/cat ' + args.auth_key_file + ' >> /opt/swarm/.ssh/authorized_keys' )
  
  # Close down the firewall allowing only key identified 'swarm' user
  cmd( '/usr/sbin/ufw deny in from any to any' )
  cmd( '/usr/sbin/ufw insert 1 limit in proto tcp from any to any port 22' )
  cmd( '/usr/sbin/ufw logging on' )
  cmd( '/usr/sbin/ufw --force enable' )
  
  # Install git
  cmd( '/usr/bin/apt-get install git-core -y' )
  
  # Install build tools ( needed to build node )
  cmd( '/usr/bin/apt-get install build-essential -y' )
  
  # Install libssl-dev ( needed to build node )
  cmd( '/usr/bin/apt-get install libssl-dev -y' )
  
  # Install node
  os.chdir( '/opt' )
  cmd( '/usr/bin/git clone --depth 1 git://github.com/joyent/node.git' )
  os.chdir( '/opt/node' )
  cmd( '/usr/bin/git checkout origin/v0.4' )
  cmd( './configure --prefix=/opt/node' )
  cmd( '/usr/bin/make' )
  cmd( '/usr/bin/make install' )
  cmd( '/bin/echo "export PATH=/opt/node/bin:$PATH" >> /etc/bash.bashrc' )
  cmd( '/bin/echo "export NODE_PATH=/opt/node:/opt/node/lib/node_modules" >> /etc/bash.bashrc' )
  cmd( '/bin/echo "export SWAKE_PATH=/opt/swake >> /etc/bash.bashrc' )
  # Because the above is only good once script finishes, we need to export
  #  path also in our current script execution environment
  current_path = os.getenv( 'PATH', 'Error' )
  os.environ[ 'PATH' ] = '/opt/node/bin:' + current_path
  os.environ[ 'NODE_PATH' ] = '/opt/node:/opt/node/lib/node_modules'
  os.environ[ 'SWAKE_PATH' ] = '/opt/swake'
  
  # Install npm
  os.chdir( '/opt' )
  cmd( '/usr/bin/git clone http://github.com/isaacs/npm.git' )
  os.chdir( '/opt/npm' )
  cmd( '/usr/bin/make install' )
  
  # Give swarm user control over node, npm, swake, and swarm
  cmd( '/bin/chown -R swarm /opt/node' )
  cmd( '/bin/chgrp -R swarm /opt/node' )
  cmd( '/bin/chown -R swarm /opt/npm' )
  cmd( '/bin/chgrp -R swarm /opt/npm' )
  cmd( '/bin/chown -R swarm /opt/swake' )
  cmd( '/bin/chgrp -R swarm /opt/swake' )
  cmd( '/bin/chown -R swarm /opt/swarm' )
  cmd( '/bin/chgrp -R swarm /opt/swarm' )
  
  # Install swarm
  os.chdir( '/' )
  cmd( '/opt/node/bin/npm -g install swarm' )
  
  # Give swarm user control over installed swarm package ( so we can move swake files )
  cmd( '/bin/chown -R swarm /opt/node/lib/node_modules/swarm' )
  cmd( '/bin/chgrp -R swarm /opt/node/lib/node_modules/swarm' )
  
  # Move swake files from swarm installation to SWAKE_PATH
  cmd( '/bin/mv /opt/node/lib/node_modules/swarm/swake/* /opt/swake' )
  
  # Install swake
  cmd( '/opt/node/bin/npm -g install swake' )
  
  # Give swarm user control over installed swake package
  cmd( '/bin/chown -R swarm /opt/node/lib/node_modules/swake' )
  cmd( '/bin/chgrp -R swarm /opt/node/lib/node_modules/swake' )
  
  # Become swarm user
  try:
    uid = pwd.getpwnam( 'swarm' )[ 2 ]
    os.setuid( uid )
  except OSError:
    sys.stderr.write( 'error: unable to become swarm user, stopping...' )
    sys.exit()
  
  # Initialize swarm
  cmd( 'sudo ' +
       'env PATH=$PATH NODE_PATH=$NODE_PATH SWAKE_PATH=$SWAKE_PATH ' +
       '/opt/node/bin/swarm initialize ' + '/opt/swarm/seeds/swarm/_init.seed.js' )
  
  # Check if we need to reboot after all the changes we made
  if os.path.exists( '/var/run/reboot-required' ):
    cmd( '/sbin/reboot' )
  
if __name__ == '__main__':
  main()