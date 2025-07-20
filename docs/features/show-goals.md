# Show Goals Feature

## Overview
顯示使用者個人目標列表，支援分頁瀏覽和完整資訊展示。

## Requirements

### Functional Requirements
- [ ] 提供 `/show goals` slash command
- [ ] 只顯示當前使用者的目標
- [ ] 顯示完整目標資訊（名稱、ID、描述、建立時間、狀態）
- [ ] 支援分頁顯示（每頁 10 個目標）
- [ ] 按目標名稱字母順序排序
- [ ] 使用 Ephemeral 回覆確保隱私

### Non-Functional Requirements
- [ ] 回應速度良好（資料庫查詢最佳化）
- [ ] 分頁按鈕操作流暢
- [ ] 支援大量目標的顯示

## User Stories
- As a user, I want to view all my goals so that I can track my progress
- As a user, I want to see detailed information about each goal so that I can understand what I committed to
- As a user, I want to navigate through multiple pages so that I can view all my goals easily
- As a user, I want my goal list to be private so that others can't see my personal goals

## Technical Specifications

### Commands
- Command name: `/show goals`
- Parameters: 無
- Permissions: 所有使用者

### Implementation Details
- Files to be created/modified:
  - `commands/goals/show-goals.js`
  - `database.js` (新增查詢函數)
- Dependencies required: 無額外依賴
- Database changes: 優化查詢效能（如需要）

### Display Format
每個目標顯示：
```
📋 目標名稱：**[名稱]**
🆔 目標 ID：`[ID]`
📝 描述：[描述或"無"]
📅 建立時間：[時間]
🔄 狀態：[狀態]
---
```

### Pagination
- 每頁顯示 10 個目標
- 分頁按鈕：「◀ 上一頁」「▶ 下一頁」
- 顯示當前頁數：「第 X 頁，共 Y 頁」

### Empty State
當使用者沒有目標時顯示：
```
📝 您還沒有建立任何目標

💡 使用 `/create goal` 指令來建立您的第一個目標！
```

## Acceptance Criteria
- [ ] `/show goals` 指令可正常執行
- [ ] 正確顯示使用者的所有目標
- [ ] 目標按名稱字母順序排列
- [ ] 分頁功能運作正常
- [ ] 空目標列表顯示正確提示
- [ ] 所有回覆為 Ephemeral 模式
- [ ] 顯示完整目標資訊

## Testing Plan
- [ ] 測試有目標的使用者列表顯示
- [ ] 測試沒有目標的使用者空狀態
- [ ] 測試多頁目標的分頁功能
- [ ] 測試目標名稱排序正確性
- [ ] 測試 Ephemeral 回覆功能

## Future Considerations
- 使用者自訂排序方式（按建立時間、狀態等）
- 目標篩選功能（按狀態、關鍵字）
- 目標搜尋功能

## Backlog Items
- [ ] 讓使用者可以自己調整排序方式（優先度：低）
  - 支援按建立時間、狀態、名稱排序
  - 支援升序/降序選擇

---
**Created:** 2025-07-20  
**Status:** In Progress  
**Version:** 1.0.0