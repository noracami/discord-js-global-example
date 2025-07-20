# Goal Types Feature

## Overview
為目標系統加入類型支援，讓使用者可以建立不同類型的目標（完成型、數值型）。

## Requirements

### Functional Requirements
- [ ] 支援兩種目標類型：完成型（是/否）和數值型（自訂單位）
- [ ] 修改 `/create goal` 加入目標類型選擇流程
- [ ] 數值型目標可設定自訂單位
- [ ] 更新目標顯示包含類型和單位資訊
- [ ] 保持向下相容（既有目標預設為完成型）

### Non-Functional Requirements
- [ ] 資料庫遷移安全可靠
- [ ] 不影響現有目標的正常運作

## User Stories
- As a user, I want to create different types of goals so that I can track various activities
- As a user, I want to set custom units for numeric goals so that I can track specific measurements
- As a user, I want to see goal types in my goal list so that I know what kind of progress to track

## Technical Specifications

### Database Schema Changes

#### Goals Table Enhancement
```sql
ALTER TABLE goals ADD COLUMN goal_type VARCHAR(20) DEFAULT 'completion';
ALTER TABLE goals ADD COLUMN unit VARCHAR(50);
```

### Goal Types
1. **完成型 (completion)**
   - 用於是/否類型的目標
   - 例如：每日閱讀、運動習慣
   
2. **數值型 (numeric)**  
   - 用於需要記錄數值的目標
   - 包含自訂單位（如：分鐘、公里、頁數等）
   - 例如：跑步30分鐘、喝水8杯

### Updated Create Goal Flow
1. 使用者輸入 `/create goal`
2. 點擊「輸入目標」→ Modal 輸入目標名稱
3. 選擇目標類型：「完成型」或「數值型」按鈕
4. 如果是數值型，Modal 輸入單位
5. 點擊「新增描述」（可選）
6. 完成建立，顯示包含類型的目標資訊

### Updated Goal Display
目標列表和建立成功訊息將包含：
- 📋 目標名稱：**[名稱]**
- 🎯 類型：完成型 / 數值型（單位）
- 🆔 目標 ID：`[ID]`
- 📝 描述：[描述或"無"]
- 📅 建立時間：[時間]
- 🔄 狀態：[狀態]

### Implementation Details
- Files to be modified:
  - `database.js` (更新 schema 和 createGoal 函數)
  - `commands/goals/create-goal.js` (加入類型選擇流程)
  - `commands/goals/show-goals.js` (更新顯示格式)
  - `index.js` (新增類型選擇按鈕處理)
- Dependencies required: 無額外依賴
- Database changes: 為 goals 資料表新增 goal_type 和 unit 欄位

## Acceptance Criteria
- [ ] 目標類型選擇介面正常運作
- [ ] 完成型和數值型目標可正常建立
- [ ] 數值型目標的單位正確儲存和顯示
- [ ] 既有目標仍可正常使用（向下相容）
- [ ] 目標列表正確顯示類型資訊
- [ ] 所有回覆為 Ephemeral 模式

## Testing Plan
- [ ] 測試建立完成型目標
- [ ] 測試建立數值型目標（含單位）
- [ ] 測試既有目標的相容性
- [ ] 測試目標列表的新顯示格式
- [ ] 測試資料庫遷移正確性

---
**Created:** 2025-07-20  
**Status:** In Progress  
**Version:** 1.0.0