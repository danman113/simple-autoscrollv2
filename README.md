# simple-autoscroll

An extension that adds the ability to automatically scroll through long pages.

# Setup
Simple Autoscroll uses typescript, and requires compilation before chrome can use it:

1. Install Node.js and npm (Node Package Manager) on your machine if you haven't already. You can download Node.js from the official website: https://nodejs.org

2. Open a terminal or command prompt and navigate to the root directory of your project.

3. Install project dependencies by running the following command:

```bash
npm install
```

4. Build the project using Vite by running the following command:

```bash
npm run build
```

This will generate the necessary files in the `scripts/` directory, including the JavaScript files for content and background scripts, and the root HTML file.

5. Open Google Chrome and go to the extensions page by typing `chrome://extensions/` in the address bar.

6. In the top-right corner, make sure the "Developer mode" toggle is enabled.

7. Click on the "Load unpacked" button. A file dialog will appear.

8. Navigate to the `simple-autoscrollv2` directory. and click "open".

10. The extension should now be installed. You should see it listed on the extensions page.

11. If you make changes to the source files, you can rebuild it using step 4 and then click the "Reload" button under your extension on the extensions page to apply the changes.
