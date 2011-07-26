#
# spec file for package rt5390sta (Version 2.4.0.4)
#
# Copyright (c) 2010 SUSE LINUX Products GmbH, Nuernberg, Germany.
#
# All modifications and additions to the file contributed by third parties
# remain the property of their copyright owners, unless otherwise agreed
# upon. The license for this file, and modifications and additions to the
# file, is the same license as for the pristine package itself (unless the
# license for the pristine package is not an Open Source License, in which
# case the license is the MIT License). An "Open Source License" is a
# license that conforms to the Open Source Definition (Version 1.9)
# published by the Open Source Initiative.
# Please submit bugfixes or comments via http://bugs.opensuse.org/
#
# norootforbuild
#

%define setup_version 2010_1216_RT5390_LinuxSTA_V2.4.0.4_WiFiBTCombo_DPO

Name:		rt5390sta
%if 0%{?suse_version} >= 1120
BuildRequires:	%kernel_module_package_buildreqs dos2unix
%else
BuildRequires:	kernel-source kernel-syms module-init-tools dos2unix
%endif
PreReq:		sed
Summary:	RT5390 Wireless Lan Linux Driver 
Version:	2.4.0.4
Release:	0.ak.0
Group:		System/Kernel
License:	GPL
BuildRoot:	%{_tmppath}/%{name}-%{version}-build
Url:		http://www.ralinktech.com/support.php?s=2
Source0:	%{setup_version}.tar.bz2
Source1:	preamble
Source100:	%{name}.changes
Patch0:		%{name}-%{version}-config.patch
Patch1:		%{name}-%{version}-gcc-warnings-x86_64.patch
Patch2:		%{name}-%{version}-WPA-mixed.patch
Patch3:		%{name}-%{version}-convert-devicename-to-wlanX.patch
Patch4:		%{name}-%{version}-remove-potential-conflicts-with-rt2860sta.patch
Patch5:		%{name}-%{version}-return_nonvoid_function.patch
Patch6:		%{name}-%{version}-reduce_debug_output.patch
Autoreqprov:	on

%suse_kernel_module_package -p %_sourcedir/preamble kdump ec2 um

%description
This package contains a kernel module, configuration files and documentation for Ralink RT5390 "Draft-n" PCI WLAN adaptors.
The driver is built with support for wpa_supplicant and wext, so you should be able to use this card with NetworkManager.

%package KMP
Summary:	RT5390 Wireless Lan Linux Driver
Group:		System/Kernel

%description KMP
This package contains a kernel module for Ralink RT5390 "Draft-n" PCI WLAN adaptors.
The driver is built with support for wpa_supplicant and wext, so you should be able to use this card with NetworkManager.

%package -n %{name}-common
Summary:	RT5390 Wireless Lan Linux Driver configuration files and documentation
Group:		System/Kernel
%if 0%{?suse_version} >= 1120
BuildArch:	noarch
%endif

%description -n %{name}-common
This package contains documentation files for the RT5390 Wireless Lan Linux Driver.

%prep
%setup -q -n %{setup_version}
%patch0 -p0
%ifarch x86_64 ppc64 ia64
%patch1 -p0
%endif
%patch2 -p0
%patch3 -p0
%patch4 -p0
%patch5 -p0
%patch6 -p0

# clean up this mess of mixing RT2860STA with RT5390STA
# in documentation files
mv RT2860STA.dat RT5390STA.dat
mv RT2860STACard.dat RT5390STACard.dat
%__sed -i 's/2860/5390/g' *STA* iwpriv_usage.txt

chmod 0644 RT5390* README* *.txt
dos2unix RT5390* README* *.txt

# as we change the default name of the interface from raX to wlanX, change respective references in documentation, too
%__sed -i 's|ra0|wlan0|g' *.txt README* *.dat
%__sed -i 's|ra1|wlan1|g' *.txt README* *.dat
%__sed -i 's|ra2|wlan2|g' *.txt README* *.dat

set -- *
mkdir source
mv "$@" source/
mkdir obj

%build
export EXTRA_CFLAGS='-DVERSION=\"%version\"'
for flavor in %flavors_to_build; do
	rm -rf obj/$flavor
	cp -r source obj/$flavor
	make -C obj/$flavor LINUX_SRC=/usr/src/linux-obj/%_target_cpu/$flavor
done

%install
# install configuration files
mkdir -p $RPM_BUILD_ROOT/%{_sysconfdir}/Wireless/RT5390STA/
install -m 0640 source/RT5390STA.dat $RPM_BUILD_ROOT/%{_sysconfdir}/Wireless/RT5390STA/

# install kernel module
export INSTALL_MOD_PATH=$RPM_BUILD_ROOT
export INSTALL_MOD_DIR=updates
for flavor in %flavors_to_build; do
if [ $flavor != debug ] ; then
        find . -iname "*.ko" -exec strip --strip-debug {} \;
fi
        make -C /usr/src/linux-obj/%_target_cpu/$flavor modules_install \
                M=$PWD/obj/$flavor/os/linux
done

%clean
rm -rf $RPM_BUILD_ROOT

%files -n %{name}-common
%defattr(-,root,root)
%doc source/iwpriv_usage.txt source/README* source/RT5390STA* source/sta_ate_iwpriv_usage.txt
%dir %{_sysconfdir}/Wireless/
%dir %{_sysconfdir}/Wireless/RT5390STA
%config(noreplace) %{_sysconfdir}/Wireless/RT5390STA/RT5390STA.dat

%changelog
