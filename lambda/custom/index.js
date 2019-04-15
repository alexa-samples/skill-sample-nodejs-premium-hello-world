const Alexa = require('ask-sdk');
const skillName = 'Premium Hello World';

const LaunchRequestHandler = {
	canHandle(handlerInput) {
		return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
	},
	handle(handlerInput) {
		const speechText = `Welcome to ${skillName}, you can say hello!`;

		return handlerInput.responseBuilder
			.speak(speechText)
			.reprompt(speechText)
			.withSimpleCard(skillName, speechText)
			.getResponse();
	},
};

const SimpleHelloIntentHandler = {
	canHandle(handlerInput) {
		return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'SimpleHelloIntent';
	},
	handle(handlerInput) {
		const speechText = `${getSimpleHello()} ${getRandomYesNoQuestion()}`;

		return handlerInput.responseBuilder
			.speak(speechText)
			.reprompt(getRandomYesNoQuestion())
			.withSimpleCard(skillName, speechText)
			.getResponse();
	}
};

const GetAnotherHelloHandler = {
	canHandle(handlerInput){
		return(
			handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent');
	},
	handle(handlerInput){
		const locale = handlerInput.requestEnvelope.request.locale;
		const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
		let preSpeechText = '';

		return monetizationClient.getInSkillProducts(locale).then(function(res) {
			//Use the helper function getResponseBasedOnAccessType to determine the response based on the products the customer has purchased
			return getResponseBasedOnAccessType(handlerInput,res,preSpeechText);
		});
	}
};

const NoIntentHandler = {
	canHandle(handlerInput){
		return(
			handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent'
		);
	},
	handle(handlerInput){
		const speechText = getRandomGoodbye();
		return handlerInput.responseBuilder
			.speak(speechText)
			.getResponse();
	}
};

//Respond to the utterance "what can I buy"
const WhatCanIBuyIntentHandler = {
	canHandle(handlerInput){
		return (handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
    handlerInput.requestEnvelope.request.intent.name === 'WhatCanIBuyIntent');
	},
	handle(handlerInput){
		//Get the list of products available for in-skill purchase
		const locale = handlerInput.requestEnvelope.request.locale;
		const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
		return monetizationClient.getInSkillProducts(locale).then(function(res){
			//res contains the list of all ISP products for this skill. 
			// We now need to filter this to find the ISP products that are available for purchase (NOT ENTITLED)
			const purchasableProducts = res.inSkillProducts.filter(
				record => record.entitled === 'NOT_ENTITLED' &&
        record.purchasable === 'PURCHASABLE'
			);

			// Say the list of products 
			if (purchasableProducts.length > 0){
				//One or more products are available for purchase. say the list of products
				const speechText = `Products available for purchase at this time are ${getSpeakableListOfProducts(purchasableProducts)}. 
                            To learn more about a product, say 'Tell me more about' followed by the product name. 
                            If you are ready to buy, say, 'Buy' followed by the product name. So what can I help you with?`;
				const repromptOutput = 'I didn\'t catch that. What can I help you with?';
				return handlerInput.responseBuilder
					.speak(speechText)
					.reprompt(repromptOutput)
					.getResponse();  
			}
			else{
				// no products are available for purchase. Ask if they would like to hear another greeting
				const speechText = 'There are no products to offer to you right now. Sorry about that. Would you like a greeting instead?';
				const repromptOutput = 'I didn\'t catch that. What can I help you with?';
				return handlerInput.responseBuilder
					.speak(speechText)
					.reprompt(repromptOutput)
					.getResponse();  
			}
		});
	}
};

const BuyGreetingsPackIntentHandler = {
	canHandle(handlerInput){
		return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
    handlerInput.requestEnvelope.request.intent.name === 'BuyGreetingsPackIntent';
	},
	handle(handlerInput){
		const locale = handlerInput.requestEnvelope.request.locale;
		const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

		return monetizationClient.getInSkillProducts(locale).then(function(res){
			// Filter the list of products available for purchase to find the product with the reference name "Greetings_Pack"
			const greetingsPackProduct = res.inSkillProducts.filter(
				record => record.referenceName === 'Greetings_Pack'
			);

			const premiumSubscriptionProduct = res.inSkillProducts.filter(
				record => record.referenceName === 'Premium_Subscription'
			);

			if (isEntitled(premiumSubscriptionProduct)){
				//Customer has bought the Premium Subscription. They don't need to buy the Greetings Pack. 
				const speechText = `Good News! You're subscribed to the Premium Subscription, which includes all features of the Greetings Pack. ${getRandomYesNoQuestion()}`;
				const repromptOutput = `${getRandomYesNoQuestion()}`;

				return handlerInput.responseBuilder
					.speak(speechText)
					.reprompt(repromptOutput)
					.getResponse(); 
			}
			else{
				//Send Connections.SendRequest Directive back to Alexa to switch to Purchase Flow
				return handlerInput.responseBuilder
					.addDirective({
						type: 'Connections.SendRequest',
						name: 'Buy',
						payload: {
							InSkillProduct:{
								productId: greetingsPackProduct[0].productId
							}
						},
						token:'correlationToken'
					})
					.getResponse();						
			}
		});
	}
};

const BuyPremiumSubscriptionIntentHandler = {
	canHandle(handlerInput){
		return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
    handlerInput.requestEnvelope.request.intent.name === 'BuyPremiumSubscriptionIntent';
	},
	handle(handlerInput){
		const locale = handlerInput.requestEnvelope.request.locale;
		const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

		return monetizationClient.getInSkillProducts(locale).then(function(res){
			// Filter the list of products available for purchase to find the product with the reference name "Premium_Subscription"
			const premiumSubscriptionProduct = res.inSkillProducts.filter(
				record => record.referenceName === 'Premium_Subscription'
			);
      
			//Send Connections.SendRequest Directive back to Alexa to switch to Purchase Flow
			return handlerInput.responseBuilder
				.addDirective({
					type: 'Connections.SendRequest',
					name: 'Buy',
					payload: {
						InSkillProduct:{
							productId: premiumSubscriptionProduct[0].productId
						}
					},
					token:'correlationToken'
				})
				.getResponse();
		});
	}
};

const BuyResponseHandler = {
	canHandle(handlerInput){
		return handlerInput.requestEnvelope.request.type === 'Connections.Response' &&
        (handlerInput.requestEnvelope.request.name === 'Buy' ||
        handlerInput.requestEnvelope.request.name === 'Upsell');
	},
	handle(handlerInput){
		const locale = handlerInput.requestEnvelope.request.locale;
		const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
		const productId = handlerInput.requestEnvelope.request.payload.productId;

		return monetizationClient.getInSkillProducts(locale).then(function(res){
			const product = res.inSkillProducts.filter(
				record => record.productId === productId
			);

			if (handlerInput.requestEnvelope.request.status.code === '200'){
				let preSpeechText;

				// check the Buy status - acccpted, declined, already purchased, or something went wrong.
				switch (handlerInput.requestEnvelope.request.payload.purchaseResult){
				case 'ACCEPTED':
					preSpeechText = getBuyResponseText(product[0].referenceName, product[0].name);
					break;
				case 'DECLINED':
					preSpeechText = 'No Problem.';
					break;
				case 'ALREADY_PURCHASED':
					preSpeechText = getBuyResponseText(product[0].referenceName, product[0].name);
					break;
				default: 
					preSpeechText = `Something unexpected happened, but thanks for your interest in the ${product[0].name}.`;
					break;
				}        
				//respond back to the customer
				return getResponseBasedOnAccessType(handlerInput,res,preSpeechText);
			}
			else {
				// Request Status Code NOT 200. Something has failed with the connection. 
				console.log(
					`Connections.Response indicated failure. error: + ${handlerInput.requestEnvelope.request.status.message}`
				);
				return handlerInput.responseBuilder
					.speak('There was an error handling your purchase request. Please try again or contact us for help.')
					.getResponse();
			}
		});
	}
};

const PurchaseHistoryHandler = {
	canHandle(handlerInput) {
		return (
			handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'PurchaseHistoryIntent'
		);
	},
	handle(handlerInput) {
		const locale = handlerInput.requestEnvelope.request.locale;
		const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

		return monetizationClient.getInSkillProducts(locale).then(function(result) {
			const entitledProducts = getAllEntitledProducts(result.inSkillProducts);
			if (entitledProducts && entitledProducts.length > 0) {
				const speechText = `You have bought the following items: ${getSpeakableListOfProducts(entitledProducts)}. ${getRandomYesNoQuestion()}`;
				const repromptOutput = `You asked me for a what you've bought, here's a list ${getSpeakableListOfProducts(entitledProducts)}`;

				return handlerInput.responseBuilder
					.speak(speechText)
					.reprompt(repromptOutput)
					.getResponse();
			}
			else{
				const speechText = 'You haven\'t purchased anything yet. Would you like a simple greeting or special greeting?';
				const repromptOutput = `You asked me for a what you've bought, but you haven't purchased anything yet. You can say - what can I buy, or say yes to get another greeting. ${getRandomYesNoQuestion()}`;
  
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
	handle(handlerInput) {
		const locale = handlerInput.requestEnvelope.request.locale;
		const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

		return monetizationClient.getInSkillProducts(locale).then(function(res) {
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
	handle(handlerInput) {
		const locale = handlerInput.requestEnvelope.request.locale;
		const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

		return monetizationClient.getInSkillProducts(locale).then(function(res) {
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
	handle(handlerInput) {
		const locale = handlerInput.requestEnvelope.request.locale;
		const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
		const productId = handlerInput.requestEnvelope.request.payload.productId;
		let speechText;
		let repromptOutput;
    
		return monetizationClient.getInSkillProducts(locale).then(function(res) {
			const product = res.inSkillProducts.filter(
				record => record.productId === productId
			);
      
			console.log(
				`PRODUCT = ${JSON.stringify(product)}`
			);

			if (handlerInput.requestEnvelope.request.status.code === '200') {
				//Alexa handles the speech response immediately following the cancelation reqquest. 
				//It then passes the control to our CancelProductResponseHandler() along with the status code (ACCEPTED, DECLINED, NOT_ENTITLED)
				//We use the status code to stitch additional speech at the end of Alexa's cancelation response. 
				//Currently, we have the same additional speech (getRandomYesNoQuestion)for accepted, canceled, and not_entitled. You may edit these below, if you like. 
				if (handlerInput.requestEnvelope.request.payload.purchaseResult === 'ACCEPTED') {
					//The cancelation confirmation response is handled by Alexa's Purchase Experience Flow.
					//Simply add to that with getRandomYesNoQuestion()
					speechText = `${getRandomYesNoQuestion()}`;
					repromptOutput = getRandomYesNoQuestion();
				}
				else if (handlerInput.requestEnvelope.request.payload.purchaseResult === 'DECLINED') {
					speechText = `${getRandomYesNoQuestion()}`;
					repromptOutput = getRandomYesNoQuestion();
				}
				else if (handlerInput.requestEnvelope.request.payload.purchaseResult === 'NOT_ENTITLED') {
					//No subscription to cancel. 
					//The "No subscription to cancel" response is handled by Alexa's Purchase Experience Flow.
					//Simply add to that with getRandomYesNoQuestion()
					speechText = `${getRandomYesNoQuestion()}`;
					repromptOutput = getRandomYesNoQuestion();
				}
				return handlerInput.responseBuilder
					.speak(speechText)
					.reprompt(repromptOutput)
					.getResponse();
			}
			// Something failed.
			console.log(
				`Connections.Response indicated failure. error: ${handlerInput.requestEnvelope.request.status.message}`
			);

			return handlerInput.responseBuilder
				.speak('There was an error handling your purchase request. Please try again or contact us for help.')
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
		const speechText = 'You can say hello to me! How can I help?';

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
			.speak('Sorry, I can\'t understand the command. Please say again.')
			.reprompt('Sorry, I can\'t understand the command. Please say again.')
			.getResponse();
	},
};

// *****************************************
// *********** HELPER FUNCTIONS ************
// *****************************************

function randomize(array){
	const randomItem = array[Math.floor(Math.random() * array.length)];
	return randomItem;
}

function getSimpleHello() {
	const simple_greetings = ['Howdy!', 'Hello!', 'How are you?', 'Hiya!'];
	return simple_greetings[
		Math.floor(Math.random() * simple_greetings.length)
	];
}

function getSpecialHello() {
	const special_greetings = [
		{ language: 'hindi', greeting: 'Namaste' },
		{ language: 'french', greeting: 'Bonjour' },
		{ language: 'spanish', greeting: 'Hola' },
		{ language: 'japanese', greeting: 'Konichiwa' },
		{ language: 'italian', greeting: 'Ciao' }
	];
	return randomize(special_greetings);
}

function getRandomGoodbye() {
	const goodbyes = [
		'OK.  Goodbye!',
		'Have a great day!',
		'Come back again soon!'
	];
	return randomize(goodbyes);
}

function getRandomYesNoQuestion() {
	const questions = [
		'Would you like another greeting?',
		'Can I give you another greeting?',
		'Do you want to hear another greeting?'
	];
	return randomize(questions);
}

function getRandomLearnMorePrompt() {
	const questions = [
		'Want to learn more about it?',
		'Should I tell you more about it?',
		'Want to learn about it?',
		'Interested in learning more about it?'
	];
	return randomize(questions);
}

function getVoicePersonality(language){
	const personalities = [
		{'language':'hindi','name':['Aditi','Raveena']},
		{'language':'german','name':['Hans', 'Marlene', 'Vicki']},
		{'language':'spanish','name':['Conchita', 'Enrique']},
		{'language':'french','name':['Celine', 'Lea', 'Mathieu']},
		{'language':'japanese','name':['Mizuki', 'Takumi']},
		{'language':'italian','name':['Carla', 'Giorgio']}
	];
	const personality = personalities.filter(
		record => record.language === language
	);
	return randomize(personality[0].name);
}

function getSpeakableListOfProducts(entitleProductsList) {
	const productNameList = entitleProductsList.map(item => item.name);
	let productListSpeech = productNameList.join(', '); // Generate a single string with comma separated product names
	productListSpeech = productListSpeech.replace(/_([^_]*)$/, 'and $1'); // Replace last comma with an 'and '
	return productListSpeech;
}

function getResponseBasedOnAccessType(handlerInput,res,preSpeechText){
	// The filter() method creates a new array with all elements that pass the test implemented by the provided function.
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
	
	const preGreetingSpeechText = `${preSpeechText} Here's your special greeting: `;
	const postGreetingSpeechText = `That's hello in ${greetingLanguage}.`;

	if (isEntitled(premiumSubscriptionProduct)){
		//Customer has bought the Premium Subscription. Switch to Polly Voice, and return special hello
		cardText = `${preGreetingSpeechText} ${greetingText} ${postGreetingSpeechText}`;
		speechText = `${preGreetingSpeechText} ${getVoiceTalentToSay((greetingText + '! ' + postGreetingSpeechText),greetingLanguage)} ${getRandomYesNoQuestion()}`;
		repromptOutput = `${getRandomYesNoQuestion()}`;
	}
	else if (isEntitled(greetingsPackProduct)) {
		//Customer has bought the Greetings Pack, but not the Premium Subscription. Return special hello greeting in Alexa voice
		cardText = `${preGreetingSpeechText} ${greetingText} ${postGreetingSpeechText}`;
		speechText = `${preGreetingSpeechText} ${specialGreeting['greeting']} ! ${postGreetingSpeechText}. ${getRandomYesNoQuestion()}`;
		repromptOutput = `${getRandomYesNoQuestion()}`;
	}
	else{
		//Customer has NOT bought neither the Premium Subscription nor the Greetings Pack Product. 
		//Determine if upsell should be made. returns true/false
		if (shouldUpsell(handlerInput)){
			//Upsell Greetings Pack
			return makeUpsell(greetingsPackProduct,handlerInput);
		}
		else{
			// Do not make the upsell. Just return Simple Hello Greeting.
			theGreeting = getSimpleHello();
			cardText = `Here's your simple greeting: ${theGreeting}.`;
			speechText = `Here's your simple greeting: ${theGreeting}. ${getRandomYesNoQuestion()}`;
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

function makeUpsell(greetingsPackProduct,handlerInput){
	let upsellMessage = `By the way, you can now get greetings in more languages. ${greetingsPackProduct[0].summary}. ${getRandomLearnMorePrompt()}`;
    
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

function shouldUpsell(handlerInput) {
	if (handlerInput.requestEnvelope.request.intent == undefined){
		//If the last intent was Connections.Response, do not upsell
		return false;    
	}
	else{
		return randomize([true,false]); //randomize upsell
	}
}

function getVoiceTalentToSay(speakOutput,language){
	const personality = getVoicePersonality(language);
	const generatedSpeech = `<voice name="${personality}"> ${speakOutput} </voice>`;
	return generatedSpeech;
}

function getBuyResponseText(productReferenceName,productName){
	if (productReferenceName === 'Greetings_Pack'){
		return `With the ${productName}, I can now say hello in a variety of languages.`;
	}
	else if (productReferenceName === 'Premium_Subscription'){
		return `With the ${productName}, I can now say hello in a variety of languages, in different accents using Amazon Polly.`;
	}
	else{
		console.log('Product Undefined');
		return 'Sorry, that\'s not a valid product';
	}
}

// *****************************************
// *********** Interceptors ************
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
		SimpleHelloIntentHandler,
		GetAnotherHelloHandler,
		NoIntentHandler,
		WhatCanIBuyIntentHandler,
		BuyGreetingsPackIntentHandler,
		BuyPremiumSubscriptionIntentHandler,
		BuyResponseHandler,
		PurchaseHistoryHandler,
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
