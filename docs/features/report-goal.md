# Report Goal Feature

## Overview
讓使用者快速回報目標進度，支援自動完成功能和基於目標類型的不同回報方式。

## Prerequisites
- Goal Types Feature 已完成實作
- 資料庫已包含 goal_type 和 unit 欄位

## Requirements

### Functional Requirements
- [ ] 提供 `/r` slash command 與 autocomplete 功能
- [ ] 根據目標類型顯示對應的回報介面
- [ ] 每日可多次回報，累積記錄
- [ ] 所有互動使用 Modal 表單
- [ ] 回報成功後顯示簡單確認訊息
- [ ] 使用 Ephemeral 回覆確保隱私

### Non-Functional Requirements
- [ ] Autocomplete 回應速度快（<2秒）
- [ ] 支援大量目標的自動完成搜尋
- [ ] 資料庫操作效能良好

## User Stories
- As a user, I want to quickly report my goal progress so that I can track my daily achievements
- As a user, I want autocomplete suggestions so that I can easily find my goals
- As a user, I want different input methods for different goal types so that I can record accurate progress
- As a user, I want to report multiple times per day so that I can track all my activities
- As a user, I want simple confirmation after reporting so that I know my data was saved

## Technical Specifications

### Commands
- Command name: `/r`
- Parameters: 
  - `goal` (required): 目標選擇，支援 autocomplete
- Permissions: 所有使用者

### Database Schema Changes

#### New Reports Table
```sql
CREATE TABLE goal_reports (
  id SERIAL PRIMARY KEY,
  goal_id VARCHAR(50) REFERENCES goals(id),
  user_id VARCHAR(50) NOT NULL,
  report_date DATE DEFAULT CURRENT_DATE,
  report_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completion_status BOOLEAN,
  numeric_value DECIMAL(10,2),
  notes TEXT
);
```

### Goal Types
1. **完成型 (completion)**
   - 回報內容：是/否 + 可選備註
   - 儲存：`completion_status` + `notes`
   
2. **數值型 (numeric)**  
   - 回報內容：數值 + 可選備註
   - 儲存：`numeric_value` + `notes`
   - 單位儲存在目標設定中，回報時不重複輸入


### Report Flow
1. 使用者輸入 `/r ` + Tab → 看到目標 autocomplete 列表
2. 選擇目標 → 根據目標類型顯示對應 Modal：
   - **完成型**：是/否選項 + 備註欄位
   - **數值型**：數值輸入 + 備註欄位
3. 提交後顯示「✅ 回報成功！」

### Implementation Details
- Files to be created/modified:
  - `database.js` (新增 reports 相關函數)
  - `commands/goals/report.js` (新檔案)
  - `index.js` (新增 Modal 處理邏輯)
- Dependencies required: 無額外依賴
- Database changes: 新增 goal_reports 資料表

## Acceptance Criteria
- [ ] `/r` 指令的 autocomplete 功能正常運作
- [ ] 完成型和數值型回報介面正確顯示
- [ ] 多次回報功能運作正常
- [ ] 所有回覆為 Ephemeral 模式
- [ ] 資料正確儲存到資料庫

## Testing Plan
- [ ] 測試 autocomplete 功能和搜尋
- [ ] 測試完成型目標回報
- [ ] 測試數值型目標回報
- [ ] 測試多次回報累積記錄
- [ ] 測試備註功能

## Future Considerations
- 回報歷史查詢功能
- 統計報表和圖表
- 目標進度追蹤和提醒

---
**Created:** 2025-07-20  
**Status:** In Progress  
**Version:** 1.0.0