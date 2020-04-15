const Alexa = require('ask-sdk-core');
const i18n = require('i18next');
const languageStrings = require('./localisation');
const GOODBYES_PER_ENTITLEMENT = 3;

function randomItem(array) {
    const randomItem = array[Math.floor(Math.random() * array.length)];
    return randomItem;
}

function getSpecialGoodbye(handlerInput) {
    const specialGoodbyes = [
        {language: handlerInput.t('en-US'), greeting: 'see you later', locale: 'en-US', voice: ['Ivy', 'Joanna', 'Joey', 'Justin', 'Kendra', 'Kimberly', 'Matthew', 'Salli']},
        {language: handlerInput.t('en-AU'), greeting: 'catch you later', locale: 'en-AU', voice: ['Nicole', 'Russell']},
        {language: handlerInput.t('en-GB'), greeting: 'farewell', locale: 'en-GB', voice: ['Amy', 'Brian', 'Emma']},
        {language: handlerInput.t('en-IN'), greeting: 'goodbye', locale: 'en-IN', voice: ['Aditi', 'Raveena']},
        {language: handlerInput.t('hi-IN'), greeting: 'अलविदा', locale: 'hi-IN', voice: ['Aditi']},
        {language: handlerInput.t('de-DE'), greeting: 'auf wiedersehen', locale: 'de-DE', voice: ['Hans', 'Marlene', 'Vicki']},
        {language: handlerInput.t('es-ES'), greeting: 'hasta luego', locale: 'es-ES', voice: ['Conchita', 'Enrique']},
        {language: handlerInput.t('fr-FR'), greeting: 'au revoir', locale: 'fr-FR', voice: ['Celine', 'Lea', 'Mathieu']},
        {language: handlerInput.t('ja-JP'), greeting: 'さよなら', locale: 'ja-JP', voice: ['Mizuki', 'Takumi']},
        {language: handlerInput.t('it-IT'), greeting: 'arrivederci', locale: 'it-IT', voice: ['Carla', 'Giorgio']}
    ];

    return randomItem(
        specialGoodbyes.filter(function (item) {
            return item.locale !== Alexa.getLocale(handlerInput.requestEnvelope);
        })
    );
}

function getSpecialHello(handlerInput) {
    const specialGreetings = [
        {language: handlerInput.t('en-US'), greeting: 'how\'s it going?', locale: 'en-US', voice: ['Ivy', 'Joanna', 'Joey', 'Justin', 'Kendra', 'Kimberly', 'Matthew', 'Salli']},
        {language: handlerInput.t('en-AU'), greeting: 'how you going?', locale: 'en-AU', voice: ['Nicole', 'Russell']},
        {language: handlerInput.t('en-GB'), greeting: 'how do you do?', locale: 'en-GB', voice: ['Amy', 'Brian', 'Emma']},
        {language: handlerInput.t('en-IN'), greeting: 'Hello', locale: 'en-IN', voice: ['Aditi', 'Raveena']},
        {language: handlerInput.t('hi-IN'), greeting: 'नमस्ते', locale: 'hi-IN', voice: ['Aditi']},
        {language: handlerInput.t('de-DE'), greeting: 'Hallo', locale: 'de-DE', voice: ['Hans', 'Marlene', 'Vicki']},
        {language: handlerInput.t('es-ES'), greeting: 'Hola', locale: 'es-ES', voice: ['Conchita', 'Enrique']},
        {language: handlerInput.t('fr-FR'), greeting: 'Bonjour', locale: 'fr-FR', voice: ['Celine', 'Lea', 'Mathieu']},
        {language: handlerInput.t('ja-JP'), greeting: 'こんにちは', locale: 'ja-JP', voice: ['Mizuki', 'Takumi']},
        {language: handlerInput.t('it-IT'), greeting: 'Ciao', locale: 'it-IT', voice: ['Carla', 'Giorgio']}
    ];

    return randomItem(
        specialGreetings.filter(function (item) {
            return item.locale !== Alexa.getLocale(handlerInput.requestEnvelope);
        })
    );
}

function getRemainingCredits(handlerInput, consumable, usedSessionAttributeName, creditsPerEntitlement) {
    console.log('Function: getRemainingCredits');
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    if (!sessionAttributes[usedSessionAttributeName])
        sessionAttributes[usedSessionAttributeName] = 0;
    const activeEntitlementCount = consumable ? consumable.activeEntitlementCount : 0;
    let usedCredits = parseInt(sessionAttributes[usedSessionAttributeName]);
    const ownedCredits = activeEntitlementCount * creditsPerEntitlement;
    if (ownedCredits < usedCredits) {
        // we assume the ISP was reset so we also reset the used count
        sessionAttributes[usedSessionAttributeName] = 0;
        usedCredits = 0;
    }
    const availableCredits = Math.max(0, ownedCredits - usedCredits);
    const creditStatus = {
        activeEntitlementCount: activeEntitlementCount,
        creditsPerEntitlement: creditsPerEntitlement,
        ownedCredits: ownedCredits,
        usedCredits: usedCredits,
        availableCredits: availableCredits
    };
    console.log(creditStatus);

    return creditStatus;
}

function getPremiumOrRandomGoodbye(handlerInput, inSkillProducts) {
    console.log('Function: getPremiumOrRandomGoodbye');
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    const goodbyesPackProduct = inSkillProducts.find(item => item.referenceName === 'Goodbyes_Pack');
    let availableGoodbyes, creditStatus;
    if (goodbyesPackProduct) {
        creditStatus = getRemainingCredits(handlerInput, goodbyesPackProduct, 'goodbyesUsed', GOODBYES_PER_ENTITLEMENT);
        availableGoodbyes = parseInt(creditStatus.availableCredits) || 0;
    } else {
        availableGoodbyes = 0;
        creditStatus = 0;
    }

    let speechOutput, cardText;
    if (availableGoodbyes > 0) {
        console.log("Goodbye credits are available");
        const specialGoodbye = getSpecialGoodbye(handlerInput);
        const preGoodbyeSpeechText = handlerInput.t('SPECIAL_GOODBYE_MSG');
        const postGoodbyeSpeechText = handlerInput.t('SPECIAL_GOODBYE_LANG_MSG', { lang: specialGoodbye.language });
        const langSpecialGoodbye = switchLanguage(`${specialGoodbye.greeting}.`, specialGoodbye.locale);
        cardText = `${preGoodbyeSpeechText} ${specialGoodbye.greeting} ${postGoodbyeSpeechText}`;
        const randomVoice = randomItem(specialGoodbye.voice);
        speechOutput = `${preGoodbyeSpeechText} ${switchVoice(langSpecialGoodbye, randomVoice)} ${postGoodbyeSpeechText}.`;
        sessionAttributes.goodbyesUsed += 1;
        //attributesManager.setSessionAttributes(sessionAttributes);
    } else {
        console.log('No premium goodbye credits available');
        speechOutput = handlerInput.t('UPSELL_CONSUMABLE_MSG') + handlerInput.t('SIMPLE_GOODBYES');
    }

    return handlerInput.responseBuilder
        .speak(speechOutput)
        .withShouldEndSession(true)
        .getResponse();

}

function getSpeakableListOfProducts(productsList, handlerInput) {
    console.log('Function: getSpeakableListOfProducts');
    const productNameList = productsList.map(item => item.name);
    let productListSpeech = productNameList.join(', '); // Generate a single string with comma separated product names
    productListSpeech = productListSpeech.replace(/, ((?:.(?!, ))+)$/, handlerInput.t('AND_MSG')); // Replace last comma with an 'and '
    return productListSpeech;
}

function getResponseBasedOnAccessType(handlerInput, productList, preSpeechText) {
    console.log('Function: getResponseBasedOnAccessType');
    const greetingsPackProduct = productList.inSkillProducts.find(item => item.referenceName === 'Greetings_Pack');
    const premiumSubscriptionProduct = productList.inSkillProducts.find(item => item.referenceName === 'Premium_Subscription');

    let speechOutput, repromptOutput;

    const specialGreeting = getSpecialHello(handlerInput);
    const preGreetingSpeechText = `${preSpeechText} ${handlerInput.t('SPECIAL_GREETING_MSG')}`;
    const postGreetingSpeechText = handlerInput.t('SPECIAL_GREETING_LANG_MSG', { lang: specialGreeting.language });
    const langSpecialGreeting = switchLanguage(`${specialGreeting.greeting}.`, specialGreeting.locale);

    if (isEntitled(premiumSubscriptionProduct)) {
        // Customer has bought the Premium Subscription. Switch to Polly Voice, and return special hello
        const randomVoice = randomItem(specialGreeting.voice);
        speechOutput = `${preGreetingSpeechText} ${switchVoice(langSpecialGreeting, randomVoice)} ${postGreetingSpeechText} ${handlerInput.t('YES_NO_QUESTION')}`;
        repromptOutput = `${handlerInput.t('YES_NO_QUESTION')}`;
    } else if (isEntitled(greetingsPackProduct)) {
        // Customer has bought the Greetings Pack, but not the Premium Subscription. Return special hello greeting in Alexa voice
        speechOutput = `${preGreetingSpeechText} ${langSpecialGreeting} ${postGreetingSpeechText} ${handlerInput.t('YES_NO_QUESTION')}`;
        repromptOutput = `${handlerInput.t('YES_NO_QUESTION')}`;
        if (shouldUpsell(handlerInput) && premiumSubscriptionProduct) {
            console.log("Triggering upsell" + JSON.stringify(premiumSubscriptionProduct));
            // Say the simple greeting, and then upsell the premium subscription
            const upsellMessage = `${preGreetingSpeechText} ${langSpecialGreeting} ${postGreetingSpeechText}` + ' ' + handlerInput.t('UPSELL_SUBSCRIPTION_MSG');
            return upsellDirective(handlerInput, upsellMessage, premiumSubscriptionProduct);
        }
    } else {
        // Customer has bought neither the Premium Subscription nor the Greetings Pack Product.
        const greeting = handlerInput.t('SIMPLE_GREETINGS');
        // Determine if upsell should be made. returns true/false
        if (shouldUpsell(handlerInput) && greetingsPackProduct) {
            console.log("Triggering upsell" + JSON.stringify(greetingsPackProduct));
            // Say the simple greeting, and then Upsell Greetings Pack
            const upsellMessage = handlerInput.t('SIMPLE_GREETING', { greeting: greeting }) + ' ' + handlerInput.t('UPSELL_ENTITLEMENT_MSG');
            return upsellDirective(handlerInput, upsellMessage, greetingsPackProduct);
        }
        // Do not make the upsell. Just return Simple Hello Greeting.
        speechOutput = handlerInput.t('SIMPLE_GREETING', { greeting: greeting }) + ' ' + handlerInput.t('YES_NO_QUESTION');
        repromptOutput = handlerInput.t('YES_NO_QUESTION');
    }

    return handlerInput.responseBuilder
        .speak(speechOutput)
        .reprompt(repromptOutput)
        .getResponse();
}

function isEntitled(product) {
    return product && product.entitled === 'ENTITLED';
}

function shouldUpsell(handlerInput) {
    console.log('Function: shouldUpsell');
    if (!!!handlerInput.requestEnvelope.request.intent) {
        // If the last intent was Connections.Response, do not upsell
        return false;
    }
    return randomItem([true, false]); // randomize upsell, you can have a more advanced logic here
}

function switchVoice(speakOutput, voiceName) {
    if (speakOutput && voiceName) {
        return `<voice name="${voiceName}">${speakOutput}</voice>`;
    }
    return speakOutput;
}

function switchLanguage(speakOutput, locale) {
    if (speakOutput && locale) {
        return `<lang xml:lang="${locale}">${speakOutput}</lang>`;
    }
    return speakOutput;
}

function upsellDirective(handlerInput, upsellMessage, product) {
    return handlerInput.responseBuilder
                .addDirective({
                    type: 'Connections.SendRequest',
                    name: 'Upsell',
                    payload: {
                        InSkillProduct: {
                            productId: product.productId
                        },
                        upsellMessage
                    },
                    token: product.productId
                })
                .getResponse();
}

function buyDirective(handlerInput, product) {
    return handlerInput.responseBuilder
                .addDirective({
                    type: 'Connections.SendRequest',
                    name: 'Buy',
                    payload: {
                        InSkillProduct: {
                            productId: product.productId
                        }
                    },
                    token: product.productId,
                })
                .getResponse();
}

function cancelDirective(handlerInput, product) {
    return handlerInput.responseBuilder
                .addDirective({
                    type: 'Connections.SendRequest',
                    name: 'Cancel',
                    payload: {
                        InSkillProduct: {
                            productId: product.productId
                        }
                    },
                    token: product.productId,
                })
                .getResponse();
}

// *****************************************
// *************** Adapters ****************
// *****************************************

function getPersistenceAdapter(tableName) {
    // This function is an indirect way to detect if this is part of an Alexa-Hosted skill
    function isAlexaHosted() {
        return process.env.S3_PERSISTENCE_BUCKET;
    }
    if (isAlexaHosted()) {
        const { S3PersistenceAdapter } = require('ask-sdk-s3-persistence-adapter');
        return new S3PersistenceAdapter({
            bucketName: process.env.S3_PERSISTENCE_BUCKET
        });
    } else {
        // IMPORTANT: don't forget to give DynamoDB access to the role you're using to run this lambda (via IAM policy)
        const { DynamoDbPersistenceAdapter } = require('ask-sdk-dynamodb-persistence-adapter');
        return new DynamoDbPersistenceAdapter({
            tableName: tableName || 'premium-hello-world',
            createTable: true
        });
    }
}

// *****************************************
// ************* Interceptors **************
// *****************************************

const LogRequestInterceptor = {
    async process(handlerInput) {
        console.log(JSON.stringify(handlerInput.requestEnvelope));
    }
};

const LoadAttributesRequestInterceptor = {
    async process(handlerInput) {
        const { attributesManager, requestEnvelope } = handlerInput;
        if (Alexa.isNewSession(requestEnvelope)) { //is this a new session? this check is not enough if using auto-delegate
            const persistentAttributes = await attributesManager.getPersistentAttributes() || {};
            console.log("Retrieved persistentAttributes: " + JSON.stringify(persistentAttributes));
            //copy persistent attribute to session attributes
            attributesManager.setSessionAttributes(persistentAttributes);
        }
    }
};

const SaveAttributesResponseInterceptor = {
    async process(handlerInput, response) {
        if (!response) return; // avoid intercepting calls that have no outgoing response due to errors
        const { attributesManager, requestEnvelope } = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const shouldEndSession = (typeof response.shouldEndSession === "undefined" ? true : response.shouldEndSession); //is this a session end?
        if ((shouldEndSession || requestEnvelope.request.type === 'SessionEndedRequest') && Object.keys(sessionAttributes).length > 0) { // skill was stopped or timed out
            attributesManager.setPersistentAttributes(sessionAttributes);
            console.log("Saving persistent attributes: " + JSON.stringify(sessionAttributes));
            await attributesManager.savePersistentAttributes();
        }
    }
};

// This request interceptor will bind a translation function 't' to the handlerInput
// Additionally it will handle picking a random value if instead of a string it receives an array
const LocalisationRequestInterceptor = {
    process(handlerInput) {
        const localisationClient = i18n.init({
            lng: Alexa.getLocale(handlerInput.requestEnvelope),
            resources: languageStrings,
            returnObjects: true
        });
        localisationClient.localise = function localise() {
            const args = arguments;
            const value = i18n.t(...args);
            if (Array.isArray(value)) {
                return value[Math.floor(Math.random() * value.length)];
            }
            return value;
        };
        handlerInput.t = function translate(...args) {
            return localisationClient.localise(...args);
        }
    }
};

module.exports = {
    getPersistenceAdapter,
    LogRequestInterceptor,
    SaveAttributesResponseInterceptor,
    LoadAttributesRequestInterceptor,
    LocalisationRequestInterceptor,
    upsellDirective,
    buyDirective,
    cancelDirective,
    getResponseBasedOnAccessType,
    getSpeakableListOfProducts,
    getPremiumOrRandomGoodbye,
    getRemainingCredits,
    GOODBYES_PER_ENTITLEMENT
}
