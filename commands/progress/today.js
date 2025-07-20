const { SlashCommandBuilder } = require("discord.js");
const { getTodayProgressByUser } = require("../../database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("today")
    .setDescription("查看今日目標進度報告"),

  async execute(interaction) {
    const userId = interaction.user.id;

    try {
      const progressData = await getTodayProgressByUser(userId);
      
      if (progressData.totalGoals === 0) {
        await interaction.reply({
          content: "📝 您還沒有建立任何目標\n\n💡 使用 `/create goal` 指令來建立您的第一個目標！",
          ephemeral: true,
        });
        return;
      }

      const today = new Date().toLocaleDateString("zh-TW", { 
        timeZone: "Asia/Taipei",
        year: "numeric",
        month: "2-digit", 
        day: "2-digit"
      });

      let content = `📊 **今日進度報告** (${today})\n\n`;

      // 已完成的完成型目標
      if (progressData.completed.length > 0) {
        content += `✅ **已完成** (${progressData.completed.length})\n`;
        progressData.completed.forEach(({ goal, report }) => {
          content += `• ${goal.name} ✅\n`;
          if (report.notes) {
            content += `  💭 ${report.notes}\n`;
          }
        });
        content += `\n`;
      }

      // 數值型目標
      if (progressData.numeric.length > 0) {
        content += `📈 **數值記錄** (${progressData.numeric.length})\n`;
        progressData.numeric.forEach(({ goal, report }) => {
          const unit = goal.unit ? ` ${goal.unit}` : "";
          content += `• ${goal.name}: **${report.numeric_value}${unit}**\n`;
          if (report.notes) {
            content += `  💭 ${report.notes}\n`;
          }
        });
        content += `\n`;
      }

      // 未完成的完成型目標
      if (progressData.notCompleted.length > 0) {
        content += `❌ **未完成** (${progressData.notCompleted.length})\n`;
        progressData.notCompleted.forEach(({ goal, report }) => {
          content += `• ${goal.name} ❌\n`;
          if (report.notes) {
            content += `  💭 ${report.notes}\n`;
          }
        });
        content += `\n`;
      }

      // 尚未回報
      if (progressData.notReported.length > 0) {
        content += `⏰ **尚未回報** (${progressData.notReported.length})\n`;
        progressData.notReported.forEach(goal => {
          const typeIcon = goal.goal_type === "completion" ? "📋" : "📊";
          content += `• ${typeIcon} ${goal.name}\n`;
        });
        content += `\n`;
      }

      // 統計資訊
      const completionRate = progressData.totalGoals > 0 
        ? Math.round((progressData.reportedGoals / progressData.totalGoals) * 100)
        : 0;

      content += `📈 **今日統計**\n`;
      content += `• 回報率：${completionRate}% (${progressData.reportedGoals}/${progressData.totalGoals})\n`;
      
      if (progressData.completed.length > 0 || progressData.numeric.length > 0) {
        const achievementRate = progressData.totalGoals > 0 
          ? Math.round((progressData.completedGoals / progressData.totalGoals) * 100)
          : 0;
        content += `• 達成率：${achievementRate}% (${progressData.completedGoals}/${progressData.totalGoals})\n`;
      }

      // 鼓勵訊息
      if (progressData.reportedGoals === progressData.totalGoals) {
        content += `\n🎉 太棒了！今天所有目標都已回報！`;
      } else if (progressData.notReported.length > 0) {
        content += `\n💪 還有 ${progressData.notReported.length} 個目標等待回報，加油！`;
      }

      await interaction.reply({
        content: content,
        ephemeral: true,
      });

    } catch (error) {
      console.error('Error fetching today progress:', error);
      await interaction.reply({
        content: "❌ 取得今日進度時發生錯誤，請稍後再試。",
        ephemeral: true,
      });
    }
  },
};