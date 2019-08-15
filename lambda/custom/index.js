const Alexa = require('ask-sdk');
const skillName = 'プレミアムハローワールド';

const LaunchRequestHandler = {
	canHandle(handlerInput) {
		return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
	},
	handle(handlerInput) {
		const speechText = `ようこそ${skillName}へ。「こんにちは」と言ってみてください。どうぞ！`;

		return handlerInput.responseBuilder
			.speak(speechText)
			.reprompt(speechText)
			.withSimpleCard(skillName, speechText)
			.getResponse();
	},
};

const GetAnotherHelloHandler = {
	canHandle(handlerInput) {
		return (
			handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
			(handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent' ||
				handlerInput.requestEnvelope.request.intent.name === 'SimpleHelloIntent'));
	},
	async handle(handlerInput) {
		const locale = handlerInput.requestEnvelope.request.locale;
		const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
		let preSpeechText = '';

		return await monetizationClient.getInSkillProducts(locale).then(function (res) {
			// ユーザーが商品を既に購入済みかどうかによって、応答を決定するヘルパー関数 getResponseBasedOnAccessType を呼ぶ
			return getResponseBasedOnAccessType(handlerInput, res, preSpeechText);
		});
	}
};

const NoIntentHandler = {
	canHandle(handlerInput) {
		return (
			handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
			handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent'
		);
	},
	handle(handlerInput) {
		const speechText = getRandomGoodbye();
		return handlerInput.responseBuilder
			.speak(speechText)
			.getResponse();
	}
};

// 「何が買える？」と聞かれた時の応答
const WhatCanIBuyIntentHandler = {
	canHandle(handlerInput) {
		return (handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
			handlerInput.requestEnvelope.request.intent.name === 'WhatCanIBuyIntent');
	},
	async handle(handlerInput) {
		// スキル内課金で購入できる商品のリストを入手する
		const locale = handlerInput.requestEnvelope.request.locale;
		const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
		return await monetizationClient.getInSkillProducts(locale).then(function (res) {
			// res にはスキルで提供する全てのISP商品のリストが含まれる
			// ここでは、JavaScriptのフィルターを使って、購入可能(PURCHASABLE)かつ未購入(NOT_ENTITLED)の商品のリストを抽出する
			const purchasableProducts = res.inSkillProducts.filter(
				record => record.entitled === 'NOT_ENTITLED' &&
					record.purchasable === 'PURCHASABLE'
			);

			// 購入可能な商品を言う。
			if (purchasableProducts.length > 0) {
				// 一つ以上の商品を購入可能な場合、商品のリストを繋げて言う
				const speechText = `現在、購入できる商品は、${getSpeakableListOfProducts(purchasableProducts)} です。
							詳しく知りたい場合は、例えば「挨拶パックについて詳しく教えて。」と言ってください。
							今すぐ購入したい場合は、例えば「プレミアムサブスクリプションを購入。」と言ってください。
							ほかの挨拶を聞きたい場合は、「こんにちは」と言ってください。どうしますか？`;
				const repromptOutput = 'すみません、もう一度言ってください';
				return handlerInput.responseBuilder
					.speak(speechText)
					.reprompt(repromptOutput)
					.getResponse();
			}
			else {
				// 購入できる商品がない場合。他の挨拶を聞きたいかどうかを尋ねる。
				const speechText = '購入できる商品はありません。ほかの挨拶を聞きますか？';
				const repromptOutput = '他の挨拶を聞きたいですか？';
				return handlerInput.responseBuilder
					.speak(speechText)
					.reprompt(repromptOutput)
					.getResponse();
			}
		});
	}
};

const BuyGreetingsPackIntentHandler = {
	canHandle(handlerInput) {
		return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
			handlerInput.requestEnvelope.request.intent.name === 'BuyGreetingsPackIntent';
	},
	async handle(handlerInput) {
		const locale = handlerInput.requestEnvelope.request.locale;
		const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

		return await monetizationClient.getInSkillProducts(locale).then(function (res) {
			// 購入可能な商品リストをフィルターして、参照名が "Greetings_Pack" の商品を抽出する。
			const greetingsPackProduct = res.inSkillProducts.filter(
				record => record.referenceName === 'Greetings_Pack'
			);

			const premiumSubscriptionProduct = res.inSkillProducts.filter(
				record => record.referenceName === 'Premium_Subscription'
			);

			if (isEntitled(premiumSubscriptionProduct)) {
				// ユーザーはPremium Subscriptionを購入済。Greetings Packを購入する必要はない。
				const speechText = `既にプレミアムサブスクリプションを購入しています。挨拶パックの全ての機能をご利用いただけます。 ${getRandomYesNoQuestion()}`;
				const repromptOutput = `${getRandomYesNoQuestion()}`;

				return handlerInput.responseBuilder
					.speak(speechText)
					.reprompt(repromptOutput)
					.getResponse();
			}
			else if (isEntitled(greetingsPackProduct)) {
				// ユーザーはGreetings Packを購入済。他国の挨拶を提供
				const speechText = `既に挨拶パックを購入しています。 ${getRandomYesNoQuestion()}`;
				const repromptOutput = `${getRandomYesNoQuestion()}`;

				return handlerInput.responseBuilder
					.speak(speechText)
					.reprompt(repromptOutput)
					.getResponse();
			}
			else {
				// ユーザーはPremium SubscriptionもGreetings Packも未購入
				// Greetings Packの購入をオススメする。
				return makeBuyOffer(greetingsPackProduct, handlerInput);
			}
		});
	}
};

const GetSpecialGreetingsIntentHandler = {
	canHandle(handlerInput) {
		return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
			handlerInput.requestEnvelope.request.intent.name === 'GetSpecialGreetingsIntent';
	},
	async handle(handlerInput) {
		const locale = handlerInput.requestEnvelope.request.locale;
		const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

		return await monetizationClient.getInSkillProducts(locale).then(function (res) {
			// 購入可能な商品リストをフィルターして、参照名が "Greetings_Pack" の商品を抽出する。
			const greetingsPackProduct = res.inSkillProducts.filter(
				record => record.referenceName === 'Greetings_Pack'
			);

			console.log("GREETING_PACK=" + JSON.stringify(greetingsPackProduct));

			const premiumSubscriptionProduct = res.inSkillProducts.filter(
				record => record.referenceName === 'Premium_Subscription'
			);

			console.log("PREMIUM SUBSCRIPTION=" + JSON.stringify(premiumSubscriptionProduct));

			if (isEntitled(premiumSubscriptionProduct)) {
				// ユーザーはPremium Subscriptionを購入済。Greetings Packを購入する必要はない。
				const speechText = `プレミアムサブスクリプションを購入しています。挨拶パックの全ての機能をご利用いただけます。 ${getRandomYesNoQuestion()}`;
				const repromptOutput = `${getRandomYesNoQuestion()}`;

				return handlerInput.responseBuilder
					.speak(speechText)
					.reprompt(repromptOutput)
					.getResponse();
			}
			else if (isEntitled(greetingsPackProduct)) {
				// ユーザーはGreetings Packを購入済. 他国の挨拶を提供
				const speechText = `挨拶パックを購入しています。 ${getRandomYesNoQuestion()}`;
				const repromptOutput = `${getRandomYesNoQuestion()}`;

				return handlerInput.responseBuilder
					.speak(speechText)
					.reprompt(repromptOutput)
					.getResponse();
			}
			else {
				// ユーザーはPremium SubscriptionもGreetings Packも未購入
				// アップセルする
				const speechText = 'いろんな国の挨拶を聞くには、挨拶パックが必要です。';
				return makeUpsell(speechText, greetingsPackProduct, handlerInput);
			}
		});
	}
};

const BuyPremiumSubscriptionIntentHandler = {
	canHandle(handlerInput) {
		return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
			handlerInput.requestEnvelope.request.intent.name === 'BuyPremiumSubscriptionIntent';
	},
	async handle(handlerInput) {
		const locale = handlerInput.requestEnvelope.request.locale;
		const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

		return await monetizationClient.getInSkillProducts(locale).then(function (res) {
			// 購入可能な商品リストをフィルターして、参照名が "Premium_Subscription" の商品を抽出する。
			const premiumSubscriptionProduct = res.inSkillProducts.filter(
				record => record.referenceName === 'Premium_Subscription'
			);

			console.log("SUBSCRIPTION_PRODUCT=" + JSON.stringify(premiumSubscriptionProduct))

			// Alexaの Connections.SendRequest ディレクティブに送信し、購入フローへ処理を渡す
			return makeBuyOffer(premiumSubscriptionProduct, handlerInput);
		});
	}
};

const BuyResponseHandler = {
	canHandle(handlerInput) {
		return handlerInput.requestEnvelope.request.type === 'Connections.Response' &&
			(handlerInput.requestEnvelope.request.name === 'Buy' ||
				handlerInput.requestEnvelope.request.name === 'Upsell');
	},
	async handle(handlerInput) {
		const locale = handlerInput.requestEnvelope.request.locale;
		const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
		const productId = handlerInput.requestEnvelope.request.payload.productId;

		return await monetizationClient.getInSkillProducts(locale).then(function (res) {

			const product = res.inSkillProducts.filter(
				record => record.productId === productId
			);

			if (handlerInput.requestEnvelope.request.status.code === '200') {
				let preSpeechText;

				// 購入ステータスのチェック 
				// 購入した(ACCEPTED), 購入しなかった(DECLINED), 既に購入済み(ALREADY_PURCHASED), その他のエラー
				switch (handlerInput.requestEnvelope.request.payload.purchaseResult) {
					case 'ACCEPTED':
						preSpeechText = getBuyResponseText(product[0].referenceName, product[0].name);
						break;
					case 'DECLINED':
						preSpeechText = 'わかりました。';
						break;
					case 'ALREADY_PURCHASED':
						preSpeechText = getBuyResponseText(product[0].referenceName, product[0].name);
						break;
					default:
						preSpeechText = `うまく行かなかったようですが、${product[0].name} にご興味をいただき、ありがとうございました。`;
						break;
				}
				// ユーザーに応答を返す
				return getResponseBasedOnAccessType(handlerInput, res, preSpeechText);
			}
			else {
				// リクエストのステータスコードが200でなかった場合、コネクションに何らかのエラーが発生
				console.log(
					`Connections.Response indicated failure. error: + ${handlerInput.requestEnvelope.request.status.message}`
				);
				return handlerInput.responseBuilder
					.speak('購入リクエストの処理中に何らかのエラーが起きました。もう一度やってみるか、お問い合わせください。')
					.getResponse();
			}
		});
	}
};

const PurchaseHistoryIntentHandler = {
	canHandle(handlerInput) {
		return (
			handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
			handlerInput.requestEnvelope.request.intent.name === 'PurchaseHistoryIntent'
		);
	},
	async handle(handlerInput) {
		const locale = handlerInput.requestEnvelope.request.locale;
		const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

		return await monetizationClient.getInSkillProducts(locale).then(function (res) {
			const entitledProducts = getAllEntitledProducts(res.inSkillProducts);
			if (entitledProducts && entitledProducts.length > 0) {
				const speechText = `次の商品を購入しています。${getSpeakableListOfProducts(entitledProducts)}です。 ${getRandomYesNoQuestion()}`;
				const repromptOutput = `購入履歴をお調べします。現在 ${getSpeakableListOfProducts(entitledProducts)} を購入しています。`;

				return handlerInput.responseBuilder
					.speak(speechText)
					.reprompt(repromptOutput)
					.getResponse();
			}
			else {
				const speechText = 'まだ何も購入していません。購入できる商品について詳しく知りたい場合は、「何が買える？」と言ってください。どうしますか？';
				const repromptOutput = `購入履歴をお調べしましたが、まだ何も購入していないようです。購入できるものを知りたい場合は、「何が買える？」と言ってください。ほかの挨拶を聞きたい場合は「はい」
				と言ってください。${getRandomYesNoQuestion()}`;
				return handlerInput.responseBuilder
					.speak(speechText)
					.reprompt(repromptOutput)
					.getResponse();
			}
		});
	}
};

const RefundGreetingsPackIntentHandler = {
	canHandle(handlerInput) {
		return (
			handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
			handlerInput.requestEnvelope.request.intent.name === 'RefundGreetingsPackIntent'
		);
	},
	async handle(handlerInput) {
		const locale = handlerInput.requestEnvelope.request.locale;
		const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

		return await monetizationClient.getInSkillProducts(locale).then(function (res) {
			const premiumProduct = res.inSkillProducts.filter(
				record => record.referenceName === 'Greetings_Pack'
			);
			return handlerInput.responseBuilder
				.addDirective({
					type: 'Connections.SendRequest',
					name: 'Cancel',
					payload: {
						InSkillProduct: {
							productId: premiumProduct[0].productId
						}
					},
					token: 'correlationToken'
				})
				.getResponse();
		});
	}
};

const CancelPremiumSubscriptionIntentHandler = {
	canHandle(handlerInput) {
		return (
			handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
			handlerInput.requestEnvelope.request.intent.name === 'CancelPremiumSubscriptionIntent'
		);
	},
	async handle(handlerInput) {
		const locale = handlerInput.requestEnvelope.request.locale;
		const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

		return await monetizationClient.getInSkillProducts(locale).then(function (res) {
			const premiumProduct = res.inSkillProducts.filter(
				record => record.referenceName === 'Premium_Subscription'
			);
			return handlerInput.responseBuilder
				.addDirective({
					type: 'Connections.SendRequest',
					name: 'Cancel',
					payload: {
						InSkillProduct: {
							productId: premiumProduct[0].productId
						}
					},
					token: 'correlationToken'
				})
				.getResponse();
		});
	}
};

const CancelProductResponseHandler = {
	canHandle(handlerInput) {
		return handlerInput.requestEnvelope.request.type === 'Connections.Response' &&
			handlerInput.requestEnvelope.request.name === 'Cancel';
	},
	async handle(handlerInput) {
		const locale = handlerInput.requestEnvelope.request.locale;
		const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
		const productId = handlerInput.requestEnvelope.request.payload.productId;
		let speechText;
		let repromptOutput;

		return await monetizationClient.getInSkillProducts(locale).then(function (res) {
			const product = res.inSkillProducts.filter(
				record => record.productId === productId
			);

			console.log(
				`PRODUCT = ${JSON.stringify(product)}`
			);

			if (handlerInput.requestEnvelope.request.status.code === '200') {
				// Alexaはキャンセルリクエストを送ると、すぐに音声で応答します。
				// そして、CancelProductResponseHandler()にコントロールを渡します。このとき、(ACCEPTED, DECLINED, NOT_ENTITLED)のいずれかのステータスコードが含まれます。
				// ステータコードによって、Alexaのキャンセル応答の最後に付け加えるスピーチの内容を切り替えます。
				// ここでは、ステータスが(ACCEPTED, DECLINED, NOT_ENTITLED)のいずれの場合でも同じスピーチを付け加えています。必要に応じて変更してください。
				if (handlerInput.requestEnvelope.request.payload.purchaseResult === 'ACCEPTED') {
					// キャンセルの確認の応答はAlexaの購入フローが行います。
					// ここでは、単純にgetRandomYesNoQuestion()を追加しています。
					speechText = `${getRandomYesNoQuestion()}`;
					repromptOutput = getRandomYesNoQuestion();
				}
				else if (handlerInput.requestEnvelope.request.payload.purchaseResult === 'DECLINED') {
					speechText = `${getRandomYesNoQuestion()}`;
					repromptOutput = getRandomYesNoQuestion();
				}
				else if (handlerInput.requestEnvelope.request.payload.purchaseResult === 'NOT_ENTITLED') {
					// キャンセルできるサブスクリプションがない場合。
					// 「キャンセルできるサブスクリプションがありません」という応答は、Alexaの購入フローが行います。
					// ここでは、単純にgetRandomYesNoQuestion()を追加しています。
					speechText = `${getRandomYesNoQuestion()}`;
					repromptOutput = getRandomYesNoQuestion();
				}
				return handlerInput.responseBuilder
					.speak(speechText)
					.reprompt(repromptOutput)
					.getResponse();
			}
			// 何らかのエラーが発生
			console.log(
				`Connections.Response indicated failure. error: ${handlerInput.requestEnvelope.request.status.message}`
			);

			return handlerInput.responseBuilder
				.speak('キャンセルの処理中に何らかのエラーが起きました。もう一度やってみるか、お問い合わせください。')
				.getResponse();
		});
	},
};

const HelpIntentHandler = {
	canHandle(handlerInput) {
		return handlerInput.requestEnvelope.request.type === 'IntentRequest'
			&& handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
	},
	handle(handlerInput) {
		const speechText = '「こんにちは」と言ってみてください。どうぞ！';

		return handlerInput.responseBuilder
			.speak(speechText)
			.reprompt(speechText)
			.withSimpleCard(skillName, speechText)
			.getResponse();
	},
};

const CancelAndStopIntentHandler = {
	canHandle(handlerInput) {
		return handlerInput.requestEnvelope.request.type === 'IntentRequest'
			&& (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
				|| handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
	},
	handle(handlerInput) {
		const speechText = getRandomGoodbye();

		return handlerInput.responseBuilder
			.speak(speechText)
			.withSimpleCard(skillName, speechText)
			.getResponse();
	},
};

const SessionEndedRequestHandler = {
	canHandle(handlerInput) {
		return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
	},
	handle(handlerInput) {
		console.log(
			`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`
		);

		return handlerInput.responseBuilder.getResponse();
	},
};

const ErrorHandler = {
	canHandle() {
		return true;
	},
	handle(handlerInput, error) {
		console.log(
			`Error handled: ${error.message}`
		);

		return handlerInput.responseBuilder
			.speak('すみません。ちょっとよくわかりませんでした。もう一度言ってください。')
			.reprompt('すみません。もう一度お願いします。')
			.getResponse();
	},
};

// *****************************************
// ************** ヘルパー関数 ***************
// *****************************************

function randomize(array) {
	const randomItem = array[Math.floor(Math.random() * array.length)];
	return randomItem;
}

function getSimpleHello() {
	const simple_greetings = [
		'お元気ですか？',
		'ご機嫌いかが？',
		'おはようございます！',
		'お疲れ様です！'
	];
	return simple_greetings[
		Math.floor(Math.random() * simple_greetings.length)
	];
}

function getSpecialHello() {
	const special_greetings = [
		{ language: 'フランス語', greeting: 'Bonjour', lang: 'fr-FR' },
		{ language: 'スペイン語', greeting: 'Hola', lang: 'es-ES' },
		{ language: 'ドイツ語', greeting: 'Hallo', lang: 'de-DE' },
		{ language: '英語', greeting: 'Hello', lang: 'en-US' },
		{ language: 'イタリア語', greeting: 'Ciao', lang: 'it-IT' }
	];
	return randomize(special_greetings);
}

function getRandomGoodbye() {
	const goodbyes = [
		// 日本語のスピーチコンを返す
		// https://developer.amazon.com/ja/docs/custom-skills/speechcon-reference-interjections-japanese.html
		'<say-as interpret-as="interjection">さようなら</say-as>',
		'<say-as interpret-as="interjection">バイバイ</say-as>',
		'<say-as interpret-as="interjection">また明日</say-as>',
		'<say-as interpret-as="interjection">またいつでもどうぞ</say-as>',
		'<say-as interpret-as="interjection">またね</say-as>',
		'<say-as interpret-as="interjection">ごきげんよう</say-as>',
		'<say-as interpret-as="interjection">have a nice day</say-as>'
	];
	return randomize(goodbyes);
}

function getRandomYesNoQuestion() {
	const questions = [
		'ほかの挨拶も聞きたいですか？',
		'違う挨拶も聞きたいですか？',
		'もっと聞きたいですか？'
	];
	return randomize(questions);
}

function getRandomLearnMorePrompt() {
	const questions = [
		'もっと知りたいですか？',
		'もっと詳しく知りたいですか？',
		'ご興味ありますか？'
	];
	return randomize(questions);
}

function getVoicePersonality(language) {
	const personalities = [
		{ 'language': 'ドイツ語', 'name': ['Hans', 'Marlene', 'Vicki'] },
		{ 'language': 'スペイン語', 'name': ['Conchita', 'Enrique'] },
		{ 'language': 'フランス語', 'name': ['Celine', 'Lea', 'Mathieu'] },
		{ 'language': '英語', 'name': ['Joanna', 'Matthew'] },
		{ 'language': 'イタリア語', 'name': ['Carla', 'Giorgio'] }
	];
	const personality = personalities.filter(
		record => record.language === language
	);
	return randomize(personality[0].name);
}

function getSpeakableListOfProducts(entitleProductsList) {
	const productNameList = entitleProductsList.map(item => item.name);
	let productListSpeech = productNameList.join('と'); // 商品名を「と」で連結して一文を作成する。
	// productListSpeech = productListSpeech.replace(/_([^_]*)$/, 'and $1'); // 英語の場合、最後は 'and ' でつなぐ。 
	return productListSpeech;
}

function getResponseBasedOnAccessType(handlerInput, res, preSpeechText) {
	// JavaScriptの filter() を使うと、与えられた条件文にマッチした要素だけを抽出し新しい配列に入れて返すことができる。
	const greetingsPackProduct = res.inSkillProducts.filter(
		record => record.referenceName === 'Greetings_Pack'
	);

	console.log(
		`GREETINGS PACK PRODUCT = ${JSON.stringify(greetingsPackProduct)}`
	);

	const premiumSubscriptionProduct = res.inSkillProducts.filter(
		record => record.referenceName === 'Premium_Subscription'
	);

	let theGreeting;
	let speechText;
	let cardText;
	let repromptOutput;

	const specialGreeting = getSpecialHello();
	const greetingLanguage = specialGreeting['language'];
	const greetingText = specialGreeting['greeting'];
	const greetingLangCode = specialGreeting['lang'];

	const preGreetingSpeechText = `${preSpeechText} ${greetingLanguage}で「こんにちは」は、`;
	const postGreetingSpeechText = `です。`;

	if (isEntitled(premiumSubscriptionProduct)) {
		// ユーザーは、Premium Subscriptionを購入している。この場合は、Pollyの音声で、日本語以外の「こんにちは」の応答を返す。
		cardText = `${preGreetingSpeechText} ${greetingText} ${postGreetingSpeechText}`;
		speechText = `${preGreetingSpeechText} ${getVoiceTalentToSay(greetingText, greetingLanguage, greetingLangCode)} ${postGreetingSpeechText} <break time="1s"/> ${getRandomYesNoQuestion()}`;
		repromptOutput = `${getRandomYesNoQuestion()}`;
	}
	else if (isEntitled(greetingsPackProduct)) {
		// ユーザーは、Greetings Packを購入しているが、Premium Subscriptionは購入していない。この場合はAlexaの声で挨拶をする。
		cardText = `${preGreetingSpeechText} ${greetingText} ${postGreetingSpeechText}`;
		speechText = `${preGreetingSpeechText} ${specialGreeting['greeting']} ${postGreetingSpeechText}<break time="1s"/> ${getRandomYesNoQuestion()}`;
		repromptOutput = `${getRandomYesNoQuestion()}`;
	}
	else {
		// ユーザーは、Premium Subscription も Greetings Pack も購入していない。
		// アップセルするかどうかは shouldUpsell() がランダムに決める。Trueが返ったらアップセル
		if (shouldUpsell(handlerInput)) {
			// 挨拶をしたあと、Greetings Packにアップセルする。
			theGreeting = getSimpleHello();
			speechText = `${theGreeting} <break time="2s"/> ところで、ほかの言語の挨拶も聞けますよ？`;
			return makeUpsell(speechText, greetingsPackProduct, handlerInput);
		}
		else {
			// アップセルさせない場合は、単に挨拶をして終わり。
			theGreeting = getSimpleHello();
			cardText = `簡単な挨拶: ${theGreeting}`;
			speechText = `${theGreeting} <break time="1s"/> ${getRandomYesNoQuestion()}`;
			repromptOutput = `${getRandomYesNoQuestion()}`;
		}
	}

	return handlerInput.responseBuilder
		.speak(speechText)
		.reprompt(repromptOutput)
		.withSimpleCard(skillName, cardText)
		.getResponse();
}

function isProduct(product) {
	return product && product.length > 0;
}
function isEntitled(product) {
	return isProduct(product) && product[0].entitled === 'ENTITLED';
}

function getAllEntitledProducts(inSkillProductList) {
	const entitledProductList = inSkillProductList.filter(
		record => record.entitled === 'ENTITLED'
	);
	return entitledProductList;
}

function makeUpsell(preUpsellMessage, greetingsPackProduct, handlerInput) {
	let upsellMessage = `${preUpsellMessage} ${greetingsPackProduct[0].summary} ${getRandomLearnMorePrompt()}`;

	return handlerInput.responseBuilder
		.addDirective({
			type: 'Connections.SendRequest',
			name: 'Upsell',
			payload: {
				InSkillProduct: {
					productId: greetingsPackProduct[0].productId
				},
				upsellMessage
			},
			token: 'correlationToken'
		})
		.getResponse();
}

function makeBuyOffer(theProduct, handlerInput) {

	return handlerInput.responseBuilder
		.addDirective({
			type: 'Connections.SendRequest',
			name: 'Buy',
			payload: {
				InSkillProduct: {
					productId: theProduct[0].productId
				}
			},
			token: 'correlationToken'
		})
		.getResponse();
}

function shouldUpsell(handlerInput) {
	if (handlerInput.requestEnvelope.request.intent == undefined) {
		// リクエストがインテントでhない。すなわち Connections.Response だった場合はアップセルしない。
		return false;
	}
	else {
		//ランダムでtrueが出ればアップセル
		return randomize([true, false]);
	}
}

function getVoiceTalentToSay(speakOutput, language, lang) {
	const personality = getVoicePersonality(language);
	const generatedSpeech = `<voice name="${personality}"><lang xml:lang="${lang}"> ${speakOutput}</lang></voice>`;
	return generatedSpeech;
}

function getBuyResponseText(productReferenceName, productName) {
	if (productReferenceName === 'Greetings_Pack') {
		return `${productName}では、様々な言語の挨拶を聞くことができます。`;
	}
	else if (productReferenceName === 'Premium_Subscription') {
		return `${productName}では、ネイティブの発音で、様々な国の挨拶を聞くことができます。`;
	}
	else {
		console.log('Product Undefined');
		return 'ごめんなさい。この商品はありません。';
	}
}

// *****************************************
// ************ インターセプター **************
// *****************************************
const LogResponseInterceptor = {
	process(handlerInput) {
		console.log(
			`RESPONSE = ${JSON.stringify(handlerInput.responseBuilder.getResponse())}`
		);
	}
};

const LogRequestInterceptor = {
	process(handlerInput) {
		console.log(
			`REQUEST ENVELOPE = ${JSON.stringify(handlerInput.requestEnvelope)}`
		);
	}
};

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
	.addRequestHandlers(
		LaunchRequestHandler,
		GetAnotherHelloHandler,
		NoIntentHandler,
		WhatCanIBuyIntentHandler,
		BuyGreetingsPackIntentHandler,
		GetSpecialGreetingsIntentHandler,
		BuyPremiumSubscriptionIntentHandler,
		BuyResponseHandler,
		PurchaseHistoryIntentHandler,
		RefundGreetingsPackIntentHandler,
		CancelPremiumSubscriptionIntentHandler,
		CancelProductResponseHandler,
		HelpIntentHandler,
		CancelAndStopIntentHandler,
		SessionEndedRequestHandler
	)
	.addErrorHandlers(ErrorHandler)
	.addRequestInterceptors(LogRequestInterceptor)
	.addResponseInterceptors(LogResponseInterceptor)
	.lambda();
