if [ -z "$SSH_ASKPASS" ] && [ -n "$DISPLAY" ]; then
    export SSH_ASKPASS=/usr/lib64/seahorse/seahorse-ssh-askpass
fi
