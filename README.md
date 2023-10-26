# Chrome-macOS-Screen-Saver-Tab

Transform your Chrome's new tab page by showcasing macOS's aerial screen saver videos. To achieve this, start by setting up a local HTTP server.

## Features

This Chrome extension delivers the following capabilities:

1. 🎥 Enhance your Chrome startup page and new tab view with breathtaking 4K videos, taken directly from macOS' native aerial screen savers.
2. 🌦️ Receive up-to-the-minute weather updates accompanied by a 3-day forecast.
3. 💬 Engage with the web version of ChatGPT: simply type into the search box and begin your conversation.
4. 🌟 Discover motivational quotes that change randomly with each new tab.

P.S. If you're not using macOS, fear not! This extension remains compatible, though you'll need to secure the video source independently. 🛠️

![Screenshot](screenshot.png)
![Screenshot](screenshot.gif)

## Step 1: Acquire Screen Saver Videos via System Preferences

Ensure you're connected to Internet and proceed to open System Preferences.

Journey to the "Screensaver" settings within System Preferences. Within the aerial screensaver category, select the videos you wish to download. Bear in mind, the file size of each video spans between 500MB to 1GB; patience is required during the download process. Occasionally, downloads might experience interruptions, necessitating multiple attempts.

![Screenshot](systempreferrence.jpg)

To conserve storage, it's advised against downloading the entire video collection.

## Step 2: Initiate a Local Server

1. Retrieve the `videoserver.conf` file from the code repository.
2. Store it in a directory that you intend to keep intact. For demonstration, let's use:

    ```shell
    /path/to/your/videoserver.conf
    ```

3. Launch the terminal application.
4. Make a backup of your apache config file utilizing the command below:

    ```shell
    cp /private/etc/apache2/httpd.conf /private/etc/apache2/httpd.conf.bk
    ```

5. Next, ensure to replace the path placeholder with your actual path:

    ```shell
    echo -e "\nInclude /path/to/your/videoserver.conf" | tee -a /private/etc/apache2/httpd.conf
    ```

6. To activate the changes, restart Apache:

    ```shell
    apachectl restart
    ```

Your local backend service should now be operational, with port 18000 as its designated listening port.

## Step 3: Deploy the Extension

1. Download the source code.
2. Ensure Chrome's Developer Mode is activated.
3. Access the Extensions dashboard.
4. Unzip the code into a directory that you're unlikely to modify (since unpacked extensions don't reside in Chrome's dedicated storage but operate from the designated directory).
5. Within Chrome's Extensions dashboard, select "Load Unpacked Extension." Navigate to and open the `src` directory from the code folder you unzipped.
6. Revel in the beauty of macOS screen saver videos every time you open a new tab in Chrome.
