# Quick Start Guide

Welcome! If you just want to get the translation tool running quickly without worrying about the technical details, follow these simple steps.

## Step 1: Start Your AI
1. Open your local AI program (like **LM Studio**).
2. Load a model (we recommend `Qwen2.5-3B-Instruct` or similar).
3. Start the **Local Server** in your AI program. (Make sure it's running on port `1234`, which is the default).

## Step 2: Open the Translation Tool
You cannot just double-click the `index.html` file—it needs a simple server to load its configuration files properly. 

### Windows / Mac / Linux (Easiest Way):
1. Open a terminal or command prompt.
2. Navigate to the folder where you downloaded this tool.
3. Type the following command and press Enter:
   ```bash
   python3 -m http.server 8000
   ```
   *(If you don't have Python, any local web server will work, like double-clicking `index.html` using the VS Code "Live Server" extension).*
4. Open your web browser and go to: `http://localhost:8000/index.html`

## Step 3: Connect and Translate
1. At the top of the webpage, click the **Refresh (↻)** button next to the model dropdown.
2. Select your AI model from the list.
3. Click **Choose Files** and upload your Japanese game script files (usually found in your game's `data/scripts/data` folder).
4. Select a script from the list on the left.
5. Edit the summary and raw context windows in top bar if needed (defualt to 0 - fine tune it for the model you are using).
6. Click **Run Translation** on the right side to start translating!

## Step 4: Saving Your Work
When you are done reviewing or translating, click **Export** to download the edited JSON/JS game script files.

## Step 5: Advanced Fetures
1. This application has a line by line translation toll if you want more fine control and editing of the translation.

---
*For more advanced features, customizing prompts, or troubleshooting, please see the main `README.md` file.*
