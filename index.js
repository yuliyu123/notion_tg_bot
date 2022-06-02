const { Client } = require("@notionhq/client")
const TelegramBot = require('node-telegram-bot-api');
const dotenv = require("dotenv")

dotenv.config()
const notion = new Client({ auth: process.env.NOTION_KEY })
const databaseId = process.env.NOTION_DATABASE_ID
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });


/**
 * Local map to store  GitHub issue ID to its Notion pageId.
 * { [issueId: string]: string }
 */
const taskPageIdToStatusMap = {}

setInitialTaskPageIdToStatusMap().then(() => {
    setInterval(findAndSendToTgForUpdatedTasks, 5000)
});

/**
 * Get and set the initial data store with issues currently in the database.
 */
async function setInitialTaskPageIdToStatusMap() {
    const currentTasks = await getTasksFromNotionDatabase();
    for (const { pageId, last_edited_time } of currentTasks) {
        taskPageIdToStatusMap[pageId] = last_edited_time
    }
}

async function findAndSendToTgForUpdatedTasks() {
    // Get the tasks currently in the database.
    console.log("\nFetching tasks from Notion DB...")
    const currentTasks = await getTasksFromNotionDatabase();

    // Return any tasks that have had their status updated.
    const updatedTasks = findUpdatedTasks(currentTasks)

    if (updatedTasks.length == 0) {
        console.log(`Found 0 created or updated tasks.`);
        return;
    }
    console.log(`Found ${updatedTasks.length} created or updated tasks.`);

    // For each updated task, update taskPageIdToStatusMap and send an email notification.
    syncTasksToTgChannel(updatedTasks);
}


/**
 * Gets pages from the Notion database.
 *
 * @returns {Promise<Array<{ pageId: string, issueNumber: number }>>}
 */
async function getTasksFromNotionDatabase() {
    const pages = []
    let cursor = undefined

    while (true) {
        const { results, next_cursor } = await notion.databases.query({
            database_id: databaseId,
            start_cursor: cursor,
        })
        pages.push(...results)
        if (!next_cursor) {
            break
        }
        cursor = next_cursor
    }
    console.log(`${pages.length} pages successfully fetched.`)
    return pages.map(page => {
        const last_edited_time = page.last_edited_time
        console.log(`pages page.last_edited_time fetched.`, page.last_edited_time)
        const title = page.properties["Name"].title
            .map(({ plain_text }) => plain_text)
            .join("")
        return {
            pageId: page.id,
            last_edited_time,
            title,
        }
    })
}

async function syncTasksToTgChannel(tasks) {
    for (const task of tasks) {
        syncTaskToTgChannel(task);
    }
}

async function syncTaskToTgChannel(task) {
    const msg = "task title: " + task.title + ",\n" + "last_edited_time: " + task.last_edited_time;
    console.log("syncTaskToTgChannel, msg: ", msg);
    bot.sendMessage(process.env.CHANNEL_ID, msg);
}

function findUpdatedTasks(currentTasks) {
    return currentTasks.filter(currentTask => {
        return getPreviousTaskEditTime(currentTask);
    })
}

function getPreviousTaskEditTime({ pageId, last_edited_time }) {
    // If this task hasn't been seen before or updated, add to local pageId to status map.
    if (!taskPageIdToStatusMap[pageId] || taskPageIdToStatusMap[pageId] != last_edited_time) {
        taskPageIdToStatusMap[pageId] = last_edited_time
        return true
    }
}
