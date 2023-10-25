# Chrome-macOS-Screen-Saver-Tab

Replace Chrome's new tab with macOS's screen saver videos. You need to first deploy a local HTTP server.

## Features

This Chrome extension offers the following features:

1. 🎥 Elevate your Chrome start page and new tab experience with stunning 4K videos, sourced from macOS' built-in aerial screen savers.
2. 🌦️ Get real-time weather updates along with a 3-day forecast.
3. 💬 Access ChatGPT web version directly by entering text into the extension and start chatting.
4. 🌟 Enjoy randomly displayed motivational quotes.

P.S. If you're not a macOS user, no worries! You can still use this extension, but you'll need to sort out the video source on your own. 🛠️

![Screenshot](screenshot.png)
![Screenshot](screenshot.gif)

## Step 1: Download screen saver videos in system preferences

First, connect to Wi-Fi and open System Preferences.

Navigate to the "Screensaver" settings in System Preferences. In the aerial screensaver section, click on the videos you want to download. The size of each video varies from 500MB to 1GB, so you'll need to wait for the download to complete. Sometimes the download may fail, and multiple retries may be necessary.

It's not recommended to download all the videos, as they can take up a significant amount of space.

Once downloaded, the videos will be saved in the following directory:

```
/Library/Application Support/com.apple.idleassetsd/Customer/4KSDR240FPS
```

This directory will be used later.

You don't have to download all of them, as they are too large to download conveniently.

## Step 2: Start a local server

Below, I will use the system's built-in Apache as an example to illustrate how to deploy the server-side. You can also use other programs, such as Nginx, but I strongly recommend using Apache because it comes pre-installed with the system.

macOS comes with Apache pre-installed, but starting from an unspecified version, it can only be run through the terminal. First, modify the `httpd.conf` file. Open `/private/etc/apache2/httpd.conf` and add or modify the following fields:

```
<IfDefine SERVER_APP_HAS_DEFAULT_PORTS>
    Listen 18080
</IfDefine>
<IfDefine !SERVER_APP_HAS_DEFAULT_PORTS>
    Listen 18000
</IfDefine>
```

It's not recommended to use the default port 80, as other web server applications may use it.

Add Directory Mapping

```
Alias /videos "/Library/Application Support/com.apple.idleassetsd/Customer/4KSDR240FPS"

<Directory "/Library/Application Support/com.apple.idleassetsd/Customer/4KSDR240FPS">
    Options +Indexes
    Require all granted
    Header set Access-Control-Allow-Origin "*"
</Directory>
```

At the beginning of the file, make sure the following line exists:

```
LoadModule headers_module libexec/apache2/mod_headers.so
```

Then open the terminal and run:

```
sudo apachectl start
```

Similarly, when the configuration changes, run:

```
sudo apachectl restart
```

Now, the local backend service is up and running and listening on port 18000.

## Step 3: Install this extension

1. Download the code.
2. Make sure Chrome has Developer Mode enabled.
3. Go to the Extensions interface.
4. Extract the code into a directory that you won't easily tamper with (because unpacked extensions are not stored in Chrome's storage; they run from the specified directory each time).
5. In Chrome's Extensions interface, click "Load Unpacked Extension."
6. Now you can enjoy the macOS screen saver videos as Chrome's new tab.
