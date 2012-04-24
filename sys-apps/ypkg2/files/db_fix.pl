#! /usr/bin/perl

use warnings;
use strict;

my @result = `sqlite3 /var/ypkg/db/package.db "select name from universe where is_desktop='1'"`;

for ( @result )
{
    chomp;
        ` sqlite3 /var/ypkg/db/package.db "update world set is_desktop='1' where name='$_'" `;
}

print 'Done.\n';
