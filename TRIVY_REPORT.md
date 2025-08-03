# Trivy Vulnerability Report

**Date:** 2025-08-02
**Image:** `go-chrome-test:latest`

This report details the vulnerabilities found in the Docker image built with a Debian `bookworm-slim` base and Google Chrome installed.

## Summary

| Target                        | Type     | Vulnerabilities | Secrets |
| ----------------------------- | -------- | --------------- | ------- |
| go-chrome-test (debian 12.11) | debian   | 244             | -       |
| app/main                      | gobinary | 4               | -       |

**Total:** 248 (UNKNOWN: 1, LOW: 178, MEDIUM: 43, HIGH: 22, CRITICAL: 4)

---

## Debian Vulnerabilities (OS Packages)

| Library                 | Vulnerability       | Severity | Status       | Installed Version  | Fixed Version | Title                                                              |
| ----------------------- | ------------------- | -------- | ------------ | ------------------ | ------------- | ------------------------------------------------------------------ |
| apt                     | CVE-2011-3374       | LOW      | affected     | 2.6.1              |               | It was found that apt-key in apt, all versions, do not...          |
| bash                    | TEMP-0841856-B18BAF | LOW      | affected     | 5.2.15-2+b8        |               | [Privilege escalation possible to other user than root]            |
| bsdutils                | CVE-2022-0563       | LOW      | affected     | 1:2.38.1-5+deb12u3 |               | util-linux: partial disclosure of arbitrary files in chfn...       |
| coreutils               | CVE-2016-2781       | LOW      | will_not_fix | 9.1-1              |               | coreutils: Non-privileged session can escape to the parent...      |
| coreutils               | CVE-2017-18018      | LOW      | affected     | 9.1-1              |               | coreutils: race condition vulnerability in chown and chgrp         |
| coreutils               | CVE-2025-5278       | LOW      | affected     | 9.1-1              |               | coreutils: Heap Buffer Under-Read in GNU Coreutils sort via...     |
| dpkg                    | CVE-2025-6297       | UNKNOWN  | affected     | 1.21.22            |               | It was discovered that dpkg-deb does not properly sanitize...      |
| gcc-12-base             | CVE-2022-27943      | LOW      | affected     | 12.2.0-14+deb12u1  |               | binutils: libiberty/rust-demangle.c in GNU GCC 11.2 allows...    |
| gpgv                    | CVE-2022-3219       | LOW      | affected     | 2.2.40-1.1         |               | gnupg: denial of service issue (resource consumption) using...     |
| gpgv                    | CVE-2025-30258      | LOW      | affected     | 2.2.40-1.1         |               | gnupg: verification DoS due to a malicious subkey in the...        |
| libapparmor1            | CVE-2016-1585       | LOW      | affected     | 3.0.8-3            |               | In all versions of AppArmor mount rules are accidentally...        |
| libapt-pkg6.0           | CVE-2011-3374       | LOW      | affected     | 2.6.1              |               | It was found that apt-key in apt, all versions, do not...          |
| libavahi-client3        | CVE-2024-52615      | MEDIUM   | affected     | 0.8-10+deb12u1     |               | avahi: Avahi Wide-Area DNS Uses Constant Source Port               |
| libavahi-client3        | CVE-2024-52616      | MEDIUM   | affected     | 0.8-10+deb12u1     |               | avahi: Avahi Wide-Area DNS Predictable Transaction IDs             |
| libavahi-common-data    | CVE-2024-52615      | MEDIUM   | affected     | 0.8-10+deb12u1     |               | avahi: Avahi Wide-Area DNS Uses Constant Source Port               |
| libavahi-common-data    | CVE-2024-52616      | MEDIUM   | affected     | 0.8-10+deb12u1     |               | avahi: Avahi Wide-Area DNS Predictable Transaction IDs             |
| libavahi-common3        | CVE-2024-52615      | MEDIUM   | affected     | 0.8-10+deb12u1     |               | avahi: Avahi Wide-Area DNS Uses Constant Source Port               |
| libavahi-common3        | CVE-2024-52616      | MEDIUM   | affected     | 0.8-10+deb12u1     |               | avahi: Avahi Wide-Area DNS Predictable Transaction IDs             |
| libblkid1               | CVE-2022-0563       | LOW      | affected     | 2.38.1-5+deb12u3   |               | util-linux: partial disclosure of arbitrary files in chfn...       |
| libc-bin                | CVE-2025-4802       | HIGH     | affected     | 2.36-9+deb12u10    |               | glibc: static setuid binary dlopen may incorrectly search...       |
| libc-bin                | CVE-2025-8058       | MEDIUM   | affected     | 2.36-9+deb12u10    |               | glibc: Double free in glibc                                        |
| libc-bin                | CVE-2010-4756       | LOW      | affected     | 2.36-9+deb12u10    |               | glibc: glob implementation can cause excessive CPU and...          |
| libc-bin                | CVE-2018-20796      | LOW      | affected     | 2.36-9+deb12u10    |               | glibc: uncontrolled recursion in function...                       |
| libc-bin                | CVE-2019-1010022    | LOW      | affected     | 2.36-9+deb12u10    |               | glibc: stack guard protection bypass                               |
| libc-bin                | CVE-2019-1010023    | LOW      | affected     | 2.36-9+deb12u10    |               | glibc: running ldd on malicious ELF leads to code execution...     |
| libc-bin                | CVE-2019-1010024    | LOW      | affected     | 2.36-9+deb12u10    |               | glibc: ASLR bypass using cache of thread stack and heap            |
| libc-bin                | CVE-2019-1010025    | LOW      | affected     | 2.36-9+deb12u10    |               | glibc: information disclosure of heap addresses of...              |
| libc-bin                | CVE-2019-9192       | LOW      | affected     | 2.36-9+deb12u10    |               | glibc: uncontrolled recursion in function...                       |
| libc6                   | CVE-2025-4802       | HIGH     | affected     | 2.36-9+deb12u10    |               | glibc: static setuid binary dlopen may incorrectly search...       |
| libc6                   | CVE-2025-8058       | MEDIUM   | affected     | 2.36-9+deb12u10    |               | glibc: Double free in glibc                                        |
| libc6                   | CVE-2010-4756       | LOW      | affected     | 2.36-9+deb12u10    |               | glibc: glob implementation can cause excessive CPU and...          |
| libc6                   | CVE-2018-20796      | LOW      | affected     | 2.36-9+deb12u10    |               | glibc: uncontrolled recursion in function...                       |
| libc6                   | CVE-2019-1010022    | LOW      | affected     | 2.36-9+deb12u10    |               | glibc: stack guard protection bypass                               |
| libc6                   | CVE-2019-1010023    | LOW      | affected     | 2.36-9+deb12u10    |               | glibc: running ldd on malicious ELF leads to code execution...     |
| libc6                   | CVE-2019-1010024    | LOW      | affected     | 2.36-9+deb12u10    |               | glibc: ASLR bypass using cache of thread stack and heap            |
| libc6                   | CVE-2019-1010025    | LOW      | affected     | 2.36-9+deb12u10    |               | glibc: information disclosure of heap addresses of...              |
| libc6                   | CVE-2019-9192       | LOW      | affected     | 2.36-9+deb12u10    |               | glibc: uncontrolled recursion in function...                       |
| libcairo-gobject2       | CVE-2017-7475       | LOW      | will_not_fix | 1.16.0-7           |               | cairo: NULL pointer dereference with a crafted font file           |
| libcairo-gobject2       | CVE-2018-18064      | LOW      | affected     | 1.16.0-7           |               | cairo: Stack-based buffer overflow via parsing of crafted...       |
| libcairo-gobject2       | CVE-2019-6461       | LOW      | will_not_fix | 1.16.0-7           |               | cairo: assertion problem in _cairo_arc_in_direction in...          |
| libcairo-gobject2       | CVE-2019-6462       | LOW      | will_not_fix | 1.16.0-7           |               | cairo: infinite loop in the function _arc_error_normalized...      |
| libcairo2               | CVE-2017-7475       | LOW      | will_not_fix | 1.16.0-7           |               | cairo: NULL pointer dereference with a crafted font file           |
| libcairo2               | CVE-2018-18064      | LOW      | affected     | 1.16.0-7           |               | cairo: Stack-based buffer overflow via parsing of crafted...       |
| libcairo2               | CVE-2019-6461       | LOW      | will_not_fix | 1.16.0-7           |               | cairo: assertion problem in _cairo_arc_in_direction in...          |
| libcairo2               | CVE-2019-6462       | LOW      | will_not_fix | 1.16.0-7           |               | cairo: infinite loop in the function _arc_error_normalized...      |
| libcups2                | CVE-2014-8166       | LOW      | affected     | 2.4.2-3+deb12u8    |               | cups: code execution via unescape ANSI escape sequences            |
| libdav1d6               | CVE-2023-32570      | MEDIUM   | will_not_fix | 1.0.0-2+deb12u1    |               | VideoLAN dav1d before 1.2.0 has a thread_task.c race...            |
| libelf1                 | CVE-2024-25260      | LOW      | affected     | 0.188-2.1          |               | elfutils: global-buffer-overflow exists in the function...         |
| libelf1                 | CVE-2025-1352       | LOW      | affected     | 0.188-2.1          |               | elfutils: GNU elfutils eu-readelf libdw_alloc.c...                 |
| libelf1                 | CVE-2025-1365       | LOW      | affected     | 0.188-2.1          |               | elfutils: GNU elfutils eu-readelf readelf.c process_symtab...      |
| libelf1                 | CVE-2025-1371       | LOW      | affected     | 0.188-2.1          |               | elfutils: GNU elfutils eu-read readelf.c...                        |
| libelf1                 | CVE-2025-1372       | LOW      | affected     | 0.188-2.1          |               | elfutils: GNU elfutils eu-readelf readelf.c...                     |
| libelf1                 | CVE-2025-1376       | LOW      | affected     | 0.188-2.1          |               | elfutils: GNU elfutils eu-strip elf_strptr.c elf_strptr...         |
| libelf1                 | CVE-2025-1377       | LOW      | affected     | 0.188-2.1          |               | elfutils: GNU elfutils eu-strip strip.c gelf_getsymshndx...        |
| libexpat1               | CVE-2023-52425      | HIGH     | affected     | 2.5.0-1+deb12u1    |               | expat: parsing large tokens can trigger a denial of service        |
| libexpat1               | CVE-2024-8176       | HIGH     | will_not_fix | 2.5.0-1+deb12u1    |               | libexpat: expat: Improper Restriction of XML Entity...             |
| libexpat1               | CVE-2024-50602      | MEDIUM   | affected     | 2.5.0-1+deb12u1    |               | libexpat: expat: DoS via XML_ResumeParser                          |
| libexpat1               | CVE-2023-52426      | LOW      | affected     | 2.5.0-1+deb12u1    |               | expat: recursive XML entity expansion vulnerability                |
| libexpat1               | CVE-2024-28757      | LOW      | affected     | 2.5.0-1+deb12u1    |               | expat: XML Entity Expansion                                        |
| libfdisk1               | CVE-2022-0563       | LOW      | affected     | 2.38.1-5+deb12u3   |               | util-linux: partial disclosure of arbitrary files in chfn...       |
| libgbm1                 | CVE-2023-45913      | LOW      | affected     | 22.3.6-1+deb12u1   |               | Mesa v23.0.4 was discovered to contain a NULL pointer...           |
| libgbm1                 | CVE-2023-45919      | LOW      | affected     | 22.3.6-1+deb12u1   |               | Mesa 23.0.4 was discovered to contain a buffer over-read in...     |
| libgbm1                 | CVE-2023-45922      | LOW      | affected     | 22.3.6-1+deb12u1   |               | glx_pbuffer.c in Mesa 23.0.4 was discovered to contain a...        |
| libgbm1                 | CVE-2023-45931      | LOW      | affected     | 22.3.6-1+deb12u1   |               | Mesa 23.0.4 was discovered to contain a NULL pointer...            |
| libgcc-s1               | CVE-2022-27943      | LOW      | affected     | 12.2.0-14+deb12u1  |               | binutils: libiberty/rust-demangle.c in GNU GCC 11.2 allows...    |
| libgcrypt20             | CVE-2018-6829       | LOW      | affected     | 1.10.1-3           |               | libgcrypt: ElGamal implementation doesn't have semantic...         |
| libgcrypt20             | CVE-2024-2236       | LOW      | affected     | 1.10.1-3           |               | libgcrypt: vulnerable to Marvin Attack                             |
| libgdk-pixbuf-2.0-0     | CVE-2025-7345       | HIGH     | fix_deferred | 2.42.10+dfsg-1+deb12u2 |               | gdk-pixbuf: Heap-buffer-overflow in gdk-pixbuf                     |
| libgdk-pixbuf2.0-common | CVE-2025-7345       | HIGH     | fix_deferred | 2.42.10+dfsg-1+deb12u2 |               | gdk-pixbuf: Heap-buffer-overflow in gdk-pixbuf                     |
| libgl1                  | CVE-2023-45924      | LOW      | affected     | 1.6.0-1            |               | libglxproto.c in OpenGL libglvnd bb06db5a was discovered to...     |
| libgl1-mesa-dri         | CVE-2023-45913      | LOW      | affected     | 22.3.6-1+deb12u1   |               | Mesa v23.0.4 was discovered to contain a NULL pointer...           |
| libgl1-mesa-dri         | CVE-2023-45919      | LOW      | affected     | 22.3.6-1+deb12u1   |               | Mesa 23.0.4 was discovered to contain a buffer over-read in...     |
| libgl1-mesa-dri         | CVE-2023-45922      | LOW      | affected     | 22.3.6-1+deb12u1   |               | glx_pbuffer.c in Mesa 23.0.4 was discovered to contain a...        |
| libgl1-mesa-dri         | CVE-2023-45931      | LOW      | affected     | 22.3.6-1+deb12u1   |               | Mesa 23.0.4 was discovered to contain a NULL pointer...            |
| libglapi-mesa           | CVE-2023-45913      | LOW      | affected     | 22.3.6-1+deb12u1   |               | Mesa v23.0.4 was discovered to contain a NULL pointer...           |
| libglapi-mesa           | CVE-2023-45919      | LOW      | affected     | 22.3.6-1+deb12u1   |               | Mesa 23.0.4 was discovered to contain a buffer over-read in...     |
| libglapi-mesa           | CVE-2023-45922      | LOW      | affected     | 22.3.6-1+deb12u1   |               | glx_pbuffer.c in Mesa 23.0.4 was discovered to contain a...        |
| libglapi-mesa           | CVE-2023-45931      | LOW      | affected     | 22.3.6-1+deb12u1   |               | Mesa 23.0.4 was discovered to contain a NULL pointer...            |
| libglib2.0-0            | CVE-2025-4373       | MEDIUM   | affected     | 2.74.6-2+deb12u6   |               | glib: Buffer Underflow on GLib through glib/gstring.c via...       |
| libglib2.0-0            | CVE-2012-0039       | LOW      | affected     | 2.74.6-2+deb12u6   |               | glib2: hash table collisions CPU usage DoS                         |
| libglvnd0               | CVE-2023-45924      | LOW      | affected     | 1.6.0-1            |               | libglxproto.c in OpenGL libglvnd bb06db5a was discovered to...     |
| libglx-mesa0            | CVE-2023-45913      | LOW      | affected     | 22.3.6-1+deb12u1   |               | Mesa v23.0.4 was discovered to contain a NULL pointer...           |
| libglx-mesa0            | CVE-2023-45919      | LOW      | affected     | 22.3.6-1+deb12u1   |               | Mesa 23.0.4 was discovered to contain a buffer over-read in...     |
| libglx-mesa0            | CVE-2023-45922      | LOW      | affected     | 22.3.6-1+deb12u1   |               | glx_pbuffer.c in Mesa 23.0.4 was discovered to contain a...        |
| libglx-mesa0            | CVE-2023-45931      | LOW      | affected     | 22.3.6-1+deb12u1   |               | Mesa 23.0.4 was discovered to contain a NULL pointer...            |
| libglx0                 | CVE-2023-45924      | LOW      | affected     | 1.6.0-1            |               | libglxproto.c in OpenGL libglvnd bb06db5a was discovered to...     |
| libgnutls30             | CVE-2011-3389       | LOW      | affected     | 3.7.9-2+deb12u5    |               | HTTPS: block-wise chosen-plaintext attack against SSL/TLS...       |
| libgssapi-krb5-2        | CVE-2025-3576       | MEDIUM   | affected     | 1.20.1-2+deb12u3   |               | krb5: Kerberos RC4-HMAC-MD5 Checksum Vulnerability Enabling...     |
| libgssapi-krb5-2        | CVE-2018-5709       | LOW      | affected     | 1.20.1-2+deb12u3   |               | krb5: integer overflow in dbentry->n_key_data in...                |
| libgssapi-krb5-2        | CVE-2024-26458      | LOW      | affected     | 1.20.1-2+deb12u3   |               | krb5: Memory leak at /krb5/src/lib/rpc/pmap_rmt.c                  |
| libgssapi-krb5-2        | CVE-2024-26461      | LOW      | affected     | 1.20.1-2+deb12u3   |               | krb5: Memory leak at /krb5/src/lib/gssapi/krb5/k5sealv3.c          |
| libharfbuzz-subset0     | CVE-2023-25193      | HIGH     | affected     | 6.0.0+dfsg-3       |               | harfbuzz: allows attackers to trigger O(n^2) growth via...         |
| libharfbuzz0b           | CVE-2023-25193      | HIGH     | affected     | 6.0.0+dfsg-3       |               | harfbuzz: allows attackers to trigger O(n^2) growth via...         |
| libip4tc2               | CVE-2012-2663       | LOW      | affected     | 1.8.9-2            |               | iptables: --syn flag bypass                                        |
| libjbig0                | CVE-2017-9937       | LOW      | affected     | 2.1-6.1            |               | libtiff: memory malloc failure in tif_jbig.c could cause...        |
| libk5crypto3            | CVE-2025-3576       | MEDIUM   | affected     | 1.20.1-2+deb12u3   |               | krb5: Kerberos RC4-HMAC-MD5 Checksum Vulnerability Enabling...     |
| libk5crypto3            | CVE-2018-5709       | LOW      | affected     | 1.20.1-2+deb12u3   |               | krb5: integer overflow in dbentry->n_key_data in...                |
| libk5crypto3            | CVE-2024-26458      | LOW      | affected     | 1.20.1-2+deb12u3   |               | krb5: Memory leak at /krb5/src/lib/rpc/pmap_rmt.c                  |
| libk5crypto3            | CVE-2024-26461      | LOW      | affected     | 1.20.1-2+deb12u3   |               | krb5: Memory leak at /krb5/src/lib/gssapi/krb5/k5sealv3.c          |
| libkrb5-3               | CVE-2025-3576       | MEDIUM   | affected     | 1.20.1-2+deb12u3   |               | krb5: Kerberos RC4-HMAC-MD5 Checksum Vulnerability Enabling...     |
| libkrb5-3               | CVE-2018-5709       | LOW      | affected     | 1.20.1-2+deb12u3   |               | krb5: integer overflow in dbentry->n_key_data in...                |
| libkrb5-3               | CVE-2024-26458      | LOW      | affected     | 1.20.1-2+deb12u3   |               | krb5: Memory leak at /krb5/src/lib/rpc/pmap_rmt.c                  |
| libkrb5-3               | CVE-2024-26461      | LOW      | affected     | 1.20.1-2+deb12u3   |               | krb5: Memory leak at /krb5/src/lib/gssapi/krb5/k5sealv3.c          |
| libkrb5support0         | CVE-2025-3576       | MEDIUM   | affected     | 1.20.1-2+deb12u3   |               | krb5: Kerberos RC4-HMAC-MD5 Checksum Vulnerability Enabling...     |
| libkrb5support0         | CVE-2018-5709       | LOW      | affected     | 1.20.1-2+deb12u3   |               | krb5: integer overflow in dbentry->n_key_data in...                |
| libkrb5support0         | CVE-2024-26458      | LOW      | affected     | 1.20.1-2+deb12u3   |               | krb5: Memory leak at /krb5/src/lib/rpc/pmap_rmt.c                  |
| libkrb5support0         | CVE-2024-26461      | LOW      | affected     | 1.20.1-2+deb12u3   |               | krb5: Memory leak at /krb5/src/lib/gssapi/krb5/k5sealv3.c          |
| liblcms2-2              | CVE-2025-29070      | LOW      | affected     | 2.14-2             |               | A heap buffer overflow vulnerability has been identified in...     |
| libllvm15               | CVE-2023-26924      | LOW      | affected     | 1:15.0.6-4+b1      |               | llvm: mlir:: outlineSingleBlockRegion crashes with...              |
| libllvm15               | CVE-2023-29932      | LOW      | affected     | 1:15.0.6-4+b1      |               | llvm: canonicalize pass crashed with segmentation fault            |
| libllvm15               | CVE-2023-29933      | LOW      | affected     | 1:15.0.6-4+b1      |               | llvm: one shot bufferize crashed with segmentation fault           |
| libllvm15               | CVE-2023-29934      | LOW      | affected     | 1:15.0.6-4+b1      |               | llvm: convert-scf-to-spirv Pass crashed with segmentation...       |
| libllvm15               | CVE-2023-29935      | LOW      | affected     | 1:15.0.6-4+b1      |               | llvm: gpu-to-llvm Pass crashed with error message                  |
| libllvm15               | CVE-2023-29939      | LOW      | affected     | 1:15.0.6-4+b1      |               | llvm-project commit a0138390 was discovered to contain a...        |
| libllvm15               | CVE-2023-29941      | LOW      | affected     | 1:15.0.6-4+b1      |               | llvm: sparse-buffer-rewrite pass crashes with Segmentation...      |
| libllvm15               | CVE-2023-29942      | LOW      | affected     | 1:15.0.6-4+b1      |               | llvm: convert-spirv-to-llvm Pass trigger Segmentation fault...     |
| libllvm15               | CVE-2024-31852      | LOW      | affected     | 1:15.0.6-4+b1      |               | llvm: LR register can be overwritten without data being...         |
| libllvm15               | CVE-2024-7883       | LOW      | will_not_fix | 1:15.0.6-4+b1      |               | clang: CMSE secure state may leak from stack to...                 |
| libmount1               | CVE-2022-0563       | LOW      | affected     | 2.38.1-5+deb12u3   |               | util-linux: partial disclosure of arbitrary files in chfn...       |
| libncursesw6            | CVE-2023-50495      | MEDIUM   | affected     | 6.4-4              |               | ncurses: segmentation fault via _nc_wrap_entry()                   |
| libncursesw6            | CVE-2025-6141       | LOW      | affected     | 6.4-4              |               | gnu-ncurses: ncurses Stack Buffer Overflow                         |
| libnss3                 | CVE-2023-5388       | MEDIUM   | will_not_fix | 2:3.87.1-1+deb12u1 |               | nss: timing attack against RSA decryption                          |
| libnss3                 | CVE-2023-6135       | MEDIUM   | will_not_fix | 2:3.87.1-1+deb12u1 |               | nss: vulnerable to Minerva side-channel information leak           |
| libnss3                 | CVE-2024-7531       | MEDIUM   | will_not_fix | 2:3.87.1-1+deb12u1 |               | mozilla: nss: PK11_Encrypt using CKM_CHACHA20 can reveal...        |
| libnss3                 | CVE-2017-11695      | LOW      | affected     | 2:3.87.1-1+deb12u1 |               | nss: Heap-buffer-overflow in alloc_segs                            |
| libnss3                 | CVE-2017-11696      | LOW      | affected     | 2:3.87.1-1+deb12u1 |               | nss: Heap-buffer-overflow in __hash_open                           |
| libnss3                 | CVE-2017-11697      | LOW      | affected     | 2:3.87.1-1+deb12u1 |               | nss: Floating Point Exception in __hash_open                       |
| libnss3                 | CVE-2017-11698      | LOW      | affected     | 2:3.87.1-1+deb12u1 |               | nss: Heap-buffer-overflow in __get_page                            |
| libopenjp2-7            | CVE-2023-39327      | MEDIUM   | fix_deferred | 2.5.0-2+deb12u1    |               | openjpeg: Malicious files can cause the program to enter a...      |
| libopenjp2-7            | CVE-2023-39328      | MEDIUM   | fix_deferred | 2.5.0-2+deb12u1    |               | openjpeg: denail of service via crafted image file                 |
| libopenjp2-7            | CVE-2023-39329      | MEDIUM   | fix_deferred | 2.5.0-2+deb12u1    |               | openjpeg: Resource exhaustion will occur in the...                 |
| libopenjp2-7            | CVE-2016-10505      | LOW      | affected     | 2.5.0-2+deb12u1    |               | openjpeg: NULL pointer dereference in imagetopnm function in...    |
| libopenjp2-7            | CVE-2016-9113       | LOW      | affected     | 2.5.0-2+deb12u1    |               | openjpeg2: Multiple security issues                                |
| libopenjp2-7            | CVE-2016-9114       | LOW      | affected     | 2.5.0-2+deb12u1    |               | openjpeg2: Multiple security issues                                |
| libopenjp2-7            | CVE-2016-9115       | LOW      | affected     | 2.5.0-2+deb12u1    |               | openjpeg2: Multiple security issues                                |
| libopenjp2-7            | CVE-2016-9116       | LOW      | affected     | 2.5.0-2+deb12u1    |               | openjpeg2: Multiple security issues                                |
| libopenjp2-7            | CVE-2016-9117       | LOW      | affected     | 2.5.0-2+deb12u1    |               | openjpeg2: Multiple security issues                                |
| libopenjp2-7            | CVE-2016-9580       | LOW      | affected     | 2.5.0-2+deb12u1    |               | openjpeg2: Integer overflow in tiftoimage causes heap buffer...    |
| libopenjp2-7            | CVE-2016-9581       | LOW      | affected     | 2.5.0-2+deb12u1    |               | openjpeg2: Infinite loop in tiftoimage resulting into heap...      |
| libopenjp2-7            | CVE-2017-17479      | LOW      | affected     | 2.5.0-2+deb12u1    |               | openjpeg: Stack-buffer overflow in the pgxtoimage function         |
| libopenjp2-7            | CVE-2018-16375      | LOW      | affected     | 2.5.0-2+deb12u1    |               | openjpeg: Heap-based buffer overflow in pnmtoimage function...     |
| libopenjp2-7            | CVE-2018-16376      | LOW      | affected     | 2.5.0-2+deb12u1    |               | openjpeg: Heap-based buffer overflow in function...                |
| libopenjp2-7            | CVE-2018-20846      | LOW      | affected     | 2.5.0-2+deb12u1    |               | openjpeg: out-of-bounds read in functions pi_next_lrcp,...         |
| libopenjp2-7            | CVE-2019-6988       | LOW      | fix_deferred | 2.5.0-2+deb12u1    |               | openjpeg: DoS via memory exhaustion in opj_decompress              |
| libpam-modules          | CVE-2025-6020       | HIGH     | affected     | 1.5.2-6+deb12u1    |               | linux-pam: Linux-pam directory Traversal                           |
| libpam-modules          | CVE-2024-10041      | MEDIUM   | affected     | 1.5.2-6+deb12u1    |               | pam: libpam: Libpam vulnerable to read hashed password             |
| libpam-modules          | CVE-2024-22365      | MEDIUM   | affected     | 1.5.2-6+deb12u1    |               | pam: allowing unprivileged user to block another user...           |
| libpam-modules-bin      | CVE-2025-6020       | HIGH     | affected     | 1.5.2-6+deb12u1    |               | linux-pam: Linux-pam directory Traversal                           |
| libpam-modules-bin      | CVE-2024-10041      | MEDIUM   | affected     | 1.5.2-6+deb12u1    |               | pam: libpam: Libpam vulnerable to read hashed password             |
| libpam-modules-bin      | CVE-2024-22365      | MEDIUM   | affected     | 1.5.2-6+deb12u1    |               | pam: allowing unprivileged user to block another user...           |
| libpam-runtime          | CVE-2025-6020       | HIGH     | affected     | 1.5.2-6+deb12u1    |               | linux-pam: Linux-pam directory Traversal                           |
| libpam-runtime          | CVE-2024-10041      | MEDIUM   | affected     | 1.5.2-6+deb12u1    |               | pam: libpam: Libpam vulnerable to read hashed password             |
| libpam-runtime          | CVE-2024-22365      | MEDIUM   | affected     | 1.5.2-6+deb12u1    |               | pam: allowing unprivileged user to block another user...           |
| libpam-systemd          | CVE-2013-4392       | LOW      | affected     | 252.38-1~deb12u1   |               | systemd: TOCTOU race condition when updating file...               |
| libpam-systemd          | CVE-2023-31437      | LOW      | affected     | 252.38-1~deb12u1   |               | An issue was discovered in systemd 253. An attacker can...         |
| libpam-systemd          | CVE-2023-31438      | LOW      | affected     | 252.38-1~deb12u1   |               | An issue was discovered in systemd 253. An attacker can...         |
| libpam-systemd          | CVE-2023-31439      | LOW      | affected     | 252.38-1~deb12u1   |               | An issue was discovered in systemd 253. An attacker can...         |
| libpam0g                | CVE-2025-6020       | HIGH     | affected     | 1.5.2-6+deb12u1    |               | linux-pam: Linux-pam directory Traversal                           |
| libpam0g                | CVE-2024-10041      | MEDIUM   | affected     | 1.5.2-6+deb12u1    |               | pam: libpam: Libpam vulnerable to read hashed password             |
| libpam0g                | CVE-2024-22365      | MEDIUM   | affected     | 1.5.2-6+deb12u1    |               | pam: allowing unprivileged user to block another user...           |
| libpixman-1-0           | CVE-2023-37769      | LOW      | affected     | 0.42.2-1           |               | stress-test master commit e4c878 was discovered to contain a...    |
| libpng16-16             | CVE-2021-4214       | LOW      | affected     | 1.6.39-2           |               | libpng: hardcoded value leads to heap-overflow                     |
| libproc2-0              | CVE-2023-4016       | LOW      | affected     | 2:4.0.2-3          |               | procps: ps buffer overflow                                         |
| libsmartcols1           | CVE-2022-0563       | LOW      | affected     | 2.38.1-5+deb12u3   |               | util-linux: partial disclosure of arbitrary files in chfn...       |
| libsndfile1             | CVE-2022-33064      | HIGH     | fix_deferred | 1.2.0-1            |               | libsndfile: off-by-one error in function wav_read_header in...     |
| libsndfile1             | CVE-2022-33065      | HIGH     | affected     | 1.2.0-1            |               | libsndfile: integer overflow in src/mat4.c and src/au.c...         |
| libsndfile1             | CVE-2024-50612      | MEDIUM   | affected     | 1.2.0-1            |               | libsndfile: Segmentation fault error in ogg_vorbis.c:417...        |
| libsndfile1             | CVE-2024-50613      | MEDIUM   | fix_deferred | 1.2.0-1            |               | libsndfile: Reachable assertion in mpeg_l3_encoder_close           |
| libsqlite3-0            | CVE-2025-6965       | CRITICAL | affected     | 3.40.1-2+deb12u1   |               | sqlite: Integer Truncation in SQLite                               |
| libsqlite3-0            | CVE-2025-29088      | MEDIUM   | affected     | 3.40.1-2+deb12u1   |               | sqlite: Denial of Service in SQLite                                |
| libsqlite3-0            | CVE-2025-7458       | MEDIUM   | affected     | 3.40.1-2+deb12u1   |               | sqlite: SQLite integer overflow                                    |
| libsqlite3-0            | CVE-2021-45346      | LOW      | affected     | 3.40.1-2+deb12u1   |               | sqlite: crafted SQL query allows a malicious user to obtain...     |
| libssl3                 | CVE-2025-27587      | MEDIUM   | affected     | 3.0.17-1~deb12u1   |               | OpenSSL 3.0.0 through 3.3.2 on the PowerPC architecture is...      |
| libstdc++6              | CVE-2022-27943      | LOW      | affected     | 12.2.0-14+deb12u1  |               | binutils: libiberty/rust-demangle.c in GNU GCC 11.2 allows...    |
| libsystemd-shared       | CVE-2013-4392       | LOW      | affected     | 252.38-1~deb12u1   |               | systemd: TOCTOU race condition when updating file...               |
| libsystemd-shared       | CVE-2023-31437      | LOW      | affected     | 252.38-1~deb12u1   |               | An issue was discovered in systemd 253. An attacker can...         |
| libsystemd-shared       | CVE-2023-31438      | LOW      | affected     | 252.38-1~deb12u1   |               | An issue was discovered in systemd 253. An attacker can...         |
| libsystemd-shared       | CVE-2023-31439      | LOW      | affected     | 252.38-1~deb12u1   |               | An issue was discovered in systemd 253. An attacker can...         |
| libsystemd0             | CVE-2013-4392       | LOW      | affected     | 252.38-1~deb12u1   |               | systemd: TOCTOU race condition when updating file...               |
| libsystemd0             | CVE-2023-31437      | LOW      | affected     | 252.38-1~deb12u1   |               | An issue was discovered in systemd 253. An attacker can...         |
| libsystemd0             | CVE-2023-31438      | LOW      | affected     | 252.38-1~deb12u1   |               | An issue was discovered in systemd 253. An attacker can...         |
| libsystemd0             | CVE-2023-31439      | LOW      | affected     | 252.38-1~deb12u1   |               | An issue was discovered in systemd 253. An attacker can...         |
| libtiff6                | CVE-2023-52355      | HIGH     | will_not_fix | 4.5.0-6+deb12u2    |               | libtiff: TIFFRasterScanlineSize64 produce too-big size and...      |
| libtiff6                | CVE-2023-6277       | MEDIUM   | will_not_fix | 4.5.0-6+deb12u2    |               | libtiff: Out-of-memory in TIFFOpen via a craft file                |
| libtiff6                | CVE-2017-16232      | LOW      | affected     | 4.5.0-6+deb12u2    |               | libtiff: Memory leaks in tif_open.c, tif_lzw.c, and...             |
| libtiff6                | CVE-2017-17973      | LOW      | affected     | 4.5.0-6+deb12u2    |               | libtiff: heap-based use after free in...                           |
| libtiff6                | CVE-2017-5563       | LOW      | affected     | 4.5.0-6+deb12u2    |               | libtiff: Heap-buffer overflow in LZWEncode tif_lzw.c               |
| libtiff6                | CVE-2017-9117       | LOW      | affected     | 4.5.0-6+deb12u2    |               | libtiff: Heap-based buffer over-read in bmp2tiff                   |
| libtiff6                | CVE-2018-10126      | LOW      | affected     | 4.5.0-6+deb12u2    |               | libtiff: NULL pointer dereference in the jpeg_fdct_16x16...        |
| libtiff6                | CVE-2022-1210       | LOW      | affected     | 4.5.0-6+deb12u2    |               | tiff: Malicious file leads to a denial of service in TIFF...       |
| libtiff6                | CVE-2023-1916       | LOW      | affected     | 4.5.0-6+deb12u2    |               | libtiff: out-of-bounds read in extractImageSection() in...         |
| libtiff6                | CVE-2023-3164       | LOW      | affected     | 4.5.0-6+deb12u2    |               | libtiff: heap-buffer-overflow in extractImageSection()             |
| libtiff6                | CVE-2023-6228       | LOW      | affected     | 4.5.0-6+deb12u2    |               | libtiff: heap-based buffer overflow in cpStripToTile() in...       |
| libtiff6                | CVE-2025-8176       | LOW      | affected     | 4.5.0-6+deb12u2    |               | libtiff: LibTIFF Use-After-Free Vulnerability                      |
| libtiff6                | CVE-2025-8177       | LOW      | affected     | 4.5.0-6+deb12u2    |               | libtiff: LibTIFF Buffer Overflow                                   |
| libtinfo6               | CVE-2023-50495      | MEDIUM   | affected     | 6.4-4              |               | ncurses: segmentation fault via _nc_wrap_entry()                   |
| libtinfo6               | CVE-2025-6141       | LOW      | affected     | 6.4-4              |               | gnu-ncurses: ncurses Stack Buffer Overflow                         |
| libudev1                | CVE-2013-4392       | LOW      | affected     | 252.38-1~deb12u1   |               | systemd: TOCTOU race condition when updating file...               |
| libudev1                | CVE-2023-31437      | LOW      | affected     | 252.38-1~deb12u1   |               | An issue was discovered in systemd 253. An attacker can...         |
| libudev1                | CVE-2023-31438      | LOW      | affected     | 252.38-1~deb12u1   |               | An issue was discovered in systemd 253. An attacker can...         |
| libudev1                | CVE-2023-31439      | LOW      | affected     | 252.38-1~deb12u1   |               | An issue was discovered in systemd 253. An attacker can...         |
| libuuid1                | CVE-2022-0563       | LOW      | affected     | 2.38.1-5+deb12u3   |               | util-linux: partial disclosure of arbitrary files in chfn...       |
| libxml2                 | CVE-2025-49794      | CRITICAL | fix_deferred | 2.9.14+dfsg-1.3~deb12u2 |               | libxml: Heap use after free (UAF) leads to Denial of service...    |
| libxml2                 | CVE-2025-49796      | CRITICAL | affected     | 2.9.14+dfsg-1.3~deb12u2 |               | libxml: Type confusion leads to Denial of service (DoS)            |
| libxml2                 | CVE-2025-6021       | HIGH     | affected     | 2.9.14+dfsg-1.3~deb12u2 |               | libxml2: Integer Overflow in xmlBuildQName() Leads to Stack...     |
| libxml2                 | CVE-2025-6170       | LOW      | affected     | 2.9.14+dfsg-1.3~deb12u2 |               | libxml2: Stack Buffer Overflow in xmllint Interactive Shell...     |
| libxslt1.1              | CVE-2025-7424       | HIGH     | affected     | 1.1.35-1+deb12u1   |               | libxslt: Type confusion in xmlNode.psvi between stylesheet...      |
| libxslt1.1              | CVE-2025-7425       | HIGH     | affected     | 1.1.35-1+deb12u1   |               | libxslt: Heap Use-After-Free in libxslt caused by atype...         |
| libxslt1.1              | CVE-2015-9019       | LOW      | affected     | 1.1.35-1+deb12u1   |               | libxslt: math.random() in xslt uses unseeded randomness            |
| libxslt1.1              | CVE-2023-40403      | LOW      | affected     | 1.1.35-1+deb12u1   |               | libxslt: Processing web content may disclose sensitive...          |
| login                   | CVE-2007-5686       | LOW      | affected     | 1:4.13+dfsg1-1+deb12u1 |               | initscripts in rPath Linux 1 sets insecure permissions for...      |
| login                   | CVE-2024-56433      | LOW      | affected     | 1:4.13+dfsg1-1+deb12u1 |               | shadow-utils: Default subordinate ID configuration in...           |
| login                   | TEMP-0628843-DBAD28 | LOW      | affected     | 1:4.13+dfsg1-1+deb12u1 |               | [more related to CVE-2005-4890]                                    |
| mount                   | CVE-2022-0563       | LOW      | affected     | 2.38.1-5+deb12u3   |               | util-linux: partial disclosure of arbitrary files in chfn...       |
| ncurses-base            | CVE-2023-50495      | MEDIUM   | affected     | 6.4-4              |               | ncurses: segmentation fault via _nc_wrap_entry()                   |
| ncurses-base            | CVE-2025-6141       | LOW      | affected     | 6.4-4              |               | gnu-ncurses: ncurses Stack Buffer Overflow                         |
| ncurses-bin             | CVE-2023-50495      | MEDIUM   | affected     | 6.4-4              |               | ncurses: segmentation fault via _nc_wrap_entry()                   |
| ncurses-bin             | CVE-2025-6141       | LOW      | affected     | 6.4-4              |               | gnu-ncurses: ncurses Stack Buffer Overflow                         |
| passwd                  | CVE-2007-5686       | LOW      | affected     | 1:4.13+dfsg1-1+deb12u1 |               | initscripts in rPath Linux 1 sets insecure permissions for...      |
| passwd                  | CVE-2024-56433      | LOW      | affected     | 1:4.13+dfsg1-1+deb12u1 |               | shadow-utils: Default subordinate ID configuration in...           |
| passwd                  | TEMP-0628843-DBAD28 | LOW      | affected     | 1:4.13+dfsg1-1+deb12u1 |               | [more related to CVE-2005-4890]                                    |
| perl-base               | CVE-2023-31484      | HIGH     | affected     | 5.36.0-7+deb12u2   |               | perl: CPAN.pm does not verify TLS certificates when...             |
| perl-base               | CVE-2025-40909      | MEDIUM   | affected     | 5.36.0-7+deb12u2   |               | perl: Perl threads have a working directory race condition...      |
| perl-base               | CVE-2011-4116       | LOW      | affected     | 5.36.0-7+deb12u2   |               | perl: File:: Temp insecure temporary file handling                 |
| perl-base               | CVE-2023-31486      | LOW      | affected     | 5.36.0-7+deb12u2   |               | http-tiny: insecure TLS cert default                               |
| procps                  | CVE-2023-4016       | LOW      | affected     | 2:4.0.2-3          |               | procps: ps buffer overflow                                         |
| systemd                 | CVE-2013-4392       | LOW      | affected     | 252.38-1~deb12u1   |               | systemd: TOCTOU race condition when updating file...               |
| systemd                 | CVE-2023-31437      | LOW      | affected     | 252.38-1~deb12u1   |               | An issue was discovered in systemd 253. An attacker can...         |
| systemd                 | CVE-2023-31438      | LOW      | affected     | 252.38-1~deb12u1   |               | An issue was discovered in systemd 253. An attacker can...         |
| systemd                 | CVE-2023-31439      | LOW      | affected     | 252.38-1~deb12u1   |               | An issue was discovered in systemd 253. An attacker can...         |
| systemd-sysv            | CVE-2013-4392       | LOW      | affected     | 252.38-1~deb12u1   |               | systemd: TOCTOU race condition when updating file...               |
| systemd-sysv            | CVE-2023-31437      | LOW      | affected     | 252.38-1~deb12u1   |               | An issue was discovered in systemd 253. An attacker can...         |
| systemd-sysv            | CVE-2023-31438      | LOW      | affected     | 252.38-1~deb12u1   |               | An issue was discovered in systemd 253. An attacker can...         |
| systemd-sysv            | CVE-2023-31439      | LOW      | affected     | 252.38-1~deb12u1   |               | An issue was discovered in systemd 253. An attacker can...         |


## Go Binary Vulnerabilities

| Library             | Vulnerability  | Severity | Status | Installed Version | Fixed Version | Title                                                     |
| ------------------- | -------------- | -------- | ------ | ----------------- | ------------- | --------------------------------------------------------- |
| golang.org/x/crypto | CVE-2025-22869 | HIGH     | fixed  | v0.31.0           | 0.35.0        | golang.org/x/crypto/ssh: Denial of Service in the Key...  |
| golang.org/x/net    | CVE-2025-22870 | MEDIUM   | fixed  | v0.33.0           | 0.36.0        | golang.org/x/net/proxy: golang.org/x/net/http/httpproxy:.. |
| golang.org/x/net    | CVE-2025-22872 | MEDIUM   | fixed  | v0.33.0           | 0.38.0        | golang.org/x/net/html: Incorrect Neutralization of Input... |
| golang.org/x/oauth2 | CVE-2025-22868 | HIGH     | fixed  | v0.24.0           | 0.27.0        | golang.org/x/oauth2/jws: Unexpected memory consumption... |
