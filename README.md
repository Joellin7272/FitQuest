# FitQuest 雙人挑戰賽

這是一個基於網頁的健身挑戰應用程式，供雙人使用，可透過 Google Sheets 作為資料儲存介面，支援運動計時、點數計算、獎勵兌換等功能。

## 功能特色

- 使用者登入：僅需選擇"我是 Joel"或"我是 Ruby"
- 運動計時與點數轉換：根據運動時間自動計算點數
- Bonus 加分項目記錄：自訂完成項目並獲得額外點數
- 獎勵設定與兌換機制：自訂獎勵並兌換
- 個人與雙人統計數據
- 離開頁面後仍能繼續計時

## 技術實現

- 前端：HTML、CSS、JavaScript
- 後端：Google Apps Script
- 資料庫：Google Sheets

## 部署步驟

### 1. 建立 Google Sheets 並設置 Apps Script

1. 前往 [Google Drive](https://drive.google.com)
2. 建立新的 Google Sheets 檔案
3. 複製該 Sheets 的 ID（從 URL 中獲取，格式如：`1a2b3c4d5e6f7g8h9i0j...`）
4. 點擊選單「擴充功能」>「Apps Script」
5. 刪除編輯器中的默認程式碼
6. 複製 `gas-app-script.js` 檔案中的所有程式碼並貼上
7. 更新程式碼中的 `SPREADSHEET_ID` 常數為你的 Google Sheets ID
8. 點擊「部署」>「新增部署」
9. 選擇部署類型為「網路應用程式」
10. 設定如下：
    - 執行身份：「以部署者身份執行」
    - 誰可以存取：「任何人」
11. 點擊「部署」
12. 複製生成的網頁應用程式 URL（格式如：`https://script.google.com/macros/s/...`）

### 2. 更新前端應用程式

1. 在 `app.js` 檔案中，找到 `API_URL` 常數並將其更新為你的 Google Apps Script 網頁應用程式 URL
2. 將所有檔案上傳到你的網頁伺服器或使用 GitHub Pages 等靜態網站托管服務

## 使用說明

1. 開啟網頁應用程式
2. 選擇「我是 Joel」或「我是 Ruby」進行登入
3. 應用功能：
   - 運動：開始/結束運動計時，自動計算點數
   - Bonus：新增或記錄完成的 Bonus 項目
   - 獎勵：新增或兌換獎勵
   - 統計：查看個人和雙人統計數據

## 點數計算規則

運動時間（分鐘）與獲得點數對照表：

| 運動時間（分鐘） | 獲得點數 |
|---------------|---------|
| 0–9 分鐘      | 0 點    |
| 10–19 分鐘    | 2 點    |
| 20–29 分鐘    | 3 點    |
| 30–44 分鐘    | 4 點    |
| 45–59 分鐘    | 5 點    |
| 每多 15 分鐘   | 再加 1 點 |

## Bonus 和獎勵說明

- Bonus 項目：自訂項目名稱、單位描述和每單位點數
- 獎勵：自訂獎勵名稱和所需點數

## 技術注意事項

- 請確保允許 Google Apps Script 的 CORS 政策
- 若使用 GitHub Pages 等服務部署前端，請確保使用 HTTPS
- 首次使用時，Google Apps Script 可能需要用戶授權

## 常見問題

**Q: 為什麼我的運動計時沒有正常工作？**
A: 確保瀏覽器未阻止網站的 JavaScript 執行，並檢查是否已正確連接到 Google Apps Script API。

**Q: 點數沒有正確更新？**
A: 檢查 API_URL 是否正確設置，以及 Google Apps Script 是否已正確部署。

**Q: 如何備份資料？**
A: 所有資料存儲在 Google Sheets 中，可以定期下載或複製該試算表。 