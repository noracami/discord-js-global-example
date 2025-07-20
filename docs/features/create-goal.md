# Create Goal Feature

## Overview
建立目標功能，讓使用者透過互動式表單建立個人目標。

## Requirements

### Functional Requirements
- [ ] 提供 `/create goal` slash command
- [ ] 使用互動式按鈕和 Modal 表單收集資訊
- [ ] 支援目標名稱（必填）和描述（可選）輸入
- [ ] 自動產生唯一目標 ID
- [ ] 所有回覆使用 Ephemeral 模式

### Non-Functional Requirements
- [ ] 目標名稱使用 Discord 預設長度限制
- [ ] 無目標數量上限
- [ ] 允許重複目標名稱（用 ID 區分）

## User Stories
- As a user, I want to create a goal so that I can start tracking my progress
- As a user, I want to use an interactive form so that the input process is user-friendly
- As a user, I want my goal creation to be private so that others can't see my goals

## Technical Specifications

### Commands
- Command name: `/create goal`
- Parameters: 無
- Permissions: 所有使用者

### Implementation Details
- Files to be created/modified:
  - `commands/goals/create-goal.js`
  - 資料儲存模組（JSON 檔案或資料庫）
- Dependencies required: 無額外依賴
- Database changes: 新增目標資料結構

### Interaction Flow
1. 使用者輸入 `/create goal`
2. Bot 回覆 Ephemeral 訊息 + 「輸入目標」按鈕
3. 使用者點擊按鈕 → Modal 表單彈出
4. 使用者輸入目標名稱 → 提交
5. Bot 更新訊息顯示目標 + 「新增描述」按鈕
6. 使用者可選擇新增描述（可跳過）
7. 完成後顯示「目標建立成功」+ 目標詳細資訊

### Data Structure
```json
{
  "id": "goal_abc123",
  "userId": "discord_user_id",
  "name": "目標名稱",
  "description": "目標描述（可選）",
  "createdAt": "2025-07-20T10:00:00Z",
  "status": "active"
}
```

## Acceptance Criteria
- [ ] `/create goal` 指令可正常執行
- [ ] 互動式按鈕和 Modal 表單運作正常
- [ ] 目標資料正確儲存
- [ ] 所有回覆為 Ephemeral 模式
- [ ] 目標建立成功後顯示完整資訊

## Testing Plan
- [ ] 測試基本目標建立流程
- [ ] 測試只填目標名稱（跳過描述）
- [ ] 測試完整流程（包含描述）
- [ ] 測試重複目標名稱處理
- [ ] 測試 Ephemeral 回覆功能

## Future Considerations
- 目標編輯/刪除功能
- 目標名稱查詢功能
- 目標分類功能

---
**Created:** 2025-07-20  
**Status:** In Progress  
**Version:** 1.0.0