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
const { initializeDatabase, createGoal, getGoalsByUserPaginated, createGoalReport, getGoalById } = require("./database");
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

// Helper functions for goal list display
function formatGoalsList(result) {
  const { goals, currentPage, totalPages, totalCount } = result;
  
  let content = `📋 **您的目標列表** (第 ${currentPage} 頁，共 ${totalPages} 頁)\n`;
  content += `總共 ${totalCount} 個目標\n\n`;

  goals.forEach((goal, index) => {
    const goalNumber = (currentPage - 1) * 10 + index + 1;
    content += `**${goalNumber}.** 📋 **${goal.name}**\n`;
    
    // Format goal type display
    let typeText = "完成型";
    if (goal.goal_type === "numeric" && goal.unit) {
      typeText = `數值型（${goal.unit}）`;
    } else if (goal.goal_type === "numeric") {
      typeText = "數值型";
    }
    
    content += `🎯 類型: ${typeText}\n`;
    content += `🆔 ID: \`${goal.id}\`\n`;
    content += `📝 描述: ${goal.description || "無"}\n`;
    content += `📅 建立時間: ${new Date(goal.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}\n`;
    content += `🔄 狀態: ${goal.status}\n`;
    content += `${index < goals.length - 1 ? "---\n" : ""}`;
  });

  return content;
}

function createPaginationButtons(currentPage, totalPages) {
  if (totalPages <= 1) return [];

  const row = new ActionRowBuilder();

  // Previous button
  if (currentPage > 0) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`goals_page_${currentPage - 1}`)
        .setLabel("◀ 上一頁")
        .setStyle(ButtonStyle.Secondary)
    );
  }

  // Next button
  if (currentPage < totalPages - 1) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`goals_page_${currentPage + 1}`)
        .setLabel("▶ 下一頁")
        .setStyle(ButtonStyle.Secondary)
    );
  }

  return row.components.length > 0 ? [row] : [];
}

// Handle button interactions
async function handleButtonInteraction(interaction) {
  if (interaction.customId === "create_completion_goal") {
    // Show modal for completion type goal
    const modal = new ModalBuilder()
      .setCustomId("completion_goal_modal")
      .setTitle("建立完成型目標");

    const goalNameInput = new TextInputBuilder()
      .setCustomId("goal_name_input")
      .setLabel("目標名稱")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder("例如：每日閱讀、運動30分鐘");

    const goalDescriptionInput = new TextInputBuilder()
      .setCustomId("goal_description_input")
      .setLabel("目標描述（可選）")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setPlaceholder("詳細描述您的目標...");

    const nameRow = new ActionRowBuilder().addComponents(goalNameInput);
    const descriptionRow = new ActionRowBuilder().addComponents(goalDescriptionInput);
    modal.addComponents(nameRow, descriptionRow);

    await interaction.showModal(modal);
  } else if (interaction.customId === "create_numeric_goal") {
    // Show modal for numeric type goal
    const modal = new ModalBuilder()
      .setCustomId("numeric_goal_modal")
      .setTitle("建立數值型目標");

    const goalNameInput = new TextInputBuilder()
      .setCustomId("goal_name_input")
      .setLabel("目標名稱")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder("例如：跑步、喝水、學習");

    const goalUnitInput = new TextInputBuilder()
      .setCustomId("goal_unit_input")
      .setLabel("單位（可選）")
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setPlaceholder("例如：分鐘、公里、杯、頁數");

    const goalDescriptionInput = new TextInputBuilder()
      .setCustomId("goal_description_input")
      .setLabel("目標描述（可選）")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setPlaceholder("詳細描述您的目標...");

    const nameRow = new ActionRowBuilder().addComponents(goalNameInput);
    const unitRow = new ActionRowBuilder().addComponents(goalUnitInput);
    const descriptionRow = new ActionRowBuilder().addComponents(goalDescriptionInput);
    modal.addComponents(nameRow, unitRow, descriptionRow);

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
      // Create goal with type and unit information
      const goal = await createGoal(
        userId, 
        goalData.name, 
        goalData.description, 
        goalData.goalType || 'completion', 
        goalData.unit
      );
      
      // Clean up temporary data
      goalCreationData.delete(userId);

      // Format type display
      let typeText = "完成型";
      if (goal.goal_type === "numeric" && goal.unit) {
        typeText = `數值型（${goal.unit}）`;
      } else if (goal.goal_type === "numeric") {
        typeText = "數值型";
      }

      await interaction.update({
        content: `🎉 **目標建立成功！**\n\n` +
                `📋 目標名稱：**${goal.name}**\n` +
                `🎯 類型：${typeText}\n` +
                `🆔 目標 ID：\`${goal.id}\`\n` +
                `📝 描述：${goal.description || "無"}\n` +
                `📅 建立時間：${new Date(goal.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}`,
        components: [],
      });
    }
  } else if (interaction.customId === "select_completion_type") {
    // Handle completion type selection
    const userId = interaction.user.id;
    const currentData = goalCreationData.get(userId);

    if (currentData) {
      currentData.goalType = "completion";
      goalCreationData.set(userId, currentData);

      // Create description and finish buttons
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
        content: `✅ 目標名稱：**${currentData.name}**\n🎯 類型：完成型\n\n您可以選擇新增描述或直接完成建立：`,
        components: [row],
      });
    }
  } else if (interaction.customId === "select_numeric_type") {
    // Handle numeric type selection - show unit input modal
    const modal = new ModalBuilder()
      .setCustomId("goal_unit_modal")
      .setTitle("設定目標單位");

    const unitInput = new TextInputBuilder()
      .setCustomId("goal_unit_input")
      .setLabel("單位")
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setPlaceholder("例如：分鐘、公里、杯、頁數等...");

    const row = new ActionRowBuilder().addComponents(unitInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
  } else if (interaction.customId.startsWith("goals_page_")) {
    // Handle goals pagination
    const page = parseInt(interaction.customId.split("_")[2]);
    const userId = interaction.user.id;

    try {
      const result = await getGoalsByUserPaginated(userId, 10, page * 10);
      const content = formatGoalsList(result);
      const components = createPaginationButtons(page, result.totalPages);

      await interaction.update({
        content: content,
        components: components,
      });
    } catch (error) {
      console.error('Error fetching goals page:', error);
      await interaction.update({
        content: "❌ 取得目標列表時發生錯誤，請稍後再試。",
        components: [],
      });
    }
  }
}

// Handle modal interactions
async function handleModalInteraction(interaction) {
  const userId = interaction.user.id;

  if (interaction.customId === "completion_goal_modal") {
    const goalName = interaction.fields.getTextInputValue("goal_name_input");
    const goalDescription = interaction.fields.getTextInputValue("goal_description_input");

    try {
      const goal = await createGoal(userId, goalName, goalDescription, 'completion', null);
      
      await interaction.reply({
        content: `🎉 **完成型目標建立成功！**\n\n` +
                `📋 目標名稱：**${goal.name}**\n` +
                `🎯 類型：完成型\n` +
                `🆔 目標 ID：\`${goal.id}\`\n` +
                `📝 描述：${goal.description || "無"}\n` +
                `📅 建立時間：${new Date(goal.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error creating completion goal:', error);
      await interaction.reply({
        content: "❌ 建立目標時發生錯誤，請稍後再試。",
        ephemeral: true,
      });
    }
  } else if (interaction.customId === "numeric_goal_modal") {
    const goalName = interaction.fields.getTextInputValue("goal_name_input");
    const goalUnit = interaction.fields.getTextInputValue("goal_unit_input");
    const goalDescription = interaction.fields.getTextInputValue("goal_description_input");

    try {
      const goal = await createGoal(userId, goalName, goalDescription, 'numeric', goalUnit || null);
      
      const unitText = goal.unit ? `（${goal.unit}）` : "";
      await interaction.reply({
        content: `🎉 **數值型目標建立成功！**\n\n` +
                `📋 目標名稱：**${goal.name}**\n` +
                `🎯 類型：數值型${unitText}\n` +
                `🆔 目標 ID：\`${goal.id}\`\n` +
                `📝 描述：${goal.description || "無"}\n` +
                `📅 建立時間：${new Date(goal.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error creating numeric goal:', error);
      await interaction.reply({
        content: "❌ 建立目標時發生錯誤，請稍後再試。",
        ephemeral: true,
      });
    }
  } else if (interaction.customId.startsWith("completion_report_modal_")) {
    // Handle completion type report
    const goalId = interaction.customId.replace("completion_report_modal_", "");
    const completionStatusText = interaction.fields.getTextInputValue("completion_status_input");
    const notes = interaction.fields.getTextInputValue("notes_input");

    try {
      // Parse completion status
      const completionStatus = ["是", "yes", "y", "完成", "1", "true"].includes(completionStatusText.toLowerCase().trim());
      
      const goal = await getGoalById(goalId);
      if (!goal) {
        await interaction.reply({
          content: "❌ 找不到指定的目標。",
          ephemeral: true,
        });
        return;
      }

      await createGoalReport(goalId, userId, completionStatus, null, notes || null);
      
      const statusEmoji = completionStatus ? "✅" : "❌";
      const statusText = completionStatus ? "已完成" : "未完成";
      
      await interaction.reply({
        content: `${statusEmoji} **回報成功！**\n\n` +
                `📋 目標：**${goal.name}**\n` +
                `📊 狀態：${statusText}\n` +
                `📝 備註：${notes || "無"}\n` +
                `📅 回報時間：${new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error creating completion report:', error);
      await interaction.reply({
        content: "❌ 提交回報時發生錯誤，請稍後再試。",
        ephemeral: true,
      });
    }
  } else if (interaction.customId.startsWith("numeric_report_modal_")) {
    // Handle numeric type report
    const goalId = interaction.customId.replace("numeric_report_modal_", "");
    const numericValueText = interaction.fields.getTextInputValue("numeric_value_input");
    const notes = interaction.fields.getTextInputValue("notes_input");

    try {
      const numericValue = parseFloat(numericValueText);
      
      if (isNaN(numericValue)) {
        await interaction.reply({
          content: "❌ 請輸入有效的數值。",
          ephemeral: true,
        });
        return;
      }
      
      const goal = await getGoalById(goalId);
      if (!goal) {
        await interaction.reply({
          content: "❌ 找不到指定的目標。",
          ephemeral: true,
        });
        return;
      }

      await createGoalReport(goalId, userId, null, numericValue, notes || null);
      
      const unitText = goal.unit ? ` ${goal.unit}` : "";
      
      await interaction.reply({
        content: `📊 **回報成功！**\n\n` +
                `📋 目標：**${goal.name}**\n` +
                `📈 數值：**${numericValue}${unitText}**\n` +
                `📝 備註：${notes || "無"}\n` +
                `📅 回報時間：${new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error creating numeric report:', error);
      await interaction.reply({
        content: "❌ 提交回報時發生錯誤，請稍後再試。",
        ephemeral: true,
      });
    }
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  // Handle autocomplete
  if (interaction.isAutocomplete()) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.autocomplete(interaction);
    } catch (error) {
      console.error('Error in autocomplete:', error);
    }
    return;
  }

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
