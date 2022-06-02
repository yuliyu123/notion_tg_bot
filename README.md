# Sample Integration: Notion Tasks to Telegram

## About the Integration

This Notion integration syn Notion tasks from a Notion Database to Telegram. This integration was built using this [database template](https://www.notion.so/de6cde4ae5a44a058a3699e646c60056?v=9b0e0c58a0ab47279b1813ef7ba54160). Added or Updated made tasks in the Notion database will push to telegram. For an example which allows you to take actions based on changes in a database.

## Running Locally

### 1. Setup your local project

```zsh
# Clone this repository locally
git clone https://github.com/yuliyu123/notion_tg_bot.git

# Install the dependencies
npm install
```

### 2. Set your environment variables in a `.env` file

```zsh
NOTION_KEY=<your-notion-api-key>
NOTION_DATABASE_ID=<notion-database-id>
BOT_TOKEN=<telegram bot token>
CHANNEL_ID=<destination chat id>
```

You can create your Notion API key [here](https://www.notion.com/my-integrations).

### 3. Run code

```zsh
node index.js
```
