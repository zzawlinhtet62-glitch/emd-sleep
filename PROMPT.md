# PROMPT — 互動式 EMD 睡眠研究網站

> 用法：把這整份檔案存成 `PROMPT.md`，放進一個空資料夾，在該資料夾開 Claude Code，輸入：
> `請讀 PROMPT.md 並完整實作。`

---

## 任務

做一個**互動演算法網站**，解釋經驗模態分解（Empirical Mode Decomposition, EMD）以及它在睡眠研究上的意義。這是為了配合黃鍔院士（Norden E. Huang）的演講而做的課堂作業。

**產出**：一個 `index.html`，單一自足檔案，不依賴任何外部 JavaScript 函式庫（字體可用 Google Fonts）。要能直接丟到 GitHub Pages 就跑起來。

**核心要求**：不能只是一篇有圖的文章。使用者必須能**動手操作演算法本身**——改變輸入、即時看到演算法的反應。

---

## 一、必須自己實作的演算法

全部用原生 JavaScript 寫，**不准用任何函式庫**。寫完請自己跑測試驗證（見第五節）。

### 1. 自然三次樣條插值 `cubicSpline(xs, ys, xq)`
三對角矩陣解二階導數，回傳在 `xq` 各點的內插值。這是整個專案最容易寫錯的部分，務必先單獨測試。

### 2. 極值搜尋 `findExtrema(y)`
回傳 `{maxI, minI}`，即所有局部極大值與極小值的索引。逐點與左右鄰居比較即可。

### 3. 包絡線 `envelope(y, idx)`
把極值點用三次樣條連成平滑曲線。**端點要外推處理**（end effect），否則圖形兩側會嚴重失真。

### 4. 單次篩選 `siftOnce(h)`
回傳 `{up, lo, mean, hNew, maxI, minI}`，其中 `mean = (up + lo) / 2`，`hNew = h - mean`。

### 5. IMF 判定 `imfCheck(h)`
**兩個條件都要實作**（只做條件一的話教學示範會第一輪就通過，失去意義）：
- 條件一：極值點總數與過零點數量相差 ≤ 1
- 條件二：包絡平均的最大絕對值 / 訊號振幅 < 0.05

回傳 `{nExt, nZero, c1, c2, sym, ok}`。

### 6. 完整篩選 `sift(y)`
反覆呼叫 `siftOnce`，停止條件用標準 SD 準則：
```
SD = Σ(h[i] - hNew[i])² / Σ(h[i]² + ε)，SD < 0.2 即停止
```
上限 12 次疊代。

### 7. EMD 主體 `emd(y, maxImf)`
反覆抽取 IMF，每次從殘量中減去，直到極值不足或能量過小。回傳 `{imfs, residue}`。

### 8. FFT `fft(re, im)`
疊代式 radix-2，原地運算。搭配 `spectrum(x, fs)` 回傳單邊振幅頻譜。

### 9. 希爾伯特轉換 `hilbert(x, fs)`
用 FFT 建構解析訊號：正頻率乘 2、負頻率歸零、DC 與 Nyquist 保持。回傳瞬時振幅 `amp` 與瞬時頻率 `freq`（相位差需 unwrap 到 ±π 再換算成 Hz）。

---

## 二、三個互動分頁

### 分頁一：篩選演算法逐步演示

一條合成訊號，一顆「下一步」按鈕，走過七個階段：

| 步驟 | 畫面變化 |
|---|---|
| 0 | 只有訊號 |
| 1 | 冒出所有極值點 |
| 2a | 畫出上包絡線 |
| 2b | 畫出下包絡線 |
| 3 | 畫出中線 |
| 4 | 第二張圖出現：h = 訊號 − 中線 |
| 5 | 顯示兩個 IMF 條件的檢查結果 |

不合格時，按下一步把 h 當作新訊號，回到步驟 1，輪次計數 +1。

**教學訊號必須挑成需要多輪才收斂**，這樣使用者才看得到「不合格 → 再篩一次」。建議用（256 點，fs = 64 Hz）：
```js
y[i] = 3*Math.sin(2*Math.PI*1.75*t)
     + 2.2*Math.sin(2*Math.PI*0.8*t + 1)
     + 5*Math.sin(Math.PI*t/4);
```
這段需要 **3 輪**，包絡平均偏移會從約 20.5% → 8.4% → 3.0% 逐輪下降。實作後請驗證這個行為。

**必須附一張即時數值表**：一個滑桿選讀取位置，表格顯示該位置附近數個取樣點的 t、訊號值、上包絡、下包絡、中線、h。使用者要能自己驗證「中線 = 上下包絡的平均」和「h = 訊號 − 中線」。這是證明你真的在跑演算法、不是播動畫的關鍵。

### 分頁二：五個睡眠期的 IMF 分解

五個按鈕切換 Wake / N1 / N2 / N3 / REM，加一個雜訊滑桿。取樣率 100 Hz，長度 1024 點（10.24 秒，2 的冪次方便 FFT）。

依睡眠醫學描述合成訊號：

- **Wake**：8–13 Hz alpha 為主（加緩慢的振幅調變模擬 alpha 爆發），混入約 19 Hz beta，振幅較低
- **N1**：6 Hz theta 主導，alpha 隨時間衰減
- **N2**：**必須包含兩個睡眠紡錘波**（約 13 Hz、高斯窗約 0.9 秒的短暫爆發）與**一個 K 複合波**（雙相：先一個尖銳負波，再一個較慢的正波）
- **N3**：0.5–2 Hz 大振幅慢波，峰值可到 150 µV
- **REM**：theta 加鋸齒波，振幅低、頻率混雜

每條 IMF 旁邊標出：主頻率（用過零率估計）、峰值振幅、對應腦波頻帶（delta / theta / alpha / beta）。

**這頁的重點演示**：把雜訊滑桿拉大，IMF1 的能量與主頻會大幅上升——雜訊被集中到最高頻的那層。這正是 EMD 能用於去除偽跡的原因。請在頁面上用文字點出這件事。

### 分頁三：傅立葉 vs 希爾伯特譜

**這頁是整個網站的論點所在，最重要。**

一段含單一紡錘波的訊號，兩個滑桿：紡錘波的**出現時間**與**頻率**。

畫面左右並排：
- 左：傅立葉振幅頻譜（橫軸頻率 0–25 Hz，沒有時間軸）
- 右：希爾伯特譜（橫軸時間、縱軸頻率 0–25 Hz、亮度為瞬時振幅）

**要達成的效果**：拖動「出現時間」滑桿時，左邊的傅立葉頻譜**幾乎紋絲不動**，右邊的亮塊卻跟著滑動。拖動「頻率」滑桿時兩張圖才同時反應。

實作正確的話，紡錘波在 13 Hz 的傅立葉振幅在不同時間位置只會變動約 3%，而希爾伯特譜的亮點會準確落在紡錘波實際出現的時刻（誤差約 0.1 秒內）。**請實際測量並驗證這兩個數字。**

希爾伯特譜的繪製：對每條 IMF 算瞬時振幅與頻率，在時間–頻率格點上取最大振幅，以透明度呈現（建議先做 `Math.pow(v, 0.55)` 的 gamma 校正，否則弱訊號看不見）。

---

## 三、其他必備內容

- **中英雙語即時切換**（不是兩個頁面，是同一頁切換字串）
- **明暗主題切換**，並支援 `prefers-color-scheme`
- 一段「**這對睡眠研究為什麼重要**」：自動睡眠分期、偽跡移除、呼吸與睡眠呼吸中止
- 一段「**EMD 的已知限制**」：模態混合（mode mixing）與端點效應（end effect）。承認方法的弱點，比只講優點可信
- **完整參考文獻區**，用下面第四節的清單
- 手機版可用；`prefers-reduced-motion` 要尊重

---

## 四、參考文獻（已查證，直接使用，不要自行編造）

### 方法奠基

**[1]** Huang, N. E., Shen, Z., Long, S. R., Wu, M. C., Shih, H. H., Zheng, Q., Yen, N.-C., Tung, C. C., & Liu, H. H. (1998). *The empirical mode decomposition and the Hilbert spectrum for nonlinear and non-stationary time series analysis.* Proceedings of the Royal Society of London A, 454(1971), 903–995. DOI: 10.1098/rspa.1998.0193

> 黃鍔院士的原始論文。引入「本徵模態函數」概念，使瞬時頻率具有物理意義。分解為自適應，基於資料本身的局部特徵時間尺度，故適用於非線性與非穩態過程。最終呈現為能量–頻率–時間分布，即 Hilbert 譜。

**[2]** Wu, Z., & Huang, N. E. (2009). *Ensemble Empirical Mode Decomposition: A Noise-Assisted Data Analysis Method.* Advances in Adaptive Data Analysis, 1(1), 1–41. DOI: 10.1142/S1793536909000047

> 解決模態混合。對「原訊號加白雜訊」的集成樣本各做一次篩選再取平均。必須是有限振幅而非無限小的白雜訊，才能迫使集成窮盡所有可能解。

**[3]** Huang, N. E., et al. (2016). *On Holo-Hilbert spectral analysis: a full informational spectral representation for nonlinear and non-stationary data.* Philosophical Transactions of the Royal Society A, 374(2065), 20150206. DOI: 10.1098/rsta.2015.0206

> 用巢狀 EMD 與 HHT，同時辨識振幅調變與頻率調變。

### 睡眠分期應用

**[4]** Liu, C., Tan, B., Fu, M., Li, J., Wang, J., Hou, F., & Yang, A. (2021). *Automatic sleep staging with a single-channel EEG based on ensemble empirical mode decomposition.* Physica A, 567, 125685. DOI: 10.1016/j.physa.2020.125685

> 以 EEMD 分解 EEG，從原始訊號與 IMF 同時抽取統計、時域與非線性動力學特徵，用 XGBoost 五折交叉驗證。Sleep-EDF 四分類 93.1%、五分類 91.9%；DREAMS 86.4% / 83.4%；SHHS 87.5% / 85.8%。結論：IMF 導出的特徵確實提供額外資訊。

**[5]** Hassan, A. R., & Bhuiyan, M. I. H. (2017). *Automated identification of sleep states from EEG signals by means of ensemble empirical mode decomposition and random under sampling boosting.* Computer Methods and Programs in Biomedicine, 140, 201–210. DOI: 10.1016/j.cmpb.2016.12.015

**[6]** Hassan, A. R., & Bhuiyan, M. I. H. (2016). *Computer-aided sleep staging using complete ensemble empirical mode decomposition with adaptive noise and bootstrap aggregating.* Biomedical Signal Processing and Control, 24, 1–10. DOI: 10.1016/j.bspc.2015.09.002

> 與 [1][2] 並列可構成方法演化軌跡：EMD (1998) → EEMD (2009) → CEEMDAN (2016)。

### 呼吸與睡眠呼吸中止

**[7]** Caseiro, P., Fonseca-Pinto, R., & Andrade, A. (2010). *Screening of obstructive sleep apnea using Hilbert–Huang decomposition of oronasal airway pressure recordings.* Medical Engineering & Physics, 32(6), 561–568. DOI: 10.1016/j.medengphy.2010.01.008

> 常規診斷需整夜記錄；本研究改用清醒時段僅 5 分鐘的口鼻氣道壓力訊號。41 名受試者（非 OSA 20 人、OSA 21 人），以 HHT 抽取本質振盪模態，第一與第二模態的頻率分布在兩組間有顯著差異，所建指標在 95% 特異度下達 81.0% 敏感度。

**[8]** Ho, C.-N., Huang, N. E., Chen, J.-Y., & Yang, A. C. (2026). *Exploring Nociceptive–Analgesic Balance and EEG Modulation Patterns During General Anesthesia Using Holo-Hilbert Spectral Analysis.* Pain Research and Management. DOI: 10.1155/prm/5504074

> 黃鍔院士與台灣團隊的近期合作。指出傳統頻譜方法需事先切定頻帶再帶通濾波，難以偵測不同振盪成分間的非線性交互作用，因而改用 HHSA。

### 補充：IMF 與睡眠生理的對應

Scientific Reports (2022), *Slow wave synchronization and sleep state transitions*, DOI: 10.1038/s41598-022-11513-0

在約 120 Hz 取樣率下：IMF1 約 20–60 Hz（快速振盪強度）、IMF3 約 2–4 Hz、IMF4 約 1–2 Hz、IMF5 約 0.2–1 Hz。IMF3+4+5 的合併振幅（0.2–4 Hz）可作為慢波活動強度的量測。**可用來替分頁二的 IMF 標註生理意義。**

---

## 五、實作後必須自我驗證

寫完演算法後，**先寫測試跑過再做 UI**。用 Node 執行，確認以下數值：

```js
// 測試訊號：13 Hz 正弦（振幅 3）+ 1.5 Hz 正弦（振幅 5），fs = 100，N = 1024
```

必須通過：

1. **分離正確性**：IMF1 與 13 Hz 成分的相關係數 > 0.99（去掉頭尾各 80 點避免端點效應）
2. **重建正確性**：所有 IMF 加殘量減原訊號，最大誤差 < 1e-12
3. **瞬時頻率**：對 IMF1 做希爾伯特轉換，中段平均瞬時頻率應為 13.0 Hz ± 0.1
4. **瞬時振幅**：同上，平均振幅應為 3.0 ± 0.1
5. **分頁一收斂輪數**：教學訊號應需 3 輪，偏移量逐輪下降
6. **分頁三不變性**：紡錘波移到 1.5s / 5.0s / 8.5s，傅立葉在 13 Hz 的振幅變動 < 5%；希爾伯特譜亮點位置誤差 < 0.2 秒

**把這些測試結果貼給我看，再繼續做 UI。**

---

## 六、已知地雷（請避開）

1. **`-x ** 2` 是 JavaScript 語法錯誤**。`Math.exp(-((t-t0)/0.13)**2)` 會讓整個腳本掛掉，瀏覽器毫無提示。必須寫成先取變數再相乘：
   ```js
   const a = (t-t0)/0.13;
   Math.exp(-(a*a));
   ```

2. **Canvas 的 `fillStyle` 不支援 `color-mix()`**。要半透明請用 `ctx.globalAlpha`。

3. **Canvas 需要處理 `devicePixelRatio`**，否則在高解析度螢幕上會糊掉。

4. **隱藏分頁的 `canvas.clientWidth` 是 0**。切換分頁時要重新繪製。

5. **相位 unwrap 不能省**。算瞬時頻率時相位差要繞回 ±π 區間，否則會出現大量假的高頻尖峰。

6. **端點外推不能省**。否則圖形左右兩側會嚴重失真，看起來像 bug。

---

## 七、視覺方向

**主題：整夜記錄（Overnight Recording）。**

這個網站講的是人在睡覺時被記錄下來的訊號，所以用睡眠實驗室夜間的視覺語言——不是亮白的簡報風，而是深色、安靜、儀器發光的感覺。

### 色彩
```
--night      #101820   深藍黑，頁面底色
--panel      #18222C   面板底色
--haze       #243140   分隔線、格線
--text       #DCE4EA   主文字
--text-dim   #8C9AA8   次要文字
--trace      #E8D5A8   訊號線，暖砂色（記錄筆的燈光）
--coral      #E0705E   極值點、強調
--cyan       #5AB6C4   包絡線
--sage       #8FBF7F   中線
```

一個重點：**訊號線用暖色、背景用冷色**。這個對比讓曲線像在發光，符合「夜間儀器」的概念。不要用亮綠色配純黑——那是通用的駭客風，跟睡眠無關。

### 字體
- 標題：`Fraunces` 或 `Newsreader`（有個性的襯線體，帶一點人文感，平衡儀器的冷硬）
- 內文：`Noto Sans TC` + `Inter`
- **數字一律用等寬體**：`JetBrains Mono` 或 `IBM Plex Mono`。數值表格是這個網站的重點，等寬字讓數字對齊才讀得出來

### 版面
- 首屏不要放大標題數字加漸層——那是通用預設。**直接放一條正在被分解的腦波**，訊號在上、IMF 依序在下，像真正的多導睡眠記錄紙
- 分頁用底線標示，不要做成卡片
- 圖表區給足留白，曲線是主角
- 單欄，最大寬度約 1100px，內文行長不超過 75 字元

### 動態
克制。只在使用者操作時有反應（切換分頁、按下一步、拖滑桿）。**不要**每個區塊都做淡入上移——那是 AI 生成頁面最明顯的特徵。

### 如果想換風格
把第七節整段換掉即可，其餘不用動。其他可行方向：
- **睡眠圖譜（Hypnogram）**：以整夜睡眠分期圖的階梯狀線條為視覺母題
- **瑞士網格**：強烈的方格系統、大號數字、紅黑白三色
- **實驗筆記本**：方格紙底、手寫感註記、鉛筆線條

---

## 八、完成後的部署

做完 `index.html` 後：

1. 初始化 git，commit
2. 在 GitHub 建一個 public repo
3. push 上去
4. Settings → Pages → Source 選 `Deploy from a branch`，Branch 選 `main` / `root`，儲存
5. 等一兩分鐘，網址是 `https://<帳號>.github.io/<repo 名>/`

**關於 Zeabur**：作業原本要求部署到 Zeabur，但它現在需要先綁定或購買伺服器才能建專案。如果遇到這個狀況，改用 GitHub Pages，並在繳交時**誠實說明改用原因**——說明過程本身也是作業的一部分。另一個免費選項是 Cloudflare Workers，同樣可與 GitHub repo 連動自動部署。

請順便寫一份 `README.md`，說明專案在做什麼、演算法怎麼實作的、以及參考文獻。

---

## 九、工作順序

1. 先寫演算法核心，用 Node 跑第五節的測試，把結果貼出來
2. 通過後才做 UI
3. 做完三個分頁，自己檢查每個互動都真的有反應
4. 最後加雙語、主題切換、文獻區
5. 部署

**每完成一個階段停下來回報，不要一次做完。**
