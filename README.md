# 互動式 EMD 睡眠研究網站

經驗模態分解（Empirical Mode Decomposition, EMD）與希爾伯特譜的互動教學頁面，
說明它們在睡眠研究上的意義。為配合黃鍔院士（Norden E. Huang）演講而製作的課堂作業。

**產出是單一自足的 `index.html`**：不依賴任何外部 JavaScript 函式庫，
所有演算法以原生 JavaScript 手寫，所有數值在瀏覽器裡即時計算。
外部資源只有 Google Fonts 的字體檔。

---

## 這個網站在做什麼

不是一篇有插圖的文章。八個章節都是可操作的演算法：

| 章節 | 你能做什麼 | 看到什麼 |
|---|---|---|
| 01 局部極值 | 拉頻率與振幅；拖滑桿或**直接點圖上任一點** | 該點與左右鄰居的三個數值，以及「是不是極值」的判定；極值數、過零數與 IMF 條件一的即時計算 |
| 02 包絡線與端點 | 切換三種端點處理；拉記錄長度 | 上下包絡與**已知的真實包絡**疊在一起，外推區段加底色；外側 10% 與內側 80% 的誤差百分比 |
| 03 篩選演算法 | 按「下一步」逐格走過篩選；拖滑桿選取樣點 | 極值 → 上包絡 → 下包絡 → 中線 → `h = 訊號 − 中線` → 兩條件檢查（會說明這一輪是哪個條件沒過）；可自行驗算的數值表 |
| 04 訊號實驗室 | 三個成分的頻率與振幅共六支滑桿、雜訊滑桿、三組預設 | 你組的訊號當場做完整 EMD；重建誤差即時顯示 |
| 05 五個睡眠期 | 切換 Wake / N1 / N2 / N3 / REM；拖雜訊滑桿 | 每一期的 IMF 分解與主頻、峰值、腦波頻帶；雜訊集中到 IMF1 |
| 06 傅立葉 vs 希爾伯特 | 移動紡錘波的出現時間與頻率 | 左邊傅立葉頻譜幾乎不動，右邊希爾伯特譜的亮塊跟著時間走 |
| 07 模態混合與 EEMD | 調爆發次數與頻率；切換 EMD / EEMD；調集成數與雜訊振幅 | 間歇訊號造成的模態混合，以及 EEMD 如何修好它——IMF1 與真實爆發成分的相關係數從 **0.17** 變成 **0.99** |
| 08 論文案例 | 點開五張論文卡片 | 每篇的問題、做法、結果與重點，加上跨資料庫準確率比較表 |

第 06 章是整個網站的論點：傅立葉頻譜只回答「有哪些頻率」，
希爾伯特譜同時回答「什麼頻率、在什麼時候、多強」。

---

## 演算法實作

全部在 `src/emd.core.js`，沒有用任何函式庫。

| 函式 | 做法 |
|---|---|
| `cubicSpline(xs, ys, xq)` | 自然三次樣條。以 Thomas 演算法解三對角系統求各節點二階導數，再逐段求值。查詢點遞增時用移動指標，整體 O(n+m)。 |
| `findExtrema(y)` | 逐點與左右鄰居比較；平台區段收斂成單一點。 |
| `envelope(y, idx)` | 極值點以樣條連成包絡線。端點以最外側兩個同型極值線性外推，並夾限在訊號值域與端點值之間。 |
| `siftOnce(h)` | 回傳 `{up, lo, mean, hNew, maxI, minI}`，`mean = (up+lo)/2`、`hNew = h − mean`。 |
| `imfCheck(h)` | 條件一：`|極值數 − 過零數| ≤ 1`。條件二：`max|中線| / 訊號振幅 < 0.05`（振幅取 `(max−min)/2`）。回傳 `{nExt, nZero, c1, c2, sym, ok}`。 |
| `sift(y)` | 反覆 `siftOnce`，`SD = Σ(h−hNew)² / Σ(h²+ε) < 0.2` 即停止，上限 12 次。 |
| `emd(y, maxImf)` | 反覆抽 IMF 並從殘量扣除，直到極值不足或殘量能量低於原訊號的 10⁻¹⁰ 倍。 |
| `fft(re, im)` | 疊代式 radix-2，位元反轉後原地蝶形運算。`spectrum(x, fs)` 回傳單邊振幅頻譜。 |
| `hilbert(x, fs)` | 以 FFT 建構解析訊號：正頻率乘 2、負頻率歸零、DC 與 Nyquist 保持；相位差 unwrap 到 ±π 後換算成瞬時頻率。 |
| `eemd(y, opts)` | 集成經驗模態分解［2］：對多組「原訊號 + 有限振幅白雜訊」各做一次完整 EMD，再逐點平均對應的 IMF。回傳的殘量取 `y − ΣIMF`，使重建保持精確。 |
| `meanFreq(x, fs)` | 振幅加權（a²）的平均瞬時頻率，用來標註每條 IMF 的主頻。 |

### 兩個實作決定

**端點處理。** 先實作了標準的 Rilling 鏡像邊界條件，再與「夾限線性外推」做量化比較
（`test/compare-boundary.js`）。在 13 Hz + 1.5 Hz 的測試訊號上：

| 邊界處理 | IMF3 以後的殘餘能量 | IMF2 峰值（真值 5.000） | corr(IMF2, 1.5 Hz) |
|---|---|---|---|
| 鏡像（Rilling） | 10.164 % | 5.601 | 0.998794 |
| 夾限線性外推 | **0.001 %** | **5.019** | **0.999971** |

所以預設用線性外推。兩種都保留，以 `EMD.CFG.boundary` 切換。

**主頻的估計方式。** 規格原本指定用過零率。實作後發現過零率對**間歇性**的 IMF 會嚴重高估：
第 07 章裡一段真實頻率 12 Hz 的爆發，過零率讀成 25.2 Hz——安靜區段的微小殘餘波動一直穿越零點。
改用振幅加權的平均瞬時頻率後同一條 IMF 讀到 12.00 Hz，而在非間歇的訊號上兩者幾乎一致
（實驗室訊號 1.5 / 7 / 18 Hz：過零率 1.46 / 6.98 / 17.97，加權 1.49 / 7.01 / 17.91）。
所以全站改用加權估計，第 05 章的說明文字有註明這件事。

**IMF 條件的檢查時機。** 條件檢查的對象是篩選後的候選 `h`，不是當輪的輸入訊號
——這正是分頁一步驟 4（產生 h）與步驟 5（檢查）的順序。教學訊號因此需要 3 輪收斂。

---

## 自我驗證

```bash
node test/test.js            # 規格第五節的驗收測試
node test/sleep-check.js     # 五個睡眠期的 IMF 結構與雜訊示範
node test/static-check.js    # 建置後的 index.html 一致性檢查
node test/runtime-check.js   # 用 headless Chrome 實際跑過八章（需要 Chrome）
node test/compare-boundary.js # 兩種端點處理的量化比較
```

`node test/test.js` 的實測結果（19 項全部通過）：

| # | 檢查項目 | 結果 |
|---|---|---|
| 0 | 樣條插值 sin(x)、通過所有節點、重現直線 | 誤差 1.59e-6 / 0 / 4.44e-16 |
| 0b | FFT ↔ IFFT 往返、頻譜峰值定位 | 7.33e-15；7.000 Hz，振幅 1.000000 |
| 1 | corr(IMF1, 13 Hz 成分) > 0.99，去頭尾各 80 點 | **r = 0.999938** |
| 2 | ΣIMF + 殘量 − 原訊號的最大誤差 < 1e-12 | **1.776e-15** |
| 3 | IMF1 中段平均瞬時頻率 = 13.0 ± 0.1 Hz | **13.0000 Hz** |
| 4 | IMF1 中段平均瞬時振幅 = 3.0 ± 0.1 | **3.0000** |
| 5 | 分頁一教學訊號需 3 輪，偏移逐輪下降 | **3 輪：24.2% → 9.2% → 4.1%** |
| 6 | 紡錘波移到 1.5/5.0/8.5 s，傅立葉 13 Hz 振幅變動 < 5% | **1.17%** |
| 6 | 同上，希爾伯特譜亮點位置誤差 < 0.2 s | **最大 0.03 s** |
| 7 | 間歇訊號上 EMD 確實出現模態混合 | corr(IMF1, 爆發成分) = **0.1701** |
| 7 | EEMD 修好它（40 組集成、雜訊 0.1σ） | **0.9938**，且重建誤差仍為 1.78e-15 |
| 8 | 三種端點規則在兩端分岔、在中段一致 | 外側最大歧異 0.452，中段 4.00e-2 |

第 5 項規格給的參考值是 20.5% → 8.4% → 3.0%；本實作得到 24.2% → 9.2% → 4.1%。
輪數與逐輪下降的行為一致，絕對數值的差異來自端點外推方式不同
（改用鏡像延拓可得 14.4% → 6.0% → 2.2%，但分解品質較差，見上表）。

---

## 專案結構

```
index.html                 建置產物，單一自足檔案，部署只需要這一個
build.js                   把 src/ 的各檔內聯進 index.html
src/
  emd.core.js              演算法核心（無相依）
  signals.js               合成訊號產生器（決定性 PRNG，無 Math.random）
  i18n.js                  中英字串與參考文獻資料
  app.js                   互動、繪圖、分頁
  style.css                視覺系統
  index.template.html      HTML 骨架
test/
  test.js                  規格第五節的驗收測試
  sleep-check.js           睡眠期分解與雜訊示範的驗證
  static-check.js          建置產物的一致性檢查
  compare-boundary.js      端點處理 A/B 比較
```

修改後重新建置：

```bash
node build.js && node test/test.js && node test/static-check.js
```

---

## 其他

- **中英雙語**與**明暗主題**即時切換，同一頁改字串，不是兩份頁面；主題預設跟隨 `prefers-color-scheme`，選擇存在 `localStorage`。
- 動態只有三處：首頁的記錄紙持續捲動（訊號嚴格週期化，接縫步幅落在正常取樣間距的 95 百分位內，肉眼看不出），
  以及第 03 章的「自動播放」與第 06 章的「自動掃描」兩顆按鈕。`prefers-reduced-motion` 下捲動靜止，
  分頁切換或分頁隱藏時自動停止。手機版可用。
- 所有腦波都是依睡眠醫學描述合成的訊號，**不是真實病人資料**。
- 視覺概念是「整夜記錄」：冷色背景配暖色訊號線，讓曲線像睡眠實驗室裡發光的記錄筆。

---

## 部署

`index.html` 是自足的，任何靜態主機都能直接放。

**GitHub Pages**

```bash
git init && git add -A && git commit -m "EMD sleep site"
gh repo create <repo> --public --source=. --push
```

然後在 GitHub 的 Settings → Pages → Source 選 `Deploy from a branch`，
Branch 選 `main` / `root`，儲存，等一兩分鐘即可由
`https://<帳號>.github.io/<repo>/` 開啟。

**關於 Zeabur**：作業原本要求部署到 Zeabur，但它目前需要先綁定或購買伺服器才能建立專案。
若遇到這個狀況，改用 GitHub Pages 並在繳交時說明原因。另一個免費選項是 Cloudflare Workers，
同樣可與 GitHub repo 連動自動部署。

---

## 參考文獻

1. Huang, N. E., Shen, Z., Long, S. R., Wu, M. C., Shih, H. H., Zheng, Q., Yen, N.-C., Tung, C. C., & Liu, H. H. (1998). *The empirical mode decomposition and the Hilbert spectrum for nonlinear and non-stationary time series analysis.* Proceedings of the Royal Society of London A, 454(1971), 903–995. DOI: [10.1098/rspa.1998.0193](https://doi.org/10.1098/rspa.1998.0193)
2. Wu, Z., & Huang, N. E. (2009). *Ensemble Empirical Mode Decomposition: A Noise-Assisted Data Analysis Method.* Advances in Adaptive Data Analysis, 1(1), 1–41. DOI: [10.1142/S1793536909000047](https://doi.org/10.1142/S1793536909000047)
3. Huang, N. E., et al. (2016). *On Holo-Hilbert spectral analysis: a full informational spectral representation for nonlinear and non-stationary data.* Philosophical Transactions of the Royal Society A, 374(2065), 20150206. DOI: [10.1098/rsta.2015.0206](https://doi.org/10.1098/rsta.2015.0206)
4. Liu, C., Tan, B., Fu, M., Li, J., Wang, J., Hou, F., & Yang, A. (2021). *Automatic sleep staging with a single-channel EEG based on ensemble empirical mode decomposition.* Physica A, 567, 125685. DOI: [10.1016/j.physa.2020.125685](https://doi.org/10.1016/j.physa.2020.125685)
5. Hassan, A. R., & Bhuiyan, M. I. H. (2017). *Automated identification of sleep states from EEG signals by means of ensemble empirical mode decomposition and random under sampling boosting.* Computer Methods and Programs in Biomedicine, 140, 201–210. DOI: [10.1016/j.cmpb.2016.12.015](https://doi.org/10.1016/j.cmpb.2016.12.015)
6. Hassan, A. R., & Bhuiyan, M. I. H. (2016). *Computer-aided sleep staging using complete ensemble empirical mode decomposition with adaptive noise and bootstrap aggregating.* Biomedical Signal Processing and Control, 24, 1–10. DOI: [10.1016/j.bspc.2015.09.002](https://doi.org/10.1016/j.bspc.2015.09.002)
7. Caseiro, P., Fonseca-Pinto, R., & Andrade, A. (2010). *Screening of obstructive sleep apnea using Hilbert–Huang decomposition of oronasal airway pressure recordings.* Medical Engineering & Physics, 32(6), 561–568. DOI: [10.1016/j.medengphy.2010.01.008](https://doi.org/10.1016/j.medengphy.2010.01.008)
8. Ho, C.-N., Huang, N. E., Chen, J.-Y., & Yang, A. C. (2026). *Exploring Nociceptive–Analgesic Balance and EEG Modulation Patterns During General Anesthesia Using Holo-Hilbert Spectral Analysis.* Pain Research and Management. DOI: [10.1155/prm/5504074](https://doi.org/10.1155/prm/5504074)

補充：*Slow wave synchronization and sleep state transitions*, Scientific Reports (2022). DOI: [10.1038/s41598-022-11513-0](https://doi.org/10.1038/s41598-022-11513-0) — 在約 120 Hz 取樣率下 IMF3+4+5 的合併振幅（0.2–4 Hz）可作為慢波活動強度的量測，用來替分頁二的 IMF 標註生理意義。
