/* ============================================================
   i18n.chapters.js — strings for the five chapters added after
   the first release. Merged into I18N.STR, which i18n.js must
   have defined first.
   ============================================================ */
'use strict';
(function (global) {
  const I = global.I18N;

  const EXTRA = {
    zh: {
      tab_ext: '01 局部極值',
      tab_env: '02 包絡線與端點',
      tab_sift: '03 篩選演算法',
      tab_lab: '04 訊號實驗室',
      tab_stage: '05 五個睡眠期',
      tab_spec: '06 傅立葉 vs 希爾伯特',
      tab_mix: '07 模態混合與 EEMD',
      tab_paper: '08 論文案例',

      /* ---- 01 局部極值 ---- */
      exTitle: '一切從「比較左右鄰居」開始',
      exIntro: 'EMD 沒有基底函數，它唯一的輸入是極值點的位置。判定方法簡單到近乎粗暴：' +
               '一個取樣點只要比左右兩個鄰居都大，就是局部極大值；都小就是局部極小值。' +
               '整個演算法的自適應性，全部來自這一步。',
      exFreq: '第二個成分的頻率',
      exAmp: '第二個成分的振幅',
      exPos: '檢查哪一點',
      exClick: '（也可以直接點圖上任一處）',
      exPanelTitle: '第 %1 點的判定',
      exNb: 'y[%1] = %2',
      exIsMax: '比左右鄰居都大 → 局部極大值',
      exIsMin: '比左右鄰居都小 → 局部極小值',
      exIsNone: '夾在鄰居之間 → 不是極值',
      exCount: '極大值 %1 個，極小值 %2 個，合計 %3 個極值',
      exZero: '過零 %1 次',
      exDiffOk: '|%1 − %2| = %3 ≤ 1，條件一成立',
      exDiffNo: '|%1 − %2| = %3 > 1，條件一不成立',
      exNote: '拉高第二個成分的頻率，極值點會迅速變多，而過零點不會同步增加——' +
              '兩者的差距正是 IMF 條件一在量的東西：一條曲線是不是「每個起伏都對稱地繞著零」。' +
              '這也是為什麼篩選必須反覆做：一次減去中線通常還不夠。',

      /* ---- 02 包絡線與端點 ---- */
      envTitle: '包絡線的兩端，是猜出來的',
      envIntro: '包絡線是把極值點用三次樣條連起來。問題在於：訊號的第一點和最後一點幾乎不會剛好是極值，' +
                '所以兩端那一段沒有資料可以內插，只能外推。這裡的測試訊號振幅隨時間線性上升，' +
                '因此它真正的上包絡線是已知的——你可以直接看到每種規則錯了多少。',
      envMode: '端點處理方式',
      envModeNone: '不處理',
      envModeLinear: '線性外推（本站預設）',
      envModeMirror: '鏡像延拓',
      envCut: '記錄長度',
      envModeDescNone: '樣條只穿過極值點，兩端讓自然邊界條件自由外推。自然樣條的二階導數在端點為零，' +
                       '所以延伸出去接近一條直線——對這個振幅線性上升的訊號剛好幾乎完全正確。',
      envModeDescLinear: '用最外側兩個同型極值做線性外推，再夾限在訊號值域與端點值之內。' +
                         '夾限會壓低包絡線，對這個訊號偏保守，但在驗收訊號上分解品質最好。',
      envModeDescMirror: 'Rilling 的鏡像邊界條件：把端點附近的極值對最外側極值鏡射，讓樣條永遠在內插。' +
                         '這是文獻最常見的做法。',
      envGap: '最後一個極大值在第 %1 點，距離結尾 %2 點——這 %2 點的上包絡完全是外推的。',
      envErr: '上包絡誤差：外側 10% 最大 <b>%1%</b>，內側 80% 最大 <b>%2%</b>',
      envTruthLeg: '真實上包絡',
      envNote: '三種規則在中段幾乎完全重合，只在兩端分岔——這就是端點效應：誤差從邊界產生，' +
               '再隨著每一輪篩選往內滲。也請注意沒有哪一種規則普遍最好：' +
               '在這個振幅上升的訊號上「不處理」反而最準，但在第五節的驗收訊號（13 Hz + 1.5 Hz）上，' +
               '線性外推讓 IMF3 之後的殘餘能量從 10.164% 降到 0.001%。規則要挑，得看訊號。',

      /* ---- 04 訊號實驗室 ---- */
      labTitle: '自己組一段訊號，看它怎麼被拆開',
      labIntro: '三個正弦成分，頻率與振幅都可以拉。拉完馬上做完整的 EMD。' +
                '這裡沒有預先算好的答案——你改一個數字，整串 IMF 就重算一次。',
      labComp: '成分 %1',
      labComp1: '成分 1', labComp2: '成分 2', labComp3: '成分 3',
      labFreq: '頻率',
      labAmp: '振幅',
      labNoise: '雜訊',
      labPreset: '預設組合',
      labPresetTwo: '兩個相距很遠的頻率',
      labPresetClose: '兩個相近的頻率',
      labPresetSlow: '慢波加快波',
      labReconTitle: '重建檢查',
      labRecon: '所有 IMF 加上殘量，與原訊號的最大誤差：<b>%1</b>（%2 個取樣點）',
      labReconNote: 'EMD 是完備的分解：不管你把參數調成什麼樣，加回去一定等於原訊號。' +
                    '這個誤差只會是浮點數的捨入等級。',
      labNote: '把兩個頻率拉到很接近（例如 4 Hz 與 5 Hz），EMD 會把它們併成同一條 IMF——' +
               '篩選是靠極值密度分層的，兩個太接近的成分在局部看起來就像一個被調變的成分。' +
               '一般的經驗法則是頻率比要大於約 2 倍才分得開。',

      /* ---- 07 模態混合與 EEMD ---- */
      mixTitle: '模態混合，以及用雜訊解決雜訊的問題',
      mixIntro: '一條 1 Hz 的慢波，加上只在幾個瞬間出現的快速爆發。' +
                '這種「間歇性」正是 EMD 最大的弱點：在有爆發的區段，篩選看到的是快波；' +
                '在沒有爆發的區段，它看到的是慢波。於是同一條 IMF1 裡混進了兩種完全不同的頻率。',
      mixBursts: '爆發次數',
      mixFreq: '爆發頻率',
      mixMethod: '分解方法',
      mixEns: '集成數',
      mixNoiseAmp: '加入雜訊（訊號標準差的倍數）',
      mixTrue: '真實的爆發成分',
      mixCorrTitle: 'IMF1 與真實爆發成分的相關係數',
      mixCorrEmd: 'EMD：<b>%1</b>',
      mixCorrEemd: 'EEMD（%1 組集成，雜訊 %2 σ）：<b class="hi">%3</b>',
      mixExplain: 'EEMD 的做法違反直覺：既然問題出在訊號在某些區段「沒有東西可以篩」，' +
                  '那就補上白雜訊，讓每個區段都有均勻分布的尺度可用。' +
                  '對很多組「原訊號 + 不同雜訊」各做一次 EMD，再把對應的 IMF 平均——' +
                  '雜訊互相抵消，真正的成分留下來［2］。Wu 與 Huang 特別指出雜訊必須是有限振幅、' +
                  '而非無限小，才能迫使集成窮盡所有可能解。',
      mixNote: '代價是：集成後的 IMF 不再完全正交，計算量乘上集成數，' +
               '而且雜訊振幅與集成數要自己調——拉拉看這兩個滑桿，相關係數會跟著變。',
      mixImf1: 'IMF1（最高頻的那一層）',

      /* ---- 08 論文案例 ---- */
      paperTitle: '這些方法在真實資料上做到什麼程度',
      paperIntro: '點開每一張卡片看細節。以下數字都出自論文本身，沒有推估。',
      paperExpand: '展開',
      paperCollapse: '收合',
      paperCompareTitle: '四分類 / 五分類準確率（文獻［4］）',
      thDataset: '資料庫', thFour: '四分類', thFive: '五分類',
      paperMethodEvo: '方法演化：EMD (1998) → EEMD (2009) → CEEMDAN (2016)。' +
                      '三者的差別都在同一件事上：如何處理模態混合。',
      papers: [
        {
          ref: 4,
          head: 'EEMD + XGBoost 的單導程自動睡眠分期',
          task: '用一條 EEG 通道判讀整夜睡眠分期，取代人工判讀。',
          method: '把 EEG 以 EEMD 分解，從原始訊號與各條 IMF 同時抽取統計特徵、時域特徵與' +
                  '非線性動力學特徵，交給 XGBoost，五折交叉驗證。',
          result: 'Sleep-EDF 四分類 93.1%、五分類 91.9%；DREAMS 86.4% / 83.4%；SHHS 87.5% / 85.8%。',
          point: '關鍵結論不是準確率本身，而是：IMF 導出的特徵確實提供了原始訊號以外的額外資訊。'
        },
        {
          ref: 7,
          head: '只用清醒時 5 分鐘的呼吸訊號篩檢睡眠呼吸中止',
          task: '常規 OSA 診斷需要整夜多導記錄；這篇問的是能不能只用清醒時段的短訊號篩檢。',
          method: '取清醒時 5 分鐘的口鼻氣道壓力訊號，以 HHT 抽取本質振盪模態，' +
                  '比較第一與第二模態的頻率分布。',
          result: '41 名受試者（非 OSA 20 人、OSA 21 人），兩組的模態頻率分布有顯著差異；' +
                  '所建指標在 95% 特異度下達 81.0% 敏感度。',
          point: '呼吸訊號本質上是非穩態的——這正是 HHT 相對於傅立葉的主場。'
        },
        {
          ref: 2,
          head: 'EEMD：用雜訊解決模態混合',
          task: '直接針對 EMD 的最大弱點：間歇性造成的模態混合。',
          method: '對「原訊號加白雜訊」的多組集成樣本各做一次完整篩選，再把對應的 IMF 平均。',
          result: '雜訊在平均中互相抵消，真實成分保留，模態混合大幅減輕。',
          point: '雜訊必須是有限振幅而非無限小，才能迫使集成窮盡所有可能解。' +
                 '第 07 章可以自己動手驗證這件事。'
        },
        {
          ref: 6,
          head: 'CEEMDAN + Bagging 的電腦輔助睡眠分期',
          task: '延續 [5] 的路線，把分解方法換成 CEEMDAN。',
          method: '完全集成經驗模態分解搭配自適應雜訊，再以 bootstrap aggregating 分類。',
          result: '與 [1][2] 並列，構成方法的演化軌跡：EMD → EEMD → CEEMDAN。',
          point: 'CEEMDAN 在每一階分解後才加入自適應雜訊，解決 EEMD 殘留雜訊與各集成 IMF 數不一致的問題。'
        },
        {
          ref: 8,
          head: '全希爾伯特譜分析用於全身麻醉下的 EEG',
          task: '分析麻醉深度與疼痛—鎮痛平衡的腦波調變模式。',
          method: '用 Holo-Hilbert 譜分析（HHSA），同時辨識振幅調變與頻率調變。',
          result: '黃鍔院士與台灣團隊的近期合作成果。',
          point: '論文指出傳統頻譜方法必須事先切定頻帶再帶通濾波，' +
                 '難以偵測不同振盪成分之間的非線性交互作用——這是改用 HHSA 的理由。'
        }
      ],
      paperTable: [
        ['Sleep-EDF', '93.1%', '91.9%'],
        ['DREAMS', '86.4%', '83.4%'],
        ['SHHS', '87.5%', '85.8%']
      ],

      /* ---- 03 的逐輪說明 ---- */
      p1Auto: '自動播放', p1AutoStop: '停止播放',
      p3Sweep: '自動掃描', p3SweepStop: '停止掃描',
      verdictNoWhy: '第 %1 輪的 h 還不是 IMF：%2。把 h 當作新訊號，回到步驟 1 再篩一次。',
      whyC1: '極值數與過零數相差 %1（要 ≤ 1）',
      whyC2: '包絡中線偏移 %1%（要 < 5%）',
      whyAnd: '；'
    },

    en: {
      tab_ext: '01 · Local extrema',
      tab_env: '02 · Envelopes and ends',
      tab_sift: '03 · The sifting algorithm',
      tab_lab: '04 · Signal lab',
      tab_stage: '05 · Five sleep stages',
      tab_spec: '06 · Fourier vs Hilbert',
      tab_mix: '07 · Mode mixing and EEMD',
      tab_paper: '08 · The papers',

      exTitle: 'It all starts with comparing two neighbours',
      exIntro: 'EMD has no basis functions. Its only input is where the extrema are, and the test for one is ' +
               'almost crude: a sample larger than both of its neighbours is a local maximum, smaller than both ' +
               'is a local minimum. The whole adaptiveness of the method comes from this one step.',
      exFreq: 'Frequency of the second component',
      exAmp: 'Amplitude of the second component',
      exPos: 'Sample to inspect',
      exClick: '(or just click anywhere on the plot)',
      exPanelTitle: 'The test at sample %1',
      exNb: 'y[%1] = %2',
      exIsMax: 'larger than both neighbours → local maximum',
      exIsMin: 'smaller than both neighbours → local minimum',
      exIsNone: 'between its neighbours → not an extremum',
      exCount: '%1 maxima, %2 minima, %3 extrema in total',
      exZero: '%1 zero crossings',
      exDiffOk: '|%1 − %2| = %3 ≤ 1, condition 1 holds',
      exDiffNo: '|%1 − %2| = %3 > 1, condition 1 fails',
      exNote: 'Raise the frequency of the second component and the extrema multiply while the zero crossings do ' +
              'not keep pace. That gap is exactly what IMF condition 1 measures: whether every oscillation of the ' +
              'curve is symmetric about zero. It is also why sifting has to repeat — subtracting the mean once is ' +
              'rarely enough.',

      envTitle: 'Both ends of an envelope are a guess',
      envIntro: 'An envelope is a cubic spline through the extrema. The trouble is that the first and last samples ' +
                'are almost never extrema, so the outer segments have nothing to interpolate between and must be ' +
                'extrapolated. The test signal here has a linearly rising amplitude, so its true upper envelope is ' +
                'known exactly — you can see how wrong each rule is.',
      envMode: 'Boundary treatment',
      envModeNone: 'none',
      envModeLinear: 'linear extrapolation (default here)',
      envModeMirror: 'mirror extension',
      envCut: 'Record length',
      envModeDescNone: 'The spline passes through the extrema only, and the natural boundary condition extrapolates ' +
                       'freely past them. A natural spline has zero second derivative at its ends, so it continues ' +
                       'almost as a straight line — which happens to be very nearly right for a linearly rising amplitude.',
      envModeDescLinear: 'Extrapolates linearly from the two outermost extrema of the same kind, then clamps the ' +
                         'result inside the signal range and the edge sample. The clamp pulls the envelope in, ' +
                         'which is conservative here but gave the cleanest decomposition on the verification signal.',
      envModeDescMirror: 'Rilling’s boundary conditions: the extrema near an edge are reflected about the ' +
                         'outermost one so the spline always interpolates. This is the usual choice in the literature.',
      envGap: 'The last maximum sits at sample %1, which is %2 samples before the end — that whole stretch of the upper envelope is extrapolated.',
      envErr: 'Upper-envelope error: outer 10% at most <b>%1%</b>, inner 80% at most <b>%2%</b>',
      envTruthLeg: 'true envelope',
      envNote: 'The three rules coincide in the middle and diverge only at the ends. That is the end effect: the ' +
               'error is born at the boundary and seeps inward with every sifting iteration. Note also that no rule ' +
               'wins everywhere — on this rising-amplitude signal, doing nothing is the most accurate, yet on the ' +
               'verification signal of section 5 (13 Hz + 1.5 Hz) linear extrapolation cut the leftover energy in ' +
               'IMF3 and beyond from 10.164% to 0.001%. Which rule to use depends on the signal.',

      labTitle: 'Build a signal and watch it come apart',
      labIntro: 'Three sinusoidal components, each with its own frequency and amplitude. Every change re-runs the ' +
                'full decomposition — nothing here is precomputed.',
      labComp: 'Component %1',
      labComp1: 'Component 1', labComp2: 'Component 2', labComp3: 'Component 3',
      labFreq: 'frequency',
      labAmp: 'amplitude',
      labNoise: 'Noise',
      labPreset: 'Presets',
      labPresetTwo: 'two well-separated frequencies',
      labPresetClose: 'two close frequencies',
      labPresetSlow: 'slow wave plus fast wave',
      labReconTitle: 'Reconstruction check',
      labRecon: 'Largest difference between the sum of all IMFs plus the residue and the original signal: <b>%1</b> (over %2 samples)',
      labReconNote: 'EMD is a complete decomposition: whatever you set the parameters to, adding the parts back gives ' +
                    'the signal again. This error is nothing but floating-point rounding.',
      labNote: 'Push two frequencies close together — say 4 Hz and 5 Hz — and EMD merges them into one IMF. Sifting ' +
               'separates by density of extrema, and two nearby components look locally like a single modulated one. ' +
               'The rule of thumb is that a frequency ratio above roughly 2 is needed for a clean split.',

      mixTitle: 'Mode mixing, and curing noise with noise',
      mixIntro: 'A 1 Hz carrier plus a fast burst that only exists for a moment at a time. That intermittency is the ' +
                'worst weakness of EMD: where the burst is present, sifting sees the fast wave; where it is absent, ' +
                'it sees the slow one. Two entirely different frequencies end up inside the same IMF1.',
      mixBursts: 'Number of bursts',
      mixFreq: 'Burst frequency',
      mixMethod: 'Method',
      mixEns: 'Ensemble size',
      mixNoiseAmp: 'Added noise (multiples of the signal sd)',
      mixTrue: 'the true burst component',
      mixCorrTitle: 'Correlation of IMF1 with the true burst component',
      mixCorrEmd: 'EMD: <b>%1</b>',
      mixCorrEemd: 'EEMD (%1 members, noise %2 σ): <b class="hi">%3</b>',
      mixExplain: 'The EEMD trick is counter-intuitive: if the problem is that some segments have nothing to sift, ' +
                  'add white noise so every segment has a uniform distribution of scales available. Decompose many ' +
                  'copies of "signal plus a different noise realisation" and average the corresponding IMFs — the ' +
                  'noise cancels and the real components survive [2]. Wu and Huang point out that the noise must be ' +
                  'of finite rather than infinitesimal amplitude to force the ensemble to exhaust the possible solutions.',
      mixNote: 'The costs: the averaged IMFs are no longer strictly orthogonal, the computation is multiplied by the ' +
               'ensemble size, and both the noise amplitude and the ensemble size have to be chosen by hand. Drag ' +
               'those two sliders and watch the correlation move.',
      mixImf1: 'IMF1 (the fastest layer)',

      paperTitle: 'How far these methods get on real data',
      paperIntro: 'Open a card for the detail. Every number below comes from the paper itself.',
      paperExpand: 'open',
      paperCollapse: 'close',
      paperCompareTitle: 'Four-class and five-class accuracy, from [4]',
      thDataset: 'Dataset', thFour: 'Four-class', thFive: 'Five-class',
      paperMethodEvo: 'The evolution of the method — EMD (1998) → EEMD (2009) → CEEMDAN (2016) — is the story of ' +
                      'one problem: what to do about mode mixing.',
      papers: [
        {
          ref: 4,
          head: 'Single-channel automatic sleep staging with EEMD and XGBoost',
          task: 'Score a whole night of sleep from one EEG channel instead of by hand.',
          method: 'Decompose the EEG with EEMD, then take statistical, time-domain and nonlinear-dynamic features ' +
                  'from the raw signal and from each IMF together, and classify with XGBoost under five-fold cross-validation.',
          result: 'Sleep-EDF 93.1% four-class and 91.9% five-class; DREAMS 86.4% / 83.4%; SHHS 87.5% / 85.8%.',
          point: 'The finding that matters is not the accuracy itself but that IMF-derived features carry information the raw signal does not.'
        },
        {
          ref: 7,
          head: 'Screening for sleep apnoea from five waking minutes of breathing',
          task: 'Routine OSA diagnosis needs a whole night of polysomnography. This asks whether a short waking recording can screen instead.',
          method: 'Five minutes of oronasal airway pressure recorded while awake, decomposed with the HHT; the frequency ' +
                  'distributions of the first and second modes are compared.',
          result: 'Across 41 subjects (20 non-OSA, 21 OSA) the two groups differed significantly, and the derived index ' +
                  'reached 81.0% sensitivity at 95% specificity.',
          point: 'Respiratory signals are non-stationary by nature, which is exactly where the HHT beats Fourier.'
        },
        {
          ref: 2,
          head: 'EEMD: curing mode mixing with noise',
          task: 'Aimed straight at the biggest weakness of EMD — the mode mixing caused by intermittency.',
          method: 'Sift each member of an ensemble of "signal plus white noise" copies, then average the corresponding IMFs.',
          result: 'The noise cancels in the average, the real components survive, and mode mixing is greatly reduced.',
          point: 'The noise must be of finite, not infinitesimal, amplitude to force the ensemble to exhaust the possible ' +
                 'solutions. Chapter 07 lets you verify this yourself.'
        },
        {
          ref: 6,
          head: 'Computer-aided sleep staging with CEEMDAN and bagging',
          task: 'Continues from [5], swapping the decomposition for CEEMDAN.',
          method: 'Complete ensemble empirical mode decomposition with adaptive noise, classified with bootstrap aggregating.',
          result: 'Read alongside [1] and [2], it completes the arc: EMD → EEMD → CEEMDAN.',
          point: 'CEEMDAN adds adaptive noise after each stage of the decomposition, which fixes the residual noise and the ' +
                 'inconsistent IMF counts that EEMD leaves behind.'
        },
        {
          ref: 8,
          head: 'Holo-Hilbert spectral analysis of EEG under general anaesthesia',
          task: 'Characterise EEG modulation patterns and the nociceptive–analgesic balance during anaesthesia.',
          method: 'Holo-Hilbert spectral analysis, which identifies amplitude modulation and frequency modulation at once.',
          result: 'A recent collaboration between Huang and a Taiwanese group.',
          point: 'The paper notes that conventional spectral methods must fix the frequency bands and band-pass filter first, ' +
                 'which makes nonlinear interactions between oscillatory components hard to detect — hence HHSA.'
        }
      ],
      paperTable: [
        ['Sleep-EDF', '93.1%', '91.9%'],
        ['DREAMS', '86.4%', '83.4%'],
        ['SHHS', '87.5%', '85.8%']
      ],

      p1Auto: 'Play', p1AutoStop: 'Stop',
      p3Sweep: 'Auto sweep', p3SweepStop: 'Stop',
      verdictNoWhy: 'The h of round %1 is not an IMF yet: %2. It becomes the new signal, and we sift again from step 1.',
      whyC1: 'extrema and zero crossings differ by %1 (needs ≤ 1)',
      whyC2: 'the envelope mean is off by %1% (needs < 5%)',
      whyAnd: '; '
    }
  };

  Object.assign(I.STR.zh, EXTRA.zh);
  Object.assign(I.STR.en, EXTRA.en);

  if (typeof module !== 'undefined' && module.exports) module.exports = EXTRA;

})(typeof globalThis !== 'undefined' ? globalThis : this);
