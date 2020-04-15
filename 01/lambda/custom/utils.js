const Alexa = require('ask-sdk-core');
const i18n = require('i18next');
const languageStrings = require('./localisation');

function randomItem(array) {
    const randomItem = array[Math.floor(Math.random() * array.length)];
    return randomItem;
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

    let speechOutput, repromptOutput;

    const specialGreeting = getSpecialHello(handlerInput);
    const preGreetingSpeechText = `${preSpeechText} ${handlerInput.t('SPECIAL_GREETING_MSG')}`;
    const postGreetingSpeechText = handlerInput.t('SPECIAL_GREETING_LANG_MSG', { lang: specialGreeting.language });
    const langSpecialGreeting = switchLanguage(`${specialGreeting.greeting}.`, specialGreeting.locale);

    if (isEntitled(greetingsPackProduct)) {
        // Customer has bought the Greetings Pack, but not the Premium Subscription. Return special hello greeting in Alexa voice
        speechOutput = `${preGreetingSpeechText} ${langSpecialGreeting} ${postGreetingSpeechText} ${handlerInput.t('YES_NO_QUESTION')}`;
        repromptOutput = `${handlerInput.t('YES_NO_QUESTION')}`;
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

// *****************************************
// ************* Interceptors **************
// *****************************************

const LogRequestInterceptor = {
    async process(handlerInput) {
        console.log(JSON.stringify(handlerInput.requestEnvelope));
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
    LogRequestInterceptor,
    LocalisationRequestInterceptor,
    upsellDirective,
    buyDirective,
    getResponseBasedOnAccessType,
    getSpeakableListOfProducts
}