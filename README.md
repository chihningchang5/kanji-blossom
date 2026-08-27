# Nihongo Sensei

你是一位精通 React 和 Tailwind CSS 的資深前端工程師，並且擅長 Supabase 資料庫架構設計。

Task: 請幫我開發一個「日文單字學習 App」。

1. 資料庫設定 (Supabase):

請建立一個名為 vocabulary 的資料表，欄位包含：id (主鍵), word (漢字), reading (平假名), translation (中文), level (難度, 如 N1-N5), created_at。

請連接 Supabase，並確保前端可以讀取與寫入此資料表。

2. 視覺風格 (日系經典):

背景色使用「米白色 (#F5F5DC 或 #FFFDF5)」。

主要文字顏色使用「深咖啡色 (#3E2723)」。

強調與裝飾元素（如按鈕、圖示）使用「日系紅色 (#BC002D)」。

字體請選用優雅的黑體或明體感，整體佈局保持大量留白，簡約清新。

3. 核心功能:

每日學習: 每天從資料庫中隨機選出「5 個詞彙」展示。

測驗系統: 針對當日學習的單字，生成「四選一的選擇題」，測驗完成後顯示正確率。

後台介面: 建立一個隱藏或受保護的管理頁面。

提供「手動新增/修改」單字的功能。

關鍵功能：AI 批次匯入區。請提供一個多行文本框（Textarea），讓我能直接貼上 AI 生成的 JSON 格式單字列表（例如：[{"word":"猫","reading":"ねこ","translation":"貓","level":"N5"}]），點擊按鈕後能一次性匯入資料庫。

4. 互動細節:

當點擊單字時，請觸發瀏覽器內建的 Web Speech API 進行日文發音。

測驗反饋要流暢，選對時給予紅色圓圈（○）提示，選錯時給予叉號（×）。

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5cb5b660-fdf0-483c-9921-9cb67f762bee).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
