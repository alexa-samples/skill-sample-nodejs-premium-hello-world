const Alexa = require('ask-sdk');
const i18n = require('i18next');
const languageStrings = require('./localisation');
const GOODBYES_PER_ENTITLEMENT = 3;

// *****************************************
// *********** HELPER FUNCTIONS ************
// *****************************************

function randomize(array) {
  const randomItem = array[Math.floor(Math.random() * array.length)];
  return randomItem;
}

function getSimpleHello(handlerInput) {
  return handlerInput.t('SIMPLE_GREETINGS');
}

function getSpecialGoodbye(handlerInput) {
  const specialGoodbyes = [
    {
      language: handlerInput.t('HINDI_LANG'), greeting: 'alavida', locale: 'en-IN', voice: ['Aditi', 'Raveena']
    },
    {
      language: handlerInput.t('GERMAN_LANG'), greeting: 'auf wiedersehen', locale: 'de-DE', voice: ['Hans', 'Marlene', 'Vicki']
    },
    /*{
      language: handlerInput.t('PORTUGUESE_LANG'), greeting: 'tchau', locale: 'pt-BR', voice: ['Camila', 'Ricardo']
    },*/
    /*{
      language: handlerInput.t('SPANISH_LANG'), greeting: 'hasta luego', locale: 'es-ES', voice: ['Conchita', 'Enrique']
    },*/
    {
      language: handlerInput.t('FRENCH_LANG'), greeting: 'au revoir', locale: 'fr-FR', voice: ['Celine', 'Lea', 'Mathieu']
    },
    {
      language: handlerInput.t('JAPANESE_LANG'), greeting: 'sayonara', locale: 'ja-JP', voice: ['Mizuki', 'Takumi']
    },
    {
      language: handlerInput.t('ITALIAN_LANG'), greeting: 'arrivederci', locale: 'it-IT', voice: ['Carla', 'Giorgio']
    }
  ];
  return randomize(specialGoodbyes);
}

function getSpecialHello(handlerInput) {
  const specialGreetings = [
    {
      language: handlerInput.t('HINDI_LANG'), greeting: 'Namaste', locale: 'en-IN', voice: ['Aditi', 'Raveena']
    },
    {
      language: handlerInput.t('GERMAN_LANG'), greeting: 'Hallo', locale: 'de-DE', voice: ['Hans', 'Marlene', 'Vicki']
    },
    /*{
      language: handlerInput.t('PORTUGUESE_LANG'), greeting: 'Olá', locale: 'pt-BR', voice: ['Camila', 'Ricardo']
    },*/
    /*{
      language: handlerInput.t('SPANISH_LANG'), greeting: 'Hola', locale: 'es-ES', voice: ['Conchita', 'Enrique']
    }*/
    {
      language: handlerInput.t('FRENCH_LANG'), greeting: 'Bonjour', locale: 'fr-FR', voice: ['Celine', 'Lea', 'Mathieu']
    },
    {
      language: handlerInput.t('JAPANESE_LANG'), greeting: 'Konichiwa', locale: 'ja-JP', voice: ['Mizuki', 'Takumi']
    },
    {
      language: handlerInput.t('ITALIAN_LANG'), greeting: 'Ciao', locale: 'it-IT', voice: ['Carla', 'Giorgio']
    }
  ];
  return randomize(specialGreetings);
}

function getRemainingCredits(handlerInput, consumable, usedSessionAttributeName, creditsPerEntitlement){
  console.log('Function: getRemainingCredits');
  const {attributesManager} = handlerInput;
  const sessionAttributes = attributesManager.getSessionAttributes();
  if(!sessionAttributes[usedSessionAttributeName])
    sessionAttributes[usedSessionAttributeName] = 0;
  const activeEntitlementCount = consumable[0] ? consumable[0].activeEntitlementCount : 0;
  let usedCredits = parseInt(sessionAttributes[usedSessionAttributeName]);
  const ownedCredits = activeEntitlementCount * creditsPerEntitlement;
  if(ownedCredits < usedCredits) {
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
  const {attributesManager} = handlerInput;
  const sessionAttributes = attributesManager.getSessionAttributes();
  const goodbyesPackProduct = inSkillProducts.filter(
    record => record.referenceName === 'Goodbyes_Pack'
  );

  const creditStatus = getRemainingCredits(handlerInput, goodbyesPackProduct, 'goodbyesUsed', GOODBYES_PER_ENTITLEMENT);
  const availableGoodbyes = parseInt(creditStatus.availableCredits) || 0;

  let speechOutput;
  let cardText;

  if (availableGoodbyes > 0){
    console.log("Goodbye credits are available");
    const specialGoodbye = getSpecialGoodbye(handlerInput);
    const preGoodbyeSpeechText = handlerInput.t('SPECIAL_GOODBYE_MSG');
    const postGoodbyeSpeechText = handlerInput.t('SPECIAL_GOODBYE_LANG_MSG', {lang: specialGoodbye.language});
    const langSpecialGoodbye = switchLanguage(`${specialGoodbye.greeting}!`, specialGoodbye.locale);
    cardText = `${preGoodbyeSpeechText} ${specialGoodbye.greeting} ${postGoodbyeSpeechText}`;
    const randomVoice = randomize(specialGoodbye.voice);
    speechOutput = `${preGoodbyeSpeechText} ${switchVoice(langSpecialGoodbye, randomVoice)} ${postGoodbyeSpeechText}.`;
    sessionAttributes.goodbyesUsed += 1;
    attributesManager.setSessionAttributes(sessionAttributes);
  } else {
    console.log("No premium goodbye credits available");
    speechOutput = handlerInput.t('SIMPLE_GOODBYES');
  }

  return handlerInput.responseBuilder
    .speak(speechOutput)
    .withShouldEndSession(true)
    .getResponse();

}

function getRandomYesNoQuestion(handlerInput) {
  return handlerInput.t('YES_NO_QUESTION');
}

function getRandomLearnMorePrompt(handlerInput) {
  return handlerInput.t('LEARN_MORE_PROMPT');
}

function getSpeakableListOfProducts(entitledProductsList) {
  console.log('Function: getSpeakableListOfProducts');
  const productNameList = entitledProductsList.map(item => item.name);
  let productListSpeech = productNameList.join(', '); // Generate a single string with comma separated product names
  productListSpeech = productListSpeech.replace(/_([^_]*)$/, 'and $1'); // Replace last comma with an 'and '
  return productListSpeech;
}

function getResponseBasedOnAccessType(handlerInput, productList, preSpeechText) {
  console.log('Function: getResponseBasedOnAccessType');
  // The filter() method creates a new array with all elements that pass the test implemented by the provided function.
  const greetingsPackProduct = productList.inSkillProducts.filter(
    record => record.referenceName === 'Greetings_Pack',
  );

  const premiumSubscriptionProduct = productList.inSkillProducts.filter(
    record => record.referenceName === 'Premium_Subscription',
  );

  let speechOutput;
  let cardText;
  let repromptOutput;

  const specialGreeting = getSpecialHello(handlerInput);
  const preGreetingSpeechText = `${preSpeechText} ${handlerInput.t('SPECIAL_GREETING_MSG')}`;
  const postGreetingSpeechText = handlerInput.t('SPECIAL_GREETING_LANG_MSG', {lang: specialGreeting.language});
  const langSpecialGreeting = switchLanguage(`${specialGreeting.greeting}!`, specialGreeting.locale);

  if (isEntitled(premiumSubscriptionProduct)) {
    // Customer has bought the Premium Subscription. Switch to Polly Voice, and return special hello
    cardText = `${preGreetingSpeechText} ${specialGreeting.greeting} ${postGreetingSpeechText}`;
    const randomVoice = randomize(specialGreeting.voice);
    speechOutput = `${preGreetingSpeechText} ${switchVoice(langSpecialGreeting, randomVoice)} ${postGreetingSpeechText} ${getRandomYesNoQuestion(handlerInput)}`;
    repromptOutput = `${getRandomYesNoQuestion(handlerInput)}`;
  } else if (isEntitled(greetingsPackProduct)) {
    // Customer has bought the Greetings Pack, but not the Premium Subscription. Return special hello greeting in Alexa voice
    cardText = `${preGreetingSpeechText} ${specialGreeting.greeting} ${postGreetingSpeechText}`;
    speechOutput = `${preGreetingSpeechText} ${langSpecialGreeting} ${postGreetingSpeechText} ${getRandomYesNoQuestion(handlerInput)}`;
    repromptOutput = `${getRandomYesNoQuestion(handlerInput)}`;
  } else {
    // Customer has bought neither the Premium Subscription nor the Greetings Pack Product.
    const theGreeting = getSimpleHello(handlerInput);
    // Determine if upsell should be made. returns true/false
    if (shouldUpsell(handlerInput) && greetingsPackProduct[0]) {
      console.log("Triggering upsell" + JSON.stringify(greetingsPackProduct));
      // Say the simple greeting, and then Upsell Greetings Pack
      speechOutput = handlerInput.t('SIMPLE_GREETING', {greeting: theGreeting}) + ' ' + handlerInput.t('UPSELL_MSG');
      return makeUpsell(speechOutput, greetingsPackProduct, handlerInput);
    }

    // Do not make the upsell. Just return Simple Hello Greeting.
    cardText = handlerInput.t('SIMPLE_GREETING', {greeting: theGreeting});
    speechOutput = cardText + ' ' + getRandomYesNoQuestion(handlerInput);
    repromptOutput = getRandomYesNoQuestion(handlerInput);
  }

  return handlerInput.responseBuilder
    .speak(speechOutput)
    .reprompt(repromptOutput)
    .withSimpleCard(handlerInput.t('SKILL_NAME'), cardText)
    .getResponse();
}

function isProduct(product) {
  return product && product.length > 0;
}

function isEntitled(product) {
  return isProduct(product) && product[0].entitled === 'ENTITLED';
}

function isPurchasable(product) {
  return isProduct(product) && product[0].purchasable === 'PURCHASABLE';
}

function getAllEntitledProducts(inSkillProductList) {
  console.log('Function: getAllEntitledProducts');
  return inSkillProductList.filter(record => record.entitled === 'ENTITLED');
}

function getAllPurchasableProducts(inSkillProductList) {
  console.log('Function: getAllPurchasableProducts');
  return inSkillProductList.filter(record => record.purchasable === 'PURCHASABLE');
}

function makeUpsell(preUpsellMessage, product, handlerInput) {
  console.log('Function: makeUpsell');
  const upsellMessage = `${preUpsellMessage} ${product[0].summary} ${getRandomLearnMorePrompt(handlerInput)}`;

  return handlerInput.responseBuilder
    .addDirective({
      type: 'Connections.SendRequest',
      name: 'Upsell',
      payload: {
        InSkillProduct: {
          productId: product[0].productId,
        },
        upsellMessage,
      },
      token: 'correlationToken',
    })
    .getResponse();
}

function makeBuyOffer(theProduct, handlerInput) {
  console.log('Function: makeBuyOffer');
  return handlerInput.responseBuilder
    .addDirective({
      type: 'Connections.SendRequest',
      name: 'Buy',
      payload: {
        InSkillProduct: {
          productId: theProduct[0].productId,
        },
      },
      token: 'correlationToken',
    })
    .getResponse();
}

function shouldUpsell(handlerInput) {
  console.log('Function: shouldUpsell');
  if (handlerInput.requestEnvelope.request.intent === undefined) {
    // If the last intent was Connections.Response, do not upsell
    return false;
  }
  return randomize([true, false]); // randomize upsell
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

function getBuyResponseText(handlerInput, productReferenceName, productName) {
  console.log('Function: getBuyResponseText');
  switch(productReferenceName){
    case 'Greetings_Pack':
      return handlerInput.t('ENTITLEMENT_INFO_MSG', {productName: productName});
    case 'Premium_Subscription':
        return handlerInput.t('SUBSCRIPTION_INFO_MSG', {productName: productName});
    case 'Goodbyes_Pack':
        return handlerInput.t('CONSUMABLE_INFO_MSG', {productName: productName});
    default: 
      console.log('Product Unknown');
    return '';
  }
}

// *****************************************
// *********** Interceptors ************
// *****************************************

const LoadAttributesRequestInterceptor = {
  async process(handlerInput) {
      const {attributesManager, requestEnvelope} = handlerInput;
      if(Alexa.isNewSession(requestEnvelope)){ //is this a new session? this check is not enough if using auto-delegate
          const persistentAttributes = await attributesManager.getPersistentAttributes() || {};
          console.log("Retrieved persistentAttributes: " + JSON.stringify(persistentAttributes));
          //copy persistent attribute to session attributes
          attributesManager.setSessionAttributes(persistentAttributes);
      }
  }
};

const SaveAttributesResponseInterceptor = {
  async process(handlerInput, response) {
      if(!response) return; // avoid intercepting calls that have no outgoing response due to errors
      const {attributesManager, requestEnvelope} = handlerInput;
      const sessionAttributes = attributesManager.getSessionAttributes();
      const shouldEndSession = (typeof response.shouldEndSession === "undefined" ? true : response.shouldEndSession); //is this a session end?
      if((shouldEndSession || requestEnvelope.request.type === 'SessionEndedRequest') && Object.keys(sessionAttributes).length > 0) { // skill was stopped or timed out
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
    isPurchasable,
    makeUpsell,
    getAllEntitledProducts,
    getAllPurchasableProducts,
    makeBuyOffer,
    SaveAttributesResponseInterceptor,
    LoadAttributesRequestInterceptor,
    LocalisationRequestInterceptor,
    getBuyResponseText,
    getResponseBasedOnAccessType,
    getSpeakableListOfProducts,
    getRandomYesNoQuestion,
    getPremiumOrRandomGoodbye,
    getRemainingCredits,
    GOODBYES_PER_ENTITLEMENT
}