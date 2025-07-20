# Bug Report: 完成型回報顯示「找不到指定的目標」

## 問題描述

在使用 `/r` 指令回報完成型目標時，點擊「✅ 已完成」或「❌ 未完成」按鈕後，系統顯示：
```
❌ 找不到指定的目標。
```

## 錯誤發生位置

`index.js:299` - `getGoalById(goalId)` 回傳 null

## 可能原因分析

### 1. GoalId 解析錯誤
- **原因**: customId 解析邏輯可能仍有問題
- **檢查點**: `goalId` 變數是否正確提取
- **測試方法**: 在 `index.js:296` 後加入 `console.log('goalId:', goalId)` 檢查

### 2. 目標 ID 格式問題
- **原因**: 目標 ID 可能包含特殊字符導致解析錯誤
- **檢查點**: 目標 ID 的實際格式和長度
- **測試方法**: 在 `/r` 指令的 autocomplete 中檢查返回的 `goal.id`

### 3. 資料庫連線問題
- **原因**: `getGoalById` 函數執行失敗
- **檢查點**: 資料庫查詢是否正常
- **測試方法**: 直接測試 `getGoalById` 函數

### 4. 用戶權限問題
- **原因**: 目標存在但不屬於當前用戶
- **檢查點**: `goal.user_id` 是否匹配
- **測試方法**: 檢查目標所有者

### 5. 時序問題
- **原因**: 目標在按鈕點擊前被刪除或狀態改變
- **檢查點**: 目標狀態是否為 'active'
- **測試方法**: 檢查目標狀態和存在性

## 測試方法

### 1. 啟用除錯日誌
在 `index.js` 的按鈕處理函數中加入除錯日誌：

```javascript
} else if (interaction.customId.startsWith("completion_report_yes_") || interaction.customId.startsWith("completion_report_no_")) {
    // Handle completion report buttons
    const isCompleted = interaction.customId.startsWith("completion_report_yes_");
    const goalId = isCompleted 
      ? interaction.customId.replace("completion_report_yes_", "")
      : interaction.customId.replace("completion_report_no_", "");
    const userId = interaction.user.id;

    console.log('DEBUG: customId:', interaction.customId);
    console.log('DEBUG: isCompleted:', isCompleted);
    console.log('DEBUG: goalId:', goalId);
    console.log('DEBUG: userId:', userId);

    try {
      const goal = await getGoalById(goalId);
      console.log('DEBUG: goal found:', goal ? 'YES' : 'NO');
      if (goal) {
        console.log('DEBUG: goal.user_id:', goal.user_id);
        console.log('DEBUG: goal.status:', goal.status);
      }
```

### 2. 資料庫直接查詢
在 psql 中執行：
```sql
SELECT id, name, user_id, status FROM goals WHERE status = 'active';
```

### 3. 測試 getGoalById 函數
建立測試腳本：
```javascript
// test-get-goal.js
const { getGoalById } = require('./database');

async function testGetGoal() {
  try {
    const goalId = 'goal_xxxxxxxxx'; // 替換為實際的 goal ID
    const goal = await getGoalById(goalId);
    console.log('Goal found:', goal);
  } catch (error) {
    console.error('Error:', error);
  }
}

testGetGoal();
```

### 4. 檢查按鈕 customId 格式
在 `/r` 指令執行時加入日誌：
```javascript
// 在 commands/goals/report.js 中
const completedButton = new ButtonBuilder()
  .setCustomId(`completion_report_yes_${goalId}`)
  .setLabel("✅ 已完成")
  .setStyle(ButtonStyle.Success);

console.log('DEBUG: Button customId:', `completion_report_yes_${goalId}`);
```

### 5. 檢查 autocomplete 回傳的 goalId
在 `report.js` 的 autocomplete 函數中：
```javascript
const choices = goals.map(goal => {
  console.log('DEBUG: goal.id in autocomplete:', goal.id);
  // ... rest of the code
});
```

## 預期結果 vs 實際結果

### 預期結果
- 按鈕點擊後顯示備註 Modal
- 成功建立回報記錄

### 實際結果
- 顯示「❌ 找不到指定的目標」錯誤訊息
- 無法繼續回報流程

## 復現步驟

1. 執行 `/r` 指令
2. 從 autocomplete 選擇一個完成型目標
3. 點擊「✅ 已完成」或「❌ 未完成」按鈕
4. 觀察錯誤訊息

## 環境資訊

- Discord.js 版本: 14.21.0
- 資料庫: PostgreSQL
- 相關指令: `/r`, `/create goal`, `/show goals`

## 下一步行動

1. [ ] 啟用除錯日誌並收集數據
2. [ ] 檢查資料庫中的實際 goal ID 格式
3. [ ] 驗證 customId 解析邏輯
4. [ ] 測試 getGoalById 函數的直接調用
5. [ ] 檢查是否有權限或狀態相關問題

---

**建立時間**: 2025-07-20  
**狀態**: 調查中  
**優先級**: 高（影響核心功能）