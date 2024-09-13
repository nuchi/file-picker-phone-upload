# File Picker Phone Upload

Sometimes I'm on my computer and need to upload a file which lives on my phone. This extension intercepts the file picker, and if a file named (exact match) `Phone Upload` is chosen, then the extension opens an iframe to https://snapdrop.net (no affiliation) and waits to receive a file.

At that point, visit https://snapdrop.net from your phone or other device **on the same network** and send a file to your computer. It will automatically be substituted into the file picker.

On macos, simply create an empty file named "Phone Upload" and put it anywhere you like, then move it into the "Favorites" tab (command+drag it) in the Finder. It will still be accessible through the favorites tab, even if a website's file picker is restricted to images/video/whatever. I haven't tested on Linux or Windows, so I don't know if that will still work there.
