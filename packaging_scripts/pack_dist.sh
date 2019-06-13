#!/bin/bash
# A conviniance script to pack the release distrubutions into zip files.
# This is a linux bash script using 7zip.
# You can also just create the zip files maunually, nothing fancy going on here.
VERSION=1.1.0
mkdir ./../dist/packaged
cd ./../dist/Eve\ Fleet\ Simulator-win32-x64
7z a -tzip -mx=9 ./../packaged/Eve\ Fleet\ Simulator-$VERSION-win.zip ./*
cd ./../Eve\ Fleet\ Simulator-darwin-x64
7z a -tzip -mx=9 ./../packaged/Eve\ Fleet\ Simulator-$VERSION-mac.zip ./*
cd ./../Eve\ Fleet\ Simulator-linux-x64
7z a -tzip -mx=9 ./../packaged/Eve\ Fleet\ Simulator-$VERSION-linux.zip ./*
