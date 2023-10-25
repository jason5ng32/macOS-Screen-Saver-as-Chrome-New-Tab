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

![Screenshot](systempreferrence.jpg)

It's not recommended to download all the videos, as they can take up a significant amount of space.

Once downloaded, the videos will be saved in the following directory:

```shell
/Library/Application Support/com.apple.idleassetsd/Customer/4KSDR240FPS
```

This directory will be used later.

You don't have to download all of them, as they are too large to download conveniently.

## Step 2: Start a local server

1. Download the videoserver.conf file from the code repository.
2. Save it to a directory that you won't easily delete, let's assume the directory is

    ```shell
    /path/to/your/videoserver.conf
    ```

3. Open terminal app
4. Backup your apache config file with the following shell:

    ```shell
    sudo cp /private/etc/apache2/httpd.conf /private/etc/apache2/httpd.conf.bk
    ```

5. And then (❗️❗️❗️REMEMBER TO REPLACE THE PATH WITH YOURS):

    ```shell
    echo -e "\nInclude /path/to/your/videoserver.conf" | sudo tee -a /private/etc/apache2/httpd.conf
    ```

6. Restart Apache:

    ```shell
    sudo apachectl restart
    ```

Now, the local backend service is up and running and listening on port 18000.

## Step 3: Install this extension

1. Download the code.
2. Make sure Chrome has Developer Mode enabled.
3. Go to the Extensions interface.
4. Extract the code into a directory that you won't easily tamper with (because unpacked extensions are not stored in Chrome's storage; they run from the specified directory each time).
5. In Chrome's Extensions interface, click "Load Unpacked Extension." Then, open the `src`  directory in the code folder you had extracted.
6. Now you can enjoy the macOS screen saver videos as Chrome's new tab.
