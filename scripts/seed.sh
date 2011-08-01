#!/bin/bash

# USAGE:
usage="Usage: $0 ssh-authorized-key-file seedconfig-file"

# DESCRIPTION:
#   Bootstraps a raw Ubuntu installation for swarm
#   1. updates the system
#   2. installs UFW
#   3. locks down the machine allowing only port 22 ssh access by 'swarm'
#   4. installs node
#   5. installs npm
#   6. installs swarm
#   7. runs swarm initialize script using seedconfig-file
#   8. reboots if required

if [ -z $1 ]; then
	echo $usage
	exit 1
fi
if [ ! -e $2 ]; then
	echo $usage
	exit 1
fi

# Generate a random password 2048 long including special characters
function randpass() {
	CHAR="[:graph:]"
	cat /dev/urandom | tr -cd "$CHAR" | head -c 2048
}

# Change root password to random large password

pass=`randpass`
echo "root:$pass" | chpasswd

# Create swarm user and don't ask for password

adduser --gecos swarm,,, --disabled-login swarm

# Set the swarm user to random large password

pass=`randpass`
echo "swarm:$pass" | chpasswd

# Add swarm to be a sudo user
	
echo 'swarm ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers.d/swarm
chmod 0440 /etc/sudoers.d/swarm

# Create swarm directory

mkdir /opt/swarm

# Copy the configuration file to /opt/swarm/.seedconfig.js

cat $2 >> /opt/swarm/.seedconfig.js

# Give swarm user control over /home/swarm

chown -R swarm /home/swarm
chgrp -R swarm /home/swarm

# Update the system

apt-get update -y
	
# Upgrade the system

apt-get upgrade -y

# Create .ssh directory for swarm

mkdir /opt/swarm/.ssh
	
# Define ssh configuration

config="\n
# What ports, IPs and protocs we listen for\n
Port 22\n
Protocol 2\n
HostKey /etc/ssh/ssh_host_rsa_key\n
HostKey /etc/ssh/ssh_host_dsa_key\n
\n
# Privilege Separation is turned on for security\n
UsePrivilegeSeparation yes\n
\n
# Lifetime and size of ephemeral version 1 server key\n
KeyRegenerationInterval 3600\n
ServerKeyBits 2048\n
\n
# Logging\n
SyslogFacility AUTH\n
LogLevel INFO\n
\n
# Authentication\n
LoginGraceTime 120\n
PermitRootLogin no\n
StrictModes yes\n
\n
RSAAuthentication yes\n
PubkeyAuthentication yes\n
AuthorizedKeysFile /opt/swarm/.ssh/authorized_keys\n
\n
# Don't read the user's ~/.rhosts and ~/.shosts files\n
IgnoreRhosts yes\n
IgnoreUserKnownHosts yes\n
RhostsRSAAuthentication no\n
HostbasedAuthentication no\n
\n
PermitEmptyPasswords no\n
\n
ChallengeResponseAuthentication no\n
\n
PasswordAuthentication no\n
\n
X11Forwarding no\n
X11DisplayOffset 10\n
PrintMotd yes\n
PrintLastLog yes\n
TCPKeepAlive yes\n
\n
#Banner /etc/issue.net\n
\n
# Allow client to pass locale environment variables\n
AcceptEnv LANG LC_*\n
\n
Subsystem sftp /usr/lib/openssh/sftp-server\n
\n
UsePAM no\n
UseDNS no\n
\n
AllowUsers swarm"

# Set the ssh configuration to the one we specified above

rm /etc/ssh/sshd_config
echo -e $config >> /etc/ssh/sshd_config
	
# Restart ssh

/etc/init.d/ssh restart

# Install UFW ( uncomplicated firewall )

apt-get install ufw -y
	
# Allow only the swarm user identified with ssh-authorized-key-file

cat $1 >> /opt/swarm/.ssh/authorized_keys

# Close down the firewall allowing only key identified 'swarm' user

ufw deny in from any to any
ufw insert 1 limit in proto tcp from any to any port 22
ufw logging on
ufw --force enable

# Install git

apt-get install git-core -y

# Install build tools ( needed to build node )

apt-get install build-essential -y

# Install libssl-dev ( needed to build node )

apt-get install libssl-dev -y

# Install node

cd /opt
git clone --depth 1 git://github.com/joyent/node.git
cd node
git checkout origin/v0.4
./configure --prefix=/opt/node
make
make install
echo 'export PATH=/opt/node/bin:$PATH' >> /etc/bash.bashrc
echo 'export NODE_PATH=/opt/node:/opt/node/lib/node_modules' >> /etc/bash.bashrc
# Because the above is only good once script finishes, need to
#  export path also in our current environment
export PATH=/opt/node/bin:$PATH
export NODE_PATH=/opt/node:/opt/node/lib/node_modules

# Install npm

cd /opt
git clone http://github.com/isaacs/npm.git
cd npm
make install

# Give swarm user control over node, npm, and swarm

chown -R swarm /opt/node
chgrp -R swarm /opt/node
chown -R swarm /opt/npm
chgrp -R swarm /opt/npm
chown -R swarm /opt/swarm
chgrp -R swarm /opt/swarm
	
# Install swarm

cd /
npm -g install swarm
# Currently there is a problem above in that it runs as 'nobody' user, which
# prevents the postinstall script initialized from 'spawn' to install anything
# due to lack of permissions

# Check if we need to reboot after all the changes we made

if [ -e /var/run/reboot-required ]; then
	reboot
fi