const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { getGoalsByUserPaginated } = require("../../database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("show")
    .setDescription("顯示目標")
    .addSubcommand((subcommand) =>
      subcommand.setName("goals").setDescription("顯示您的所有目標")
    ),

  async execute(interaction) {
    if (interaction.options.getSubcommand() !== "goals") return;

    const userId = interaction.user.id;
    const page = 0; // Start from first page

    try {
      const result = await getGoalsByUserPaginated(userId, 10, page * 10);
      
      if (result.totalCount === 0) {
        await interaction.reply({
          content: "📝 您還沒有建立任何目標\n\n💡 使用 `/create goal` 指令來建立您的第一個目標！",
          ephemeral: true,
        });
        return;
      }

      const content = formatGoalsList(result);
      const components = createPaginationButtons(page, result.totalPages);

      await interaction.reply({
        content: content,
        components: components,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error fetching goals:', error);
      await interaction.reply({
        content: "❌ 取得目標列表時發生錯誤，請稍後再試。",
        ephemeral: true,
      });
    }
  },
};

function formatGoalsList(result) {
  const { goals, currentPage, totalPages, totalCount } = result;
  
  let content = `📋 **您的目標列表** (第 ${currentPage} 頁，共 ${totalPages} 頁)\n`;
  content += `總共 ${totalCount} 個目標\n\n`;

  goals.forEach((goal, index) => {
    const goalNumber = (currentPage - 1) * 10 + index + 1;
    content += `**${goalNumber}.** 📋 **${goal.name}**\n`;
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