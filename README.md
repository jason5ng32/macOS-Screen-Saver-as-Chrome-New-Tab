# Chrome-macOS-Screen-Saver-Tab

Replace Chrome's new tab with macOS's screen saver videos. You need to first deploy a local HTTP server.

![Screenshot](screenshot.png)

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

1. First, install [this extension](https://chrome.google.com/webstore/detail/chatgpt-deeplink/bmkbpmkcppdmkdbpihmijgeilchgeapo?snuoi). ChatGPT will only work if this extension is installed and enabled. There is a delay setting in this extension; it's recommended to set it to 2000. (In reality, I could merge this extension into my own, but there's no need to. Respecting copyright is important).
2. Make sure Chrome has Developer Mode enabled.
3. Go to the Extensions interface.
4. Download the code and extract them into a directory that you won't easily tamper with (because unpacked extensions are not stored in Chrome's storage; they run from the specified directory each time).
5. In Chrome's Extensions interface, click "Load Unpacked Extension."
6. Now you can enjoy the macOS screen saver videos as Chrome's new tab.
