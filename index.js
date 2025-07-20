if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// Require the necessary discord.js classes
const fs = require("node:fs");
const path = require("node:path");
const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { initializeDatabase, createGoal } = require("./database");
const token = process.env.DISCORD_TOKEN;

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

// Store temporary goal data during creation process
const goalCreationData = new Map();

// Goal creation data is now handled by database.js

// Handle button interactions
async function handleButtonInteraction(interaction) {
  if (interaction.customId === "input_goal_name") {
    const modal = new ModalBuilder()
      .setCustomId("goal_name_modal")
      .setTitle("建立新目標");

    const goalNameInput = new TextInputBuilder()
      .setCustomId("goal_name_input")
      .setLabel("目標名稱")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder("請輸入您的目標名稱...");

    const row = new ActionRowBuilder().addComponents(goalNameInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
  } else if (interaction.customId === "input_goal_description") {
    const modal = new ModalBuilder()
      .setCustomId("goal_description_modal")
      .setTitle("新增目標描述");

    const goalDescriptionInput = new TextInputBuilder()
      .setCustomId("goal_description_input")
      .setLabel("目標描述")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setPlaceholder("請輸入目標的詳細描述（可選）...");

    const row = new ActionRowBuilder().addComponents(goalDescriptionInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
  } else if (interaction.customId === "finish_goal_creation") {
    const userId = interaction.user.id;
    const goalData = goalCreationData.get(userId);

    if (goalData) {
      // Create goal with unique ID
      const goal = await createGoal(userId, goalData.name, goalData.description);
      
      // Clean up temporary data
      goalCreationData.delete(userId);

      await interaction.update({
        content: `🎉 **目標建立成功！**\n\n` +
                `📋 目標名稱：**${goal.name}**\n` +
                `🆔 目標 ID：\`${goal.id}\`\n` +
                `📝 描述：${goal.description || "無"}\n` +
                `📅 建立時間：${new Date(goal.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}`,
        components: [],
      });
    }
  }
}

// Handle modal interactions
async function handleModalInteraction(interaction) {
  const userId = interaction.user.id;

  if (interaction.customId === "goal_name_modal") {
    const goalName = interaction.fields.getTextInputValue("goal_name_input");

    // Store goal name temporarily
    goalCreationData.set(userId, { name: goalName });

    // Create description button
    const descriptionButton = new ButtonBuilder()
      .setCustomId("input_goal_description")
      .setLabel("新增描述")
      .setStyle(ButtonStyle.Secondary);

    const finishButton = new ButtonBuilder()
      .setCustomId("finish_goal_creation")
      .setLabel("完成建立")
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(descriptionButton, finishButton);

    await interaction.update({
      content: `✅ 目標名稱：**${goalName}**\n\n您可以選擇新增描述或直接完成建立：`,
      components: [row],
    });
  } else if (interaction.customId === "goal_description_modal") {
    const goalDescription = interaction.fields.getTextInputValue("goal_description_input");
    const currentData = goalCreationData.get(userId);

    if (currentData) {
      currentData.description = goalDescription;
      goalCreationData.set(userId, currentData);

      const finishButton = new ButtonBuilder()
        .setCustomId("finish_goal_creation")
        .setLabel("完成建立")
        .setStyle(ButtonStyle.Success);

      const row = new ActionRowBuilder().addComponents(finishButton);

      await interaction.update({
        content: `✅ 目標名稱：**${currentData.name}**\n📝 目標描述：${goalDescription}\n\n點擊完成建立：`,
        components: [row],
      });
    }
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  // Handle slash commands
  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
    return;
  }

  // Handle button interactions
  if (interaction.isButton()) {
    await handleButtonInteraction(interaction);
    return;
  }

  // Handle modal interactions
  if (interaction.isModalSubmit()) {
    await handleModalInteraction(interaction);
    return;
  }
});

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  
  // Initialize database
  try {
    await initializeDatabase();
    console.log('Database connection established and tables initialized');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
});

// Log in to Discord with your client's token
client.login(token);
