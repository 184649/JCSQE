# v15.8 選択肢ごとのキーワード解説

## 表示変更

連続演習と本番校正の採点後に、表示されているA〜D順で「各選択肢のキーワード解説」を展開します。正解かどうかより先に、その用語の正しい意味を学べる構成です。「今回の判断」「計算手順」「関連知識」は別の折り畳み欄に残します。

組合せ問題では各用語を個別に説明します。誤った用語と定義の組合せを、その用語の正しい定義として表示しません。数値の選択肢には無理に別のキーワードを割り当てず、求めている指標の意味・式を共通の基準として説明します。

旧画面の通常演習・問題道場・3周コースでは、表示用の説明文へ各選択肢のキーワード説明を追加します。旧画面の選択肢はシャッフルされるため、本文側では固定のA〜Dを使わず選択肢の本文を見出しにします。

## 保持するもの

問題文・選択肢・正解・ID・出題順ロジック・採点・履歴形式・保存キーを変更しません。既存の問題集を削除・再生成しません。解説モジュールにはlocalStorageの書き込み処理がありません。回答前および本番校正の提出前には解説を表示しません。

定義は既存のシラバス用語集を基礎とし、説明に必要なMTTR・管理図の種類・網羅基準などを補足しています。未登録の用語を推測して断定する代わりに、未確認と表示します。

## 参照資料（定義の補足確認）

- NASA Product Verification: https://www.nasa.gov/reference/5-3-product-verification/
- NASA Product Validation: https://www.nasa.gov/reference/5-4-product-validation/
- ASQ FMEA: https://asq.org/quality-resources/fmea
- IEC 61025 公開概要: https://webstore.iec.ch/en/publication/4311
- NIST Attributes Control Charts: https://www.itl.nist.gov/div898/handbook/pmc/section3/pmc33.htm
- ASQ Quality Glossary: https://asq.org/quality-resources/quality-glossary

## 確認方法

`node --test tests/keyword-explanations.test.cjs` は実データ全400問の選択肢対応、定義の取り違え、非破壊性を確認します。`tests/keyword-browser-smoke.py` はChromiumで表示、解答前非表示、シャッフル、再開、オフライン表示を確認します。実行結果はGitHub Actionsを参照してください。実機Safariの動作は別途確認が必要です。
