# Chrome-macOS-Screen-Saver-Tab

Replace new tab with macOS's screen saver videos. You need to deploy local http server first.

## Step 1: Download screen saver videos in system settings

Fistly, connect to WiFi and open System Preferences.

Open the "Screensaver" settings in System Preferences, and in the aerial screensaver videos, click on the ones you want to download. The size of each video varies from 500MB to 1GB, so you'll need to wait for the download to complete. Sometimes the download may fail and multiple retries may be necessary.

It's not recommended to download all the videos as they really take up a lot of space.

Once downloaded, the videos will be saved in:

```
/Library/Application Support/com.apple.idleassetsd/Customer/4KSDR240FPS
```

This directory will be used later.

You don't have to download all of them, cause they are too big to download.

## Step 2: Start a local server

macOS comes with Apache pre-installed, but starting from an unknown version, it can only be run through the terminal. First, modify the `httpd.conf` file. Open `/private/etc/apache2/httpd.conf`, and add or modify the following fields:

```
<IfDefine SERVER_APP_HAS_DEFAULT_PORTS>
    Listen 18080
</IfDefine>
<IfDefine !SERVER_APP_HAS_DEFAULT_PORTS>
    Listen 18000
</IfDefine>
```
Add Directory Mapping

```
Alias /videos "/Library/Application Support/com.apple.idleassetsd/Customer/4KSDR240FPS"

<Directory "/Library/Application Support/com.apple.idleassetsd/Customer/4KSDR240FPS">
    Options +Indexes
    Require all granted
    Header set Access-Control-Allow-Origin "*"
</Directory>
```


At the beginning of the file, make sure the following exists:

```shell
LoadModule headers_module libexec/apache2/mod_headers.so
```


Then open the terminal and run:

```
apachectl start
```

Similarly, when the configuration changes, run:

```shell
apachectl restart
```

Now, the local backend service is up and running and listening to port 18000.

## Step 3: Install this extension

1. First, install [this extension](https://chrome.google.com/webstore/detail/chatgpt-deeplink/bmkbpmkcppdmkdbpihmijgeilchgeapo?snuoi). Ask ChatGPT will only work if this extension is installed and enabled. There is a delay setting in this extension; it is recommended to set it to 2000 (In reality, I could merge this extension into my own, but there's no need to. Respecting copyright is important).
2. Make sure Chrome has Developer Mode enabled.
3. Go to the Extensions interface.
4. Extract the code above in a directory that you won't easily tamper with (because unpacked extensions aren't saved in Chrome's storage; they run from the specified directory every time).
5. In Chrome's Extensions interface, click "Load Unpacked Extension."
6. Now you can enjoy the macOS screen saver video as Chrome's new tab.
