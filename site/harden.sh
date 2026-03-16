#!/bin/bash

echo "=== Enabling macOS Firewall ==="
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setstealthmode on
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setallowsigned enable

echo ""
echo "=== Adding Tracker Blocklist to /etc/hosts ==="
sudo bash -c 'cat >> /etc/hosts << "HOSTEOF"

# --- Tracking & Telemetry Blocklist ---
0.0.0.0 facebook.com
0.0.0.0 www.facebook.com
0.0.0.0 pixel.facebook.com
0.0.0.0 connect.facebook.net
0.0.0.0 graph.facebook.com
0.0.0.0 ad.doubleclick.net
0.0.0.0 pagead2.googlesyndication.com
0.0.0.0 googleadservices.com
0.0.0.0 www.googleadservices.com
0.0.0.0 analytics.google.com
0.0.0.0 adservice.google.com
0.0.0.0 tracking.mixpanel.com
0.0.0.0 cdn.mxpnl.com
0.0.0.0 ads.twitter.com
0.0.0.0 static.ads-twitter.com
0.0.0.0 analytics.twitter.com
0.0.0.0 t.co
0.0.0.0 ads.linkedin.com
0.0.0.0 snap.licdn.com
0.0.0.0 tr.snapchat.com
0.0.0.0 sc-analytics.appspot.com
0.0.0.0 bat.bing.com
0.0.0.0 telemetry.microsoft.com
0.0.0.0 vortex.data.microsoft.com
0.0.0.0 settings-win.data.microsoft.com
0.0.0.0 amplitude.com
0.0.0.0 api.amplitude.com
0.0.0.0 cdn.segment.com
0.0.0.0 api.segment.io
0.0.0.0 crashlytics.com
0.0.0.0 firebase-settings.crashlytics.com
# --- End Blocklist ---
HOSTEOF'

echo ""
echo "=== Flushing DNS Cache ==="
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

echo ""
echo "=== Done ==="
echo "Firewall: ON + Stealth Mode"
echo "Trackers: Blocked"
echo "DNS Cache: Flushed"
echo ""
echo "You can delete this script now: rm ~/Desktop/harden.sh"
