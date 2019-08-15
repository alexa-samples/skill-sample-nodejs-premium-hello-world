# プレミアムハローワールド　- スキル内課金を使ったスキルの作成
<img src="https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/quiz-game/header._TTH_.png" />

## スキルの認定と公開

スキルの公開までもう少しです。 最後のステップは [Alexaスキルストア](http://www.amazon.co.jp/skills) で利用されるメタデータの追加です。 このページで必要な手順を解説します。

1. 上部のメニューから **公開** タブを開きます。

2. 画面上のガイダンスに従ってそれぞれのフィールドを記入する。

    (？) マークにマウスカーソルをあてると、そのフィールドのヘルプがポップアップ表示されます。 **アスタリスクマークのついたフィールドは必須です**
	* 審査を無事通過させるため、時間をとって正確な記入をお願いします。

3.  **スキルの説明**を記入する。

	魅力的で簡潔な説明文を入力してください。 説明文はユーザにあなたのスキルの魅力を伝えるためのものです。 最大限に活用しましょう。 これらの説明文は [Alexaアプリ](http://alexa.amazon.co.jp/spa/index.html#skills) と[Alexaスキルストア](http://www.amazon.co.jp/skills) のスキル一覧ページに表示されます。

4.  **サンプルフレーズ** を入力する。

    ユーザーがスキルに話しかけるときに最も使われそうなフレーズを3つ入力します。

    *  **サンプルフレーズ** には、サンプル発話と完全に一致するものを入力してください。 ここを間違えてしまったことで審査が通らなかったという例がよくあります。以下にサンプルフレーズを書くときに考慮すべき事項を記載しておきます。

       | サンプルフレーズを入力する際に考慮すべき事項 |
       | ----------------------------------------- |
       | サンプルフレーズは [ユーザーによるカスタムスキルの呼び出し](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/supported-phrases-to-begin-a-conversation) に書かれているルールに沿っていること。 |
       | サンプルフレーズは対話モデルで定義した **サンプル発話** に基づいたものであること。 |
       | 1番目のサンプルフレーズは **ウェイクワードと呼び出し名** を含んでいること。 |
       | サンプルフレーズは **適切な応答を返す** ものであること。 |

    *  ユーザーがスキルに話しかけるときに、最も使いそうなフレーズを3つ選んでください。 どのフレーズも正常に動作し、素晴らしいユーザー体験を提供するようにしてください。

5.  オリジナルの **スキルアイコン** を作成する。

    スキルのアイコンは **108x108** ピクセルと **512x512** ピクセルの2通りのサイズを用意する必要があります。

    *  自分が権利を保有するオリジナルのアイコンを作成してください。商標やコピーライトを侵害しないようにしてください。
    *  アイコンを作成するソフトウェアをお持ちでない場合は、以下のような無料ソフトから選ぶと良いでしょう。

       * [Alexa Skill Icon Builder](https://developer.amazon.com/docs/tools/icon-builder.html)
       * [GIMP](https://www.gimp.org/) (Windows/Mac/Linux)
       * [Paint.NET](http://www.getpaint.net/index.html) (Windows)
       * [Inkscape](http://inkscape.org) (Windows/Mac/Linux)
       * [Iconion](http://iconion.com/) (Windows/Mac)

    *  各サイズのブランクのアイコンを様々なフォーマットでご用意しました。よろしければお使いください。

       *  [PSD](https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/general/icon-templates/psd.zip)
       *  [PNG](https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/general/icon-templates/png.zip)
       *  [GIF](https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/general/icon-templates/gif.zip)
       *  [PDF](https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/general/icon-templates/pdf.zip)
       *  [JPG](https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/general/icon-templates/jpg.zip)
       *  [SVG](https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/general/icon-templates/svg.zip)
       *  [PDN](https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/general/icon-templates/pdn.zip) - [Paint.NET](http://www.getpaint.net/index.html)用
       *  [XCF](https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/general/icon-templates/xcf.zip) - [GIMP](https://www.gimp.org/)用

6. スキルのカテゴリーとして最も適切なものを選んでください。

7.  **キーワード** ユーザーがスキルを探すときに使うであろうキーワードを全て入力します。

    この項目は任意です。 [Alexaアプリ](http://alexa.amazon.co.jp)　での検索ではスキル名や説明文にある単語も検索対象となるため、入力を省略しても問題ありません。 スキルを探すときにユーザーに使って欲しい単語がある場合は、それらのキーワードを入力してください。 複数のキーワードはカンマで区切ってください。

8. **プライバシーポリシー URL** 

    必須項目ではありませんが、必要に応じて設定してください。

9. **利用規約 URL** 

    必須項目ではありませんが、必要に応じて設定してください。

10. 入力が完成したらページ下部の **保存して続行** ボタンをクリックし、**プライバシーとコンプライアンス** へ移動します。

11.  **プライバシーとコンプライアンス** の質問には、下記のガイダンスに従いながら答えてください。
      * **このスキルを使って何かを購入したり、実際にお金を支払うことができますか？**

        今回のプレミアムトリビアスキルでは、**はい** を選択します。将来、あなたが作るスキルに適したオプションを選択してください。

      * **このスキルはユーザーの個人情報を収集しますか？** 
    
        これについても今回のレミアムトリビアスキルでは、 **いいえ** を選択します。 もし、ユーザーの個人情報、例えば氏名やメールアドレス、電話番号等を収集しているのであれば、この質問に**はい**と答えてください。
 
        *  この質問に **はい**と答えた場合、プライバシーポリシーへのリンクを提供する必要があります。

      *  **このスキルは13際未満の子供を対象としたものですか？** 
    
         このスキルのデータはあなたが用意したデータでカスタマイズされているので、13際未満の子供を対象にしているかもしれません。カスタマイズする前の状態のプレミアムトリビアは特定の年齢層をターゲットとしたものではないので、 **いいえ** を選択します。
        * このスキルが13際未満の子供向けかどうかを判断すには、以下の要素を考慮してみてください。
            * スキルのテーマ
            * 子供向けの内容が含まれているか
            * スキル内の言葉遣い
            * スキル内で利用されている音楽やその他おオーディオコンテンツ
            * スキルがどのように説明されマーケティングされるか
            * スキルの想定利用者層
            
12.  **輸出コンプライアンス** 

     全ての項目に同意できるか確認してください。 同意する場合はボックスにチェックをつけてください。 Amazonがスキルを配布するためには、ここでの同意が必要です。

13.  **テストの手順** 

     この欄は、あなたのスキルや、特殊だったり混乱しがちな機能を、審査チームに対して説明する機会となります。

      * 今回はサンプルを使用しているので、テストの手順にその旨を記述してください。例:

           ```
           これはプレミアムトリビアサンプルをもとに作成しました。
           ```

         これによりテストチームがスキルの構造を理解しテスト時間を節約することができます。

        > 注意: 認証の詳細は [こちら](https://alexa.design/certification) をご参照ください。

14. ベータテストを実施してください。詳しくは [こちら](https://alexa.design/skillbetatesting) をご参照ください。

    > 注意: ベータテストでは、ベータテスターはスキル内課金で決済しても、実際の支払いは発生しません。

15. ここまで準備ができたら **保存して続行** ボタンをクリックします。次に認定タブに移ります。

16. **検証**ページでは、スキル公開申請に必要な入力のステップが不足している場合、その通知がなされます。通常はこのページには何も表示されませんが、もし表示されている場合は、戻って問題を修正してください。

18. 次に**機能テスト**をクリックして画面を開き、**実行**ボタンをクリックします。スキルに対する機能テストが実行されます。 通常はこのページには何も表示されませんが、もし表示されている場合は、戻って問題を修正してください。

19. 最後に**申請**をクリックして、**はい、審査を申請します**ボタンをクリックします。

16. お疲れさまでした。これで **申請完了です!**

    *  **認定には数日かかります。** 審査が完了するまでしばらくお待ちください。

    *  [スキル開発者への特典](https://developer.amazon.com/ja/alexa-skills-kit/alexa-developer-skill-promotion?&sc_category=Owned&sc_channel=RD&sc_campaign=Evangelism2018&sc_publisher=github&sc_content=Survey&sc_detail=fact-nodejs-V2_GUI-6&sc_funnel=Convert&sc_country=WW&sc_medium=Owned_RD_Evangelism2018_github_Survey_fact-nodejs-V2_GUI-6_Convert_WW_beginnersdevs&sc_segment=beginnersdevs) 
    もございますので、ご参照ください。
