/* ============================================================
   i18n.js — every visible string, in both languages.
   Switching language rewrites the existing DOM; there is only
   ever one page.
   ============================================================ */
'use strict';
(function (global) {

  const STR = {
    zh: {
      htmlLang: 'zh-Hant',
      brand: '經驗模態分解',
      brandSub: '整夜記錄',
      langBtn: 'EN',
      langTitle: 'Switch to English',
      themeBtn: '明亮',
      themeBtnDark: '暗色',

      heroTitle: '把一夜的腦波，拆成它自己的節奏',
      heroLede: '經驗模態分解（EMD）不預設任何基底函數。它只問訊號自己：局部的起伏有多快？' +
                '這個網站不是在講解演算法，而是把演算法交到你手上——每一條曲線都是你按下按鈕的當下，在瀏覽器裡算出來的。',
      stripLeft: '合成 N3 慢波睡眠腦波 · fs = 100 Hz · N = 1024',
      stripRight: '原始訊號與其本質模態函數（由上而下，頻率遞減）',

      introEyebrow: '起點',
      introTitle: '傅立葉假設世界是平穩的，睡眠不是',
      introP1: '傅立葉分析把訊號攤成一組永遠存在、振幅固定的正弦波。這對穩態訊號很好用，' +
               '但睡眠腦波的重點全在「什麼時候發生」：一個紡錘波持續不到一秒，一個 K 複合波是單一事件，' +
               '一次呼吸中止是一段突然消失的規律。把它們攤平成頻譜，等於把事件發生的時刻丟掉。',
      introP2: 'EMD 走另一條路。它反覆用上下包絡線的中線，把訊號裡跑得最快的那一層「篩」出來，' +
               '剩下的殘量再篩一次，直到只剩下趨勢。每一層叫做本質模態函數（IMF），' +
               '它們的振幅和頻率都可以隨時間改變——所以瞬時頻率才有物理意義。',
      introP3: '底下三個分頁，由淺入深：先看篩選怎麼一步步進行，再看五個睡眠期分解出什麼，' +
               '最後把傅立葉頻譜和希爾伯特譜並排，看它們對「時間」的態度差在哪裡。',

      t1: '一、篩選演算法',
      t2: '二、五個睡眠期',
      t3: '三、傅立葉 vs 希爾伯特',

      /* ---- tab 1 ---- */
      p1Title: '一次篩選，拆成七個畫面',
      p1Intro: '合成訊號由三個正弦波疊成。按「下一步」走過篩選的每個動作：找極值、連上下包絡、取中線、相減、檢查。' +
               '如果結果不符合 IMF 的兩個條件，就把相減後的 h 當成新訊號，再篩一次。',
      p1Next: '下一步',
      p1Reset: '重新開始',
      p1Round: '第 %1 輪',
      p1Step: '步驟 %1 / 6',
      steps: [
        '原始訊號。這一輪要處理的對象。',
        '標出所有局部極大值與極小值。逐點和左右鄰居比較，就這麼簡單。',
        '把所有極大值用自然三次樣條連起來，成為上包絡線。兩端需要外推，否則左右會嚴重失真。',
        '同樣把極小值連成下包絡線。訊號被夾在兩條包絡線之間。',
        '中線 m = (上包絡 + 下包絡) / 2。這條線代表訊號的局部平均趨勢。',
        'h = 訊號 − 中線。把局部趨勢扣掉之後，剩下的就是跑得最快的那一層。',
        '檢查 h 是否滿足 IMF 的兩個條件。'
      ],
      p1SigTitle: '訊號、包絡線與中線',
      p1HTitle: 'h = 訊號 − 中線',
      p1Wait: '（走到步驟 5 才會出現）',
      legSignal: '訊號', legMax: '極大值', legMin: '極小值',
      legUp: '上包絡', legLo: '下包絡', legMean: '中線', legH: 'h',

      c1Tag: '條件一',
      c1Name: '極值點數與過零點數相差不超過 1',
      c2Tag: '條件二',
      c2Name: '包絡中線的最大絕對值 / 訊號振幅 < 5%',
      c1Val: '極值 %1 個，過零 %2 次，差 %3',
      c2Val: '%1%',
      verdictOk: 'h 是一個本質模態函數。這一層抽出來了，剩下的殘量會回到步驟 0 繼續分解。',
      verdictNo: 'h 還不是 IMF。把 h 當作新訊號，回到步驟 1 再篩一次。',

      tableTitle: '自己驗算',
      tableIntro: '拖動滑桿選一個取樣點，表格列出它附近的數值。' +
                  '中線那一欄應該等於上下包絡的平均，h 那一欄應該等於訊號減中線——' +
                  '如果對得上，那就表示這些曲線真的是算出來的，不是畫出來的。',
      tablePos: '讀取位置',
      thIdx: 'i', thT: 't (s)', thSig: '訊號', thUp: '上包絡', thLo: '下包絡', thMean: '中線', thH: 'h',

      /* ---- tab 2 ---- */
      p2Title: '五個睡眠期分解出什麼',
      p2Intro: '依睡眠醫學的描述合成五段 10.24 秒的腦波，然後對每一段做完整的 EMD。' +
               '每條 IMF 右邊標出用過零率估計的主頻、峰值振幅，以及對應的腦波頻帶。',
      p2Noise: '加入雜訊',
      p2NoiseUnit: 'µV',
      stageNames: { wake: '清醒', n1: 'N1 淺睡', n2: 'N2', n3: 'N3 深睡', rem: 'REM' },
      stageDesc: {
        wake: '8–13 Hz 的 alpha 節律為主，帶有緩慢的振幅調變（alpha 爆發），混入少量 19 Hz 的 beta。整體振幅偏低。',
        n1: 'theta（約 6 Hz）逐漸接管，alpha 隨時間衰減。這是清醒與睡眠之間的過渡。',
        n2: '背景之上有兩個睡眠紡錘波（約 13 Hz，高斯窗約 0.9 秒）與一個 K 複合波（先一個尖銳負波，再一個較慢的正波）。這兩者是 N2 的判讀依據。',
        n3: '0.5–2 Hz 的大振幅慢波，峰值可達 150 µV。慢波活動的強度是深睡的量測指標。',
        rem: '低振幅、頻率混雜，theta 之上疊著鋸齒波。腦波看起來接近清醒，但肌張力消失。'
      },
      p2Signal: '原始訊號',
      p2Residue: '殘量',
      p2Band: { delta: 'delta', theta: 'theta', alpha: 'alpha', beta: 'beta', gamma: 'gamma', sub: '< 0.5 Hz' },
      p2NoiseNote: '把雜訊滑桿從 0 拉開：IMF1 的主頻會從 %1 Hz 跳到 %2 Hz，能量也跟著上升。' +
                   '雜訊被集中到最高頻的那一層，底下幾層幾乎沒受影響——' +
                   '這就是 EMD 可以用來移除偽跡的原因：丟掉 IMF1，再把剩下的加回去。',
      p2NoiseNoteZero: '目前沒有加雜訊。IMF1 的主頻是 %1 Hz。把滑桿拉開看看它怎麼變。',

      /* ---- tab 3 ---- */
      p3Title: '同一段訊號，兩種問法',
      p3Intro: '訊號裡有一個紡錘波，坐在緩慢的背景腦波上。你可以移動它出現的時間，也可以改變它的頻率。' +
               '左邊是傅立葉振幅頻譜，右邊是希爾伯特譜。注意兩邊對「移動時間」的反應。',
      p3Time: '紡錘波出現時間',
      p3Freq: '紡錘波頻率',
      p3SigTitle: '輸入訊號',
      p3FourierTitle: '傅立葉振幅頻譜',
      p3FourierSub: '橫軸：頻率（沒有時間軸）',
      p3HilbertTitle: '希爾伯特譜',
      p3HilbertSub: '橫軸：時間　縱軸：頻率　亮度：瞬時振幅',
      p3r1: '傅立葉在 %1 Hz 的振幅：<b>%2</b>　（移動時間以來變動 <b class="hi">%3%</b>）',
      p3r2: '希爾伯特譜最亮點落在 <b>t = %1 s</b>　（紡錘波實際位置 %2 s，誤差 <b class="hi">%3 s</b>）',
      p3r3: '拖動「出現時間」：左圖幾乎不動，右圖的亮塊跟著走。拖動「頻率」：兩張圖才同時反應。',
      p3Concl: '這就是整件事的重點。傅立葉頻譜只回答「有哪些頻率」，時間資訊全部藏進相位裡，' +
               '肉眼從振幅頻譜上看不出來。希爾伯特譜同時回答「什麼頻率、在什麼時候、多強」。' +
               '對睡眠研究來說，後者才是問題本身——紡錘波的密度、K 複合波的時刻、呼吸中止的長度，' +
               '全都是時間軸上的問題。',

      /* ---- why it matters ---- */
      whyEyebrow: '應用',
      whyTitle: '這對睡眠研究為什麼重要',
      why1Title: '自動睡眠分期',
      why1: '人工判讀一夜的多導睡眠記錄要好幾個小時，而且判讀者之間的一致性有限。' +
            '把單導程 EEG 用 EEMD 分解後，從原始訊號與各 IMF 同時抽取統計、時域與非線性動力學特徵，' +
            'Sleep-EDF 上的四分類準確率可達 93.1%、五分類 91.9%；DREAMS 與 SHHS 資料庫也在 83–88% 之間［4］。' +
            '關鍵結論是：IMF 導出的特徵確實提供了原始訊號以外的額外資訊。',
      why2Title: '偽跡移除',
      why2: '眼動、肌電、電極接觸不良都會汙染 EEG。傳統做法是帶通濾波，但濾波會把落在同一頻帶的真實腦波一起削掉。' +
            'EMD 的分層是資料自適應的：偽跡通常集中在最前面一兩層 IMF，把那幾層丟掉再重建，' +
            '其他頻率成分保持完整。分頁二的雜訊滑桿示範的就是這件事。',
      why3Title: '呼吸與睡眠呼吸中止',
      why3: '常規 OSA 診斷需要整夜的多導記錄。有研究改用清醒時段僅 5 分鐘的口鼻氣道壓力訊號，' +
            '以 HHT 抽取本質振盪模態：41 名受試者中，第一與第二模態的頻率分布在 OSA 與非 OSA 兩組間有顯著差異，' +
            '所建指標在 95% 特異度下達到 81.0% 敏感度［7］。呼吸訊號本質上是非穩態的，' +
            '這正是 EMD 的主場。',
      why4Title: '麻醉深度與疼痛',
      why4: '黃鍔院士與台灣團隊近期把全希爾伯特譜分析（HHSA）用在全身麻醉下的 EEG 調變模式。' +
            '他們指出傳統頻譜方法必須事先切定頻帶再帶通濾波，難以偵測不同振盪成分之間的非線性交互作用［8］。',

      /* ---- limits ---- */
      limEyebrow: '限制',
      limTitle: 'EMD 的已知弱點',
      limIntro: '一個方法值不值得用，要看它承不承認自己什麼時候會失敗。EMD 有兩個眾所周知的問題。',
      lim1Title: '模態混合（mode mixing）',
      lim1: '同一條 IMF 裡出現差距很大的頻率，或者同一個頻率成分散落在相鄰的幾條 IMF。' +
            '成因是訊號裡的間歇事件：當一個短暫的高頻爆發只出現在局部，篩選過程在有它和沒它的區段會做出不同的判斷。' +
            '分頁二的 N2 就看得到——紡錘波只在兩個瞬間出現，所以 IMF1 在有紡錘波的地方跟著 13 Hz 跑，' +
            '其他地方跟著背景跑。解法是 EEMD：對「原訊號加白雜訊」的多組樣本各做一次分解再平均，' +
            '用有限振幅的白雜訊迫使集成窮盡所有可能的解［2］。',
      lim2Title: '端點效應（end effect）',
      lim2: '包絡線是用極值點內插出來的，但訊號的頭尾不一定剛好落在極值上，' +
            '所以兩端的包絡必須外推——而外推永遠是猜的。誤差會在每一輪篩選中往內累積，' +
            '通常影響最前與最後約 10% 的區段。這個網站的做法是用最外側兩個同型極值做線性外推，' +
            '再夾限在訊號的值域內；第五節的測試刻意去掉頭尾各 80 點，就是為了避開這個區域。',
      lim3Title: '不是正交分解，也沒有解析理論',
      lim3: 'IMF 之間只是「近似正交」，沒有理論保證；整個方法目前也還沒有完整的數學收斂證明，' +
            '停止準則（SD 門檻、篩選次數上限）本質上是經驗性的。換一組參數，分解結果會有些許不同。',

      /* ---- implementation ---- */
      implEyebrow: '實作',
      implTitle: '這個頁面裡跑的是什麼',
      implIntro: '所有數值都是在你的瀏覽器裡即時算出來的，沒有預先產生的圖，也沒有用任何函式庫。' +
                 '以下九個函式全部手寫：',
      implList: [
        ['cubicSpline', '自然三次樣條。用 Thomas 演算法解三對角系統求各節點的二階導數，再逐段求值。'],
        ['findExtrema', '逐點與左右鄰居比較找局部極值，平台區段收斂成單一點。'],
        ['envelope', '把極值點樣條連成包絡線，兩端以最外側兩點線性外推並夾限。'],
        ['siftOnce', '一次篩選：算上下包絡、取中線、相減。'],
        ['imfCheck', 'IMF 兩條件的檢查，回傳極值數、過零數與包絡中線比值。'],
        ['sift', '反覆篩選，SD < 0.2 停止，上限 12 次。'],
        ['emd', '反覆抽取 IMF 並從殘量中扣除，直到極值不足或能量過小。'],
        ['fft / spectrum', '疊代式 radix-2 原地 FFT，以及單邊振幅頻譜。'],
        ['hilbert', '以 FFT 建構解析訊號，相位差 unwrap 後換算成瞬時頻率。']
      ],
      implTests: '演算法先用 Node 測過才接上畫面。測試內容包括：IMF1 與 13 Hz 成分的相關係數 0.999938；' +
                 '所有 IMF 加殘量重建原訊號的最大誤差 1.78 × 10⁻¹⁵；' +
                 'IMF1 的平均瞬時頻率 13.0000 Hz、平均瞬時振幅 3.0000；' +
                 '分頁一的教學訊號需要 3 輪收斂，包絡中線偏移 24.2% → 9.2% → 4.1%；' +
                 '分頁三把紡錘波移到 1.5 / 5.0 / 8.5 秒，傅立葉在 13 Hz 的振幅只變動 1.42%，' +
                 '而希爾伯特譜的亮點位置最大誤差 0.03 秒。',

      /* ---- refs ---- */
      refEyebrow: '文獻',
      refTitle: '參考文獻',
      refG1: '方法奠基',
      refG2: '睡眠分期應用',
      refG3: '呼吸與睡眠呼吸中止',
      refG4: '補充：IMF 與睡眠生理的對應',
      refNotes: [
        '黃鍔院士的原始論文。引入「本質模態函數」概念，使瞬時頻率具有物理意義。分解為自適應，基於資料本身的局部特徵時間尺度，故適用於非線性與非穩態過程。最終呈現為能量–頻率–時間分布，即 Hilbert 譜。',
        '解決模態混合。對「原訊號加白雜訊」的集成樣本各做一次篩選再取平均。必須是有限振幅而非無限小的白雜訊，才能迫使集成窮盡所有可能解。',
        '用巢狀 EMD 與 HHT，同時辨識振幅調變與頻率調變。',
        '以 EEMD 分解 EEG，從原始訊號與 IMF 同時抽取統計、時域與非線性動力學特徵，用 XGBoost 五折交叉驗證。Sleep-EDF 四分類 93.1%、五分類 91.9%；DREAMS 86.4% / 83.4%；SHHS 87.5% / 85.8%。結論：IMF 導出的特徵確實提供額外資訊。',
        '',
        '與 [1][2] 並列可構成方法演化軌跡：EMD (1998) → EEMD (2009) → CEEMDAN (2016)。',
        '常規診斷需整夜記錄；本研究改用清醒時段僅 5 分鐘的口鼻氣道壓力訊號。41 名受試者（非 OSA 20 人、OSA 21 人），以 HHT 抽取本質振盪模態，第一與第二模態的頻率分布在兩組間有顯著差異，所建指標在 95% 特異度下達 81.0% 敏感度。',
        '黃鍔院士與台灣團隊的近期合作。指出傳統頻譜方法需事先切定頻帶再帶通濾波，難以偵測不同振盪成分間的非線性交互作用，因而改用 HHSA。'
      ],
      refSupp: '在約 120 Hz 取樣率下：IMF1 約 20–60 Hz（快速振盪強度）、IMF3 約 2–4 Hz、IMF4 約 1–2 Hz、IMF5 約 0.2–1 Hz。IMF3+4+5 的合併振幅（0.2–4 Hz）可作為慢波活動強度的量測。',

      footer1: '為配合黃鍔院士（Norden E. Huang）演講而製作的課堂作業。',
      footer2: '所有腦波皆為依睡眠醫學描述合成的訊號，非真實病人資料。所有演算法以原生 JavaScript 手寫，未使用任何外部函式庫。',
      footer3: '顯示語言：'
    },

    en: {
      htmlLang: 'en',
      brand: 'Empirical Mode Decomposition',
      brandSub: 'Overnight Recording',
      langBtn: '中',
      langTitle: '切換為中文',
      themeBtn: 'Light',
      themeBtnDark: 'Dark',

      heroTitle: 'Taking a night of brain waves apart, on its own terms',
      heroLede: 'Empirical Mode Decomposition assumes no basis functions. It asks the signal itself: ' +
                'how fast does this wiggle, right here? This page is not an explanation of the algorithm — ' +
                'it hands you the algorithm. Every curve below is computed in your browser the moment you click.',
      stripLeft: 'Synthetic N3 slow-wave sleep EEG · fs = 100 Hz · N = 1024',
      stripRight: 'Signal and its intrinsic mode functions, fastest at the top',

      introEyebrow: 'Starting point',
      introTitle: 'Fourier assumes a stationary world. Sleep is not one.',
      introP1: 'Fourier analysis spreads a signal into sinusoids that are present forever at a fixed amplitude. ' +
               'That is fine for stationary data, but everything interesting about sleep EEG is a question of when: ' +
               'a spindle lasts under a second, a K-complex is a single event, an apnoea is a rhythm that suddenly stops. ' +
               'Flatten those into a spectrum and you throw away the moment they happened.',
      introP2: 'EMD takes another route. It repeatedly sifts out the fastest layer of the signal using the mean of the ' +
               'upper and lower envelopes, then sifts the remainder again, until only a trend is left. Each layer is an ' +
               'intrinsic mode function, and both its amplitude and its frequency may vary with time — which is exactly ' +
               'what makes an instantaneous frequency physically meaningful.',
      introP3: 'The three tabs below go from the mechanism outward: first how one sifting pass actually proceeds, ' +
               'then what five sleep stages decompose into, and finally the Fourier spectrum and the Hilbert spectrum ' +
               'side by side, so you can watch them disagree about time.',

      t1: '1 · The sifting algorithm',
      t2: '2 · Five sleep stages',
      t3: '3 · Fourier vs Hilbert',

      p1Title: 'One sifting pass, in seven frames',
      p1Intro: 'The signal is a sum of three sinusoids. Step through every action of the sifting process: find the extrema, ' +
               'spline them into envelopes, take the mean, subtract, check. If the result fails either IMF condition, ' +
               'h becomes the new signal and the round starts over.',
      p1Next: 'Next step',
      p1Reset: 'Start over',
      p1Round: 'Round %1',
      p1Step: 'Step %1 of 6',
      steps: [
        'The signal this round works on.',
        'Every local maximum and minimum, found by comparing each sample with its two neighbours. That is the whole test.',
        'The maxima joined by a natural cubic spline: the upper envelope. Both ends must be extrapolated, or the sides go badly wrong.',
        'The minima joined the same way: the lower envelope. The signal is now bracketed.',
        'The mean m = (upper + lower) / 2. This curve is the local trend of the signal.',
        'h = signal − mean. With the local trend removed, what is left is the fastest layer.',
        'Test h against the two IMF conditions.'
      ],
      p1SigTitle: 'Signal, envelopes and mean',
      p1HTitle: 'h = signal − mean',
      p1Wait: '(appears at step 5)',
      legSignal: 'signal', legMax: 'maxima', legMin: 'minima',
      legUp: 'upper', legLo: 'lower', legMean: 'mean', legH: 'h',

      c1Tag: 'CONDITION 1',
      c1Name: 'The number of extrema and zero crossings differ by at most one',
      c2Tag: 'CONDITION 2',
      c2Name: 'max |envelope mean| / signal amplitude < 5%',
      c1Val: '%1 extrema, %2 crossings, difference %3',
      c2Val: '%1%',
      verdictOk: 'h is an intrinsic mode function. This layer comes out, and the remainder goes back to step 0.',
      verdictNo: 'h is not an IMF yet. It becomes the new signal, and we sift again from step 1.',

      tableTitle: 'Check the arithmetic yourself',
      tableIntro: 'Drag the slider to pick a sample and read off its neighbourhood. The mean column should equal the ' +
                  'average of the two envelopes, and h should equal signal minus mean. If they add up, these curves are ' +
                  'being computed rather than drawn.',
      tablePos: 'Read position',
      thIdx: 'i', thT: 't (s)', thSig: 'signal', thUp: 'upper', thLo: 'lower', thMean: 'mean', thH: 'h',

      p2Title: 'What five sleep stages decompose into',
      p2Intro: 'Five 10.24-second epochs synthesised from the sleep-medicine description of each stage, then fully ' +
               'decomposed. Each IMF is labelled with its dominant frequency (from the zero-crossing rate), its peak ' +
               'amplitude, and the EEG band it falls in.',
      p2Noise: 'Added noise',
      p2NoiseUnit: 'µV',
      stageNames: { wake: 'Wake', n1: 'N1', n2: 'N2', n3: 'N3', rem: 'REM' },
      stageDesc: {
        wake: 'Dominated by 8–13 Hz alpha with slow amplitude modulation (alpha bursts) and a little 19 Hz beta. Low overall voltage.',
        n1: 'Theta near 6 Hz takes over while alpha decays away. The transition between waking and sleep.',
        n2: 'Two sleep spindles (about 13 Hz, a Gaussian burst roughly 0.9 s long) and one K-complex (a sharp negative deflection followed by a slower positive one) on a slow background. These two graphoelements define the stage.',
        n3: 'Large 0.5–2 Hz slow waves reaching 150 µV. The strength of slow wave activity is the measure of deep sleep.',
        rem: 'Low voltage, mixed frequency: sawtooth waves riding on theta. The EEG looks close to waking, but muscle tone is gone.'
      },
      p2Signal: 'signal',
      p2Residue: 'residue',
      p2Band: { delta: 'delta', theta: 'theta', alpha: 'alpha', beta: 'beta', gamma: 'gamma', sub: '< 0.5 Hz' },
      p2NoiseNote: 'Pull the noise slider away from zero: the dominant frequency of IMF1 jumps from %1 Hz to %2 Hz and ' +
                   'its energy rises with it. The noise collects in the single fastest layer while the layers below are ' +
                   'barely touched — which is precisely why EMD is used to remove artefacts: drop IMF1, add the rest back.',
      p2NoiseNoteZero: 'No noise added yet. IMF1 sits at %1 Hz. Pull the slider and watch where the noise goes.',

      p3Title: 'One signal, two questions',
      p3Intro: 'A single spindle sits on a slow background. You can move when it happens and change how fast it is. ' +
               'Watch how differently the two spectra react to the first slider.',
      p3Time: 'Spindle onset',
      p3Freq: 'Spindle frequency',
      p3SigTitle: 'Input signal',
      p3FourierTitle: 'Fourier amplitude spectrum',
      p3FourierSub: 'x: frequency — there is no time axis',
      p3HilbertTitle: 'Hilbert spectrum',
      p3HilbertSub: 'x: time    y: frequency    brightness: instantaneous amplitude',
      p3r1: 'Fourier amplitude at %1 Hz: <b>%2</b>　(changed <b class="hi">%3%</b> since you started moving it)',
      p3r2: 'Brightest point of the Hilbert spectrum at <b>t = %1 s</b>　(spindle is really at %2 s, error <b class="hi">%3 s</b>)',
      p3r3: 'Drag the onset: the left plot barely moves, the bright patch on the right follows. Drag the frequency: now both respond.',
      p3Concl: 'This is the whole argument. A Fourier spectrum answers only which frequencies are present; the timing is ' +
               'hidden in the phase, where no amount of looking at the amplitude spectrum will recover it. The Hilbert ' +
               'spectrum answers which frequency, at what time, how strong — all at once. For sleep research that is the ' +
               'question itself: spindle density, the moment of a K-complex, the length of an apnoea are all questions ' +
               'about the time axis.',

      whyEyebrow: 'Application',
      whyTitle: 'Why this matters for sleep research',
      why1Title: 'Automatic sleep staging',
      why1: 'Scoring one night of polysomnography by hand takes hours, and inter-rater agreement is limited. ' +
            'Decomposing a single EEG channel with EEMD and extracting statistical, time-domain and nonlinear-dynamic ' +
            'features from the raw signal and the IMFs together reaches 93.1% four-class and 91.9% five-class accuracy ' +
            'on Sleep-EDF, and 83–88% on DREAMS and SHHS [4]. The key finding is that IMF-derived features carry ' +
            'information the raw signal does not.',
      why2Title: 'Artefact removal',
      why2: 'Eye movements, muscle activity and poor electrode contact all contaminate the EEG. The usual answer is a ' +
            'band-pass filter, which also removes whatever real brain activity shares that band. The EMD layering is ' +
            'data-adaptive instead: artefacts collect in the first one or two IMFs, so dropping those and reconstructing ' +
            'leaves the other frequencies intact. The noise slider on tab 2 demonstrates exactly this.',
      why3Title: 'Respiration and sleep apnoea',
      why3: 'Standard OSA diagnosis needs a full night of recording. One study used only five minutes of oronasal airway ' +
            'pressure recorded while awake, extracting intrinsic oscillation modes with the HHT: across 41 subjects the ' +
            'frequency distributions of the first and second modes differed significantly between the OSA and non-OSA ' +
            'groups, and the resulting index reached 81.0% sensitivity at 95% specificity [7]. Respiratory signals are ' +
            'non-stationary by nature, which is where EMD belongs.',
      why4Title: 'Anaesthesia and pain',
      why4: 'Huang and a Taiwanese group recently applied Holo-Hilbert spectral analysis to EEG modulation patterns under ' +
            'general anaesthesia, noting that conventional spectral methods must fix the frequency bands and band-pass ' +
            'filter first, which makes nonlinear interactions between oscillatory components hard to detect [8].',

      limEyebrow: 'Limitations',
      limTitle: 'What EMD is known to get wrong',
      limIntro: 'Whether a method is worth using depends on whether it admits when it fails. EMD has two well-known problems.',
      lim1Title: 'Mode mixing',
      lim1: 'Widely separated frequencies end up in one IMF, or one component is spread across neighbouring IMFs. ' +
            'The cause is intermittency: when a brief fast burst occurs only locally, the sifting process makes different ' +
            'decisions in the segments that contain it and the segments that do not. Tab 2 shows it directly — the N2 ' +
            'spindles exist only at two instants, so IMF1 follows 13 Hz where they are and the background elsewhere. ' +
            'The remedy is EEMD: decompose many copies of the signal with added white noise and average the results, ' +
            'using finite rather than infinitesimal noise to force the ensemble to exhaust the possible solutions [2].',
      lim2Title: 'End effect',
      lim2: 'Envelopes are interpolated through extrema, but the first and last samples are rarely extrema, so both ends ' +
            'have to be extrapolated — and extrapolation is always a guess. The error propagates inward with every ' +
            'sifting iteration, typically corrupting the outer 10% of the record. This page extrapolates linearly from ' +
            'the two outermost extrema of the same kind and clamps the result inside the signal range; the test suite ' +
            'deliberately discards 80 samples at each end for the same reason.',
      lim3Title: 'Not orthogonal, and not proven',
      lim3: 'The IMFs are only approximately orthogonal, with no guarantee, and the method still has no complete ' +
            'convergence proof. The stopping rules — the SD threshold, the iteration cap — are empirical. Change them ' +
            'and the decomposition changes a little.',

      implEyebrow: 'Implementation',
      implTitle: 'What is actually running on this page',
      implIntro: 'Every number here is computed in your browser as you interact with it. No pre-rendered figures, ' +
                 'no libraries. These nine functions are written from scratch:',
      implList: [
        ['cubicSpline', 'Natural cubic spline: the tridiagonal system for the second derivatives is solved with the Thomas algorithm, then each piece is evaluated.'],
        ['findExtrema', 'Local extrema by comparison with both neighbours; plateaux collapse to a single point.'],
        ['envelope', 'Splines the extrema into an envelope, extrapolating both ends from the two outermost points and clamping the result.'],
        ['siftOnce', 'One sifting pass: both envelopes, their mean, and the subtraction.'],
        ['imfCheck', 'The two IMF conditions, returning extrema count, zero crossings and the envelope-mean ratio.'],
        ['sift', 'Repeated sifting, stopping at SD < 0.2, capped at 12 iterations.'],
        ['emd', 'Extracts IMFs one at a time and subtracts each from the remainder until too few extrema or too little energy is left.'],
        ['fft / spectrum', 'Iterative in-place radix-2 FFT, and the single-sided amplitude spectrum.'],
        ['hilbert', 'Builds the analytic signal through the FFT; the phase difference is unwrapped and converted to an instantaneous frequency.']
      ],
      implTests: 'The algorithms were verified under Node before any of this was drawn. The suite checks that IMF1 ' +
                 'correlates with the 13 Hz component at r = 0.999938; that the IMFs plus the residue reconstruct the ' +
                 'signal to within 1.78 × 10⁻¹⁵; that IMF1 has a mean instantaneous frequency of 13.0000 Hz and a mean ' +
                 'instantaneous amplitude of 3.0000; that the tab 1 teaching signal takes 3 rounds with the ' +
                 'envelope-mean offset falling 24.2% → 9.2% → 4.1%; and that moving the spindle to 1.5 / 5.0 / 8.5 s ' +
                 'changes the Fourier amplitude at 13 Hz by only 1.42% while the Hilbert spectrum locates it to within 0.03 s.',

      refEyebrow: 'References',
      refTitle: 'References',
      refG1: 'Foundations',
      refG2: 'Sleep staging',
      refG3: 'Respiration and sleep apnoea',
      refG4: 'Supplementary: IMFs and sleep physiology',
      refNotes: [
        'Huang’s original paper. It introduces the intrinsic mode function, which gives instantaneous frequency a physical meaning. The decomposition is adaptive and based on the local characteristic time scale of the data itself, so it applies to nonlinear and non-stationary processes. The result is an energy–frequency–time distribution: the Hilbert spectrum.',
        'Addresses mode mixing. Each member of an ensemble of "signal plus white noise" copies is sifted, and the results averaged. The noise must be of finite, not infinitesimal, amplitude to force the ensemble to exhaust the possible solutions.',
        'Nested EMD and HHT identify amplitude modulation and frequency modulation at the same time.',
        'EEG decomposed with EEMD; statistical, time-domain and nonlinear-dynamic features taken from the raw signal and the IMFs together, classified with XGBoost under five-fold cross-validation. Sleep-EDF 93.1% (four-class) and 91.9% (five-class); DREAMS 86.4% / 83.4%; SHHS 87.5% / 85.8%. IMF-derived features do add information.',
        '',
        'Together with [1] and [2] this traces the evolution of the method: EMD (1998) → EEMD (2009) → CEEMDAN (2016).',
        'Routine diagnosis requires a whole night of recording; this study used five minutes of oronasal airway pressure recorded while awake instead. Of 41 subjects (20 non-OSA, 21 OSA), the frequency distributions of the first and second modes differed significantly between groups, and the derived index reached 81.0% sensitivity at 95% specificity.',
        'A recent collaboration between Huang and a Taiwanese group. It notes that conventional spectral methods must fix the frequency bands and band-pass filter beforehand, which makes nonlinear interactions between oscillatory components hard to detect — hence HHSA.'
      ],
      refSupp: 'At a sampling rate near 120 Hz: IMF1 covers roughly 20–60 Hz (fast oscillation strength), IMF3 about 2–4 Hz, IMF4 about 1–2 Hz and IMF5 about 0.2–1 Hz. The combined amplitude of IMF3+4+5 (0.2–4 Hz) serves as a measure of slow wave activity.',

      footer1: 'A class assignment made for a lecture by Academician Norden E. Huang.',
      footer2: 'All EEG traces are synthesised from the sleep-medicine description of each stage, not patient data. Every algorithm is hand-written in vanilla JavaScript with no external library.',
      footer3: 'Language: '
    }
  };

  /* shared, language-independent bibliography */
  const REFS = [
    { n: 1, group: 1,
      cite: 'Huang, N. E., Shen, Z., Long, S. R., Wu, M. C., Shih, H. H., Zheng, Q., Yen, N.-C., Tung, C. C., & Liu, H. H. (1998).',
      title: 'The empirical mode decomposition and the Hilbert spectrum for nonlinear and non-stationary time series analysis.',
      where: 'Proceedings of the Royal Society of London A, 454(1971), 903–995.',
      doi: '10.1098/rspa.1998.0193' },
    { n: 2, group: 1,
      cite: 'Wu, Z., & Huang, N. E. (2009).',
      title: 'Ensemble Empirical Mode Decomposition: A Noise-Assisted Data Analysis Method.',
      where: 'Advances in Adaptive Data Analysis, 1(1), 1–41.',
      doi: '10.1142/S1793536909000047' },
    { n: 3, group: 1,
      cite: 'Huang, N. E., et al. (2016).',
      title: 'On Holo-Hilbert spectral analysis: a full informational spectral representation for nonlinear and non-stationary data.',
      where: 'Philosophical Transactions of the Royal Society A, 374(2065), 20150206.',
      doi: '10.1098/rsta.2015.0206' },
    { n: 4, group: 2,
      cite: 'Liu, C., Tan, B., Fu, M., Li, J., Wang, J., Hou, F., & Yang, A. (2021).',
      title: 'Automatic sleep staging with a single-channel EEG based on ensemble empirical mode decomposition.',
      where: 'Physica A, 567, 125685.',
      doi: '10.1016/j.physa.2020.125685' },
    { n: 5, group: 2,
      cite: 'Hassan, A. R., & Bhuiyan, M. I. H. (2017).',
      title: 'Automated identification of sleep states from EEG signals by means of ensemble empirical mode decomposition and random under sampling boosting.',
      where: 'Computer Methods and Programs in Biomedicine, 140, 201–210.',
      doi: '10.1016/j.cmpb.2016.12.015' },
    { n: 6, group: 2,
      cite: 'Hassan, A. R., & Bhuiyan, M. I. H. (2016).',
      title: 'Computer-aided sleep staging using complete ensemble empirical mode decomposition with adaptive noise and bootstrap aggregating.',
      where: 'Biomedical Signal Processing and Control, 24, 1–10.',
      doi: '10.1016/j.bspc.2015.09.002' },
    { n: 7, group: 3,
      cite: 'Caseiro, P., Fonseca-Pinto, R., & Andrade, A. (2010).',
      title: 'Screening of obstructive sleep apnea using Hilbert–Huang decomposition of oronasal airway pressure recordings.',
      where: 'Medical Engineering & Physics, 32(6), 561–568.',
      doi: '10.1016/j.medengphy.2010.01.008' },
    { n: 8, group: 3,
      cite: 'Ho, C.-N., Huang, N. E., Chen, J.-Y., & Yang, A. C. (2026).',
      title: 'Exploring Nociceptive–Analgesic Balance and EEG Modulation Patterns During General Anesthesia Using Holo-Hilbert Spectral Analysis.',
      where: 'Pain Research and Management.',
      doi: '10.1155/prm/5504074' },
    { n: null, group: 4,
      cite: 'Scientific Reports (2022).',
      title: 'Slow wave synchronization and sleep state transitions.',
      where: 'Scientific Reports.',
      doi: '10.1038/s41598-022-11513-0' }
  ];

  const I18N = { STR, REFS };
  if (typeof module !== 'undefined' && module.exports) module.exports = I18N;
  global.I18N = I18N;

})(typeof globalThis !== 'undefined' ? globalThis : this);
