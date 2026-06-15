# JobVision Telegram Notification Bot (Google Apps Script)

A robust Google Apps Script bot that fetches notifications from the JobVision API and sends them to Telegram in real time.  
It includes retry logic, deduplication, persistent storage, and automatic error reporting.



---

## 🚀 Features

- Fetches latest notifications from JobVision API
- Sends notifications directly to Telegram
- Prevents duplicate messages using persistent ID storage
- Automatic retry system with exponential backoff
- Safe Telegram sending with fallback retries
- Fatal error reporting to admin via Telegram
- Fully serverless (runs on Google Apps Script)
- Simple trigger-based execution

---

## 📦 How It Works

1. `checkNotifications()` runs on a schedule (trigger)
2. Fetches latest notifications from JobVision API
3. Compares with stored notification IDs
4. Filters only new notifications
5. Sends them to Telegram
6. Stores processed IDs in Script Properties
7. Handles errors and retries automatically

---

## ⚙️ Setup Instructions

### 1. Create Telegram Bot
- Open Telegram
- Search for BotFather
- Create a bot using `/newbot`
- Copy your BOT TOKEN

---

### 2. Get Chat ID
You can get it using:
- @userinfobot or
- Sending a message to your bot and checking updates via API

---

### 3. Add Script Properties (IMPORTANT)

Open your Apps Script project settings:
[GAS](https://script.google.com/home/projects)

Then go to:
Project Settings (⚙️) → Script Properties → Add Property

Add these keys:

BOT_TOKEN
→ Get from: [BotFather](https://t.me/BotFather)

CHAT_ID
→ Get from: [UserInfoBot](https://t.me/userinfobot)


JOBVISION_TOKEN
→ Your JobVision API token (from your account/dashboard) // check step 3.1 for more information

Make sure all values are set correctly before running the script.

### 3.1 How To Get JOB VISION TOKEN
 1. go to [JobVISION](https://jobvision.ir)
 and login to your account
 2. with  ` CTRL + SHIFT + I ` open Incpects elements 
 3. Go to Network tab 
 4. Put the filter on Fetch/XHR
 5. find the GetContactInfo request
 6. In the headers you will find authorization ( we need this in order for app to work with the job vision API)

>[!WARNING]
> Each time you login into JobVision the authentication token will be reset and you need to set it again

> [!TIP]
> we don't need the Bearer in the token just the ey....
    
    

### 4. Deploy Script
Paste the code into Google Apps Script editor.

---



### 5. Set Up Trigger (Required)

This project does not run continuously on its own.
You must create a time-driven trigger for automatic execution.

-------------------------------
How to create the trigger
-------------------------------

1. Open your Google Apps Script project
2. Go to the left panel → "Triggers" (clock icon)
3. Click "Add Trigger"
4. Configure it as follows:

Function to run:
checkNotifications

Deployment:
Head

Event source:
Time-driven

Type of time-based trigger:
Choose one:

- Every 1 minute   → real-time updates (recommended)
- Every 5 minutes   → balanced performance
- Every 10 minutes  → lower quota usage

-------------------------------
Recommended configuration
-------------------------------

If this is a production bot:
→ Every 1–5 minutes is ideal

If you're testing:
→ Every 1 minute

-------------------------------
Failure settings
-------------------------------

Set:
"Notify me immediately"

This ensures you get alerted if the script stops working.

-------------------------------
After setup
-------------------------------

Once enabled:
- checkNotifications() runs automatically
- new notifications are sent to Telegram instantly
- duplicates are automatically filtered
- errors are reported to your admin chat


---

## 🔐 Security

- Never hardcode tokens in code
- Always use Script Properties
- Keep JOBVISION_TOKEN private (API access key)

---

## 🔁 Retry System

### API Retry
- Up to 3 attempts
- Backoff delay increases each attempt

### Telegram Retry
- Up to 2 attempts per message
- Automatic delay between retries

---

## 📊 Data Handling

- Stores last 500 notification IDs
- Prevents duplicate messages
- Automatically trims old records

---


## ❗ Error Handling

If all retries fail:
- Error is logged
- Admin receives Telegram alert:

🚨 JobVision Bot Failed

Time: `timestamp`

Error: `error message`

## 🧪 Debug Functions

### Test Telegram
- testTelegram()

Sends a test message to confirm bot is working.


### Reset Cache
- resetNotificationsCache()

Clears stored notification history (use carefully).


## 🧠 Configuration Overview

CONFIG = {
  BOT_TOKEN,
  CHAT_ID,
  JOBVISION_TOKEN
}

All values are loaded securely from Script Properties.

---

## ⚡ API Endpoint

https://candidateapi.jobvision.ir/api/v1/Notifications/GetListOfNotifications


Method: POST  
Auth: Bearer token (`JOBVISION_TOKEN`)

## 👤 Author

stoic  
Website : [Stoic](https://candidateapi.jobvision.ir/api/v1/Notifications/GetListOfNotifications
)

---
