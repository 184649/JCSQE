# 略語の正式名称を表示する解説更新 v15.9

各選択肢のキーワード解説を「略語・正式名称（英語）・日本語の意味・既存の用語説明」の順に拡張する。通常演習、本番校正の採点後、旧画面の演習で利用する。本文中にある関連略語も補足する。

例：FMEA = Failure Mode and Effects Analysis（故障モード影響解析）、GQM = Goal Question Metric（目標・質問・測定指標）。

ISOは英語の頭文字を並べた略語ではなく共通の短い名称である旨を注記。FPは分類指標と機能規模の文脈を区別。CD、MBD、MTTRなどの複数の使い方を一律に断定しない。Verification、Validation、AND、ORなどを架空の略語として展開しない。

`acronym-explanations.js` は解説レイヤーだけを拡張する。問題集、問題文、選択肢、正解、ID、採点・出題ロジック、保存キー・履歴形式は変更しない。モジュール自体にストレージ書き込みはない。辞書未登録の略語を推測で補わない。

本体バージョン15.7、キーワード解説15.8は維持し、`version.json`の`acronymVersion`で15.9を識別する。Service Workerの専用キャッシュを更新し、オフライン用アセットに追加する。

## 名称の確認に用いた主な一次資料

- ISO（組織名、ISOの由来）：https://www.iso.org/about
- ISO（QMS・ISMS）：https://www.iso.org/standard/76542.html
- ISO（SQuaRE）：https://committee.iso.org/sites/jtc1sc7/home/projects/flagship-standards/iso-25000-square-series.html
- CMMI Institute：https://cmmiinstitute.com/
- TMMi Foundation：https://www.tmmi.org/
- SEI（IDEAL）：https://www.sei.cmu.edu/library/the-ideal-model/
- SEI（PSP）：https://www.sei.cmu.edu/library/the-personal-software-process-psp/
- VDA（SPICE）：https://vda-qmc.de/en/automotive-spice/
- ASQ（FMEA）：https://asq.org/quality-resources/fmea
- ASQ（QFD）：https://asq.org/quality-resources/qfd-quality-function-deployment
- IEC（FTA）：https://webstore.iec.ch/en/publication/4311
- IEC（HAZOP）：https://webstore.iec.ch/en/publication/24321
- Basiliほか（GQM）：https://www.cs.umd.edu/users/mvz/handouts/gqm.pdf
- PMI（PMBOK）：https://www.pmi.org/standards/pmbok
- OMG（SysML）：https://www.omg.org/sysml/
- Microsoft（STRIDE）：https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats
- NIST（SaaS・PaaS・IaaS）：https://csrc.nist.gov/pubs/sp/800/145/final
- RFC 7252（CoAP・DTLS）：https://www.rfc-editor.org/info/rfc7252/
- Google（TP・FP・FN・TN）：https://developers.google.com/machine-learning/crash-course/classification/thresholding
- Google（AUC・ROC）：https://developers.google.com/machine-learning/crash-course/classification/roc-and-auc
- IBM（MTBF・MTTR）：https://cloud.ibm.com/docs/resiliency?topic=resiliency-understanding-ha

## 検査

`node --test tests/*.test.cjs` で全既存検査と、新規の略語対応・表記境界・重複防止・400問の非破壊性を確認する。`tests/acronym-browser-smoke.py` はローカルHTTP上のChromiumで、回答後の正式名称表示、回答前非表示、320px画面、再開・オフライン復帰、本番形式の提出後表示を確認する。実機iPhone/Safariでの確認とは区別する。
