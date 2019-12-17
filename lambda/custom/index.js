const Alexa = require('ask-sdk-core');
const utils = require("./utils");

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        console.log('Handler: LaunchRequestHandler');
        const speechOutput = handlerInput.t('WELCOME_MSG');

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(speechOutput)
            .withSimpleCard(handlerInput.t('SKILL_NAME'), speechOutput)
            .getResponse();
    }
};

const GetAnotherHelloHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'SimpleHelloIntent');
    },
    async handle(handlerInput) {
        console.log('Handler: GetAnotherHelloHandler');
        const locale = Alexa.getLocale(handlerInput.requestEnvelope);
        const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
        const preSpeechText = '';
        // productList contains the list of all ISP products for this skill.
        const productList = await monetizationClient.getInSkillProducts(locale);
        // Use the helper function getResponseBasedOnAccessType to determine the response based on the products the customer has purchased
        return utils.getResponseBasedOnAccessType(handlerInput, productList, preSpeechText);
    }
};

// Respond to the utterance "what can I buy"
const AvailableProductsIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AvailableProductsIntent';
    },
    async handle(handlerInput) {
        console.log('Handler: AvailableProductsIntentHandler');
        // Get the list of products available for in-skill purchase
        const locale = Alexa.getLocale(handlerInput.requestEnvelope);
        const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
        // productList contains the list of all ISP products for this skill.
        const productList = await monetizationClient.getInSkillProducts(locale);
        // We now need to filter this to find the ISP products that are available for purchase
        const purchasableProducts = productList.inSkillProducts.filter(item => item.purchasable === 'PURCHASABLE');
        // Say the list of products
        let speechOutput, repromptOutput;
        if (purchasableProducts.length > 0) {
            // One or more products are available for purchase. say the list of products
            speechOutput = handlerInput.t('PRODUCT_LIST_MSG', { products: utils.getSpeakableListOfProducts(purchasableProducts, handlerInput) });
            repromptOutput = handlerInput.t('REPROMPT_MSG');
            return handlerInput.responseBuilder
                .speak(speechOutput)
                .reprompt(repromptOutput)
                .getResponse();
        }
        // no products are available for purchase. Ask if they would like to hear another greeting
        speechOutput = handlerInput.t('NO_PURCHASABLE_PRODUCT_MSG') + ' ' + handlerInput.t('YES_NO_QUESTION');
        repromptOutput = handlerInput.t('REPROMPT_MSG');
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(repromptOutput)
            .getResponse();
    }
};

const DescribeProductIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'DescribeProductIntent';
    },
    async handle(handlerInput) {
        console.log('Handler: DescribeProductIntentHandler');
        const productReferenceName = Alexa.getSlot(handlerInput.requestEnvelope, 'product').resolutions.resolutionsPerAuthority[0].values[0].value.id;
        const locale = Alexa.getLocale(handlerInput.requestEnvelope);
        let speechOutput, repromptOutput;

        const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
        // productList contains the list of all ISP products for this skill.
        const productList = await monetizationClient.getInSkillProducts(locale);
        // In the list of products available for purchase find the product with a matching id and purchasable status
        const product = productList.inSkillProducts.find(item => item.referenceName === productReferenceName && item.purchasable === 'PURCHASABLE');
        // Purchasable. Make the upsell
        speechOutput = handlerInput.t('SURE_MSG');
        if (product) {
            // since they are interested and it's purchasable we can try to upsell the product
            const upsellMessage = `${speechOutput + handlerInput.t('LEARN_MORE_PROMPT')}`;
            return utils.upsellDirective(handlerInput, upsellMessage, product);
        } else {
            speechOutput = handlerInput.t('NO_PURCHASABLE_PRODUCT_MSG') + ' ' + handlerInput.t('YES_NO_QUESTION');
            repromptOutput = handlerInput.t('YES_NO_QUESTION');

            return handlerInput.responseBuilder
                .speak(speechOutput)
                .reprompt(repromptOutput)
                .getResponse();
        }
    }
};

const BuyProductIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'BuyProductIntent';
    },
    async handle(handlerInput) {
        console.log('Handler: BuyProductIntentHandler');
        const productReferenceName = Alexa.getSlot(handlerInput.requestEnvelope, 'product').resolutions.resolutionsPerAuthority[0].values[0].value.id;
        const locale = Alexa.getLocale(handlerInput.requestEnvelope);
        let speechOutput, repromptOutput;

        const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
        // productList contains the list of all ISP products for this skill.
        const productList = await monetizationClient.getInSkillProducts(locale);
        console.log('product list:' + JSON.stringify(productList));
        // In the list of products available for purchase find the product with a matching id and purchasable status
        const product = productList.inSkillProducts.find(item => item.referenceName === productReferenceName && item.purchasable === 'PURCHASABLE');
        if (product) {
            return utils.buyDirective(handlerInput, product);
        } else {
            speechOutput = handlerInput.t('NO_PURCHASABLE_PRODUCT_MSG') + ' ' + handlerInput.t('YES_NO_QUESTION');
            repromptOutput = handlerInput.t('YES_NO_QUESTION');

            return handlerInput.responseBuilder
                .speak(speechOutput)
                .reprompt(repromptOutput)
                .getResponse();
        }
    }
};

const UpsellOrBuyResponseHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'Connections.Response'
            && (handlerInput.requestEnvelope.request.name === 'Buy'
                || handlerInput.requestEnvelope.request.name === 'Upsell');
    },
    async handle(handlerInput) {
        console.log('Handler: UpsellBuyResponseHandler');
        const locale = Alexa.getLocale(handlerInput.requestEnvelope);
        const {request} = handlerInput.requestEnvelope;
        const {productId} = request.payload;
        console.log(request.name + ' connections payload: ' + JSON.stringify(request.payload));
        const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
        // productList contains the list of all ISP products for this skill.
        const productList = await monetizationClient.getInSkillProducts(locale);
        // In the list of products available for purchase find the product with a matching id
        const product = productList.inSkillProducts.find(item => item.productId === productId);
        console.log('Product in response: ' + JSON.stringify(product));
        if (request.status.code === '200' && request.payload.purchaseResult !== 'ERROR') {
            let preSpeechText;
            // check the status - accepted, declined, already purchased, or something went wrong.
            switch (request.payload.purchaseResult) {
                case 'ACCEPTED':
                case 'ALREADY_PURCHASED':
                    //preSpeechText = handlerInput.t('PRODUCT_OWNED_MSG', { productName: product.name });
                    //break;
                case 'DECLINED':
                    preSpeechText = '';
                    break;
                default:
                    preSpeechText = handlerInput.t('BUY_UNKNOWN_RESULT_MSG', { productName: product.name });
                    break;
            }
            // respond back to the customer
            return utils.getResponseBasedOnAccessType(handlerInput, productList, preSpeechText);
        }
        // Request Status Error. Something has failed with the connection.
        console.log('Connections.Response indicated failure. error: ' + request.payload.message);
        return handlerInput.responseBuilder
            .speak(handlerInput.t('BUY_ERROR_MSG'))
            .getResponse();
    }
};

const PurchaseHistoryIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'PurchaseHistoryIntent';
    },
    async handle(handlerInput) {
        console.log('Handler: PurchaseHistoryIntentHandler');
        const locale = Alexa.getLocale(handlerInput.requestEnvelope);

        const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
        // productList contains the list of all ISP products for this skill.
        const productList = await monetizationClient.getInSkillProducts(locale);
        const entitledProducts = productList.inSkillProducts.filter(item => item.entitled === 'ENTITLED')
        if (entitledProducts && entitledProducts.length > 0) {
            const speechOutput = handlerInput.t('BOUGHT_SOMETHING_MSG') + ' ' + utils.getSpeakableListOfProducts(entitledProducts, handlerInput) + '. ' + handlerInput.t('YES_NO_QUESTION');

            return handlerInput.responseBuilder
                .speak(speechOutput)
                .reprompt(speechOutput)
                .getResponse();
        }

        const speechOutput = handlerInput.t('BOUGHT_NOTHING_MSG') + ' ' + handlerInput.t('YES_NO_QUESTION');

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(speechOutput)
            .getResponse();
    }
};

const InventoryIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'InventoryIntent';
    },
    async handle(handlerInput) {
        console.log('Handler: InventoryIntentHandler');
        const locale = Alexa.getLocale(handlerInput.requestEnvelope);

        const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
        // productList contains the list of all ISP products for this skill.
        const productList = await monetizationClient.getInSkillProducts(locale);
        // In the list of products available for purchase find the goodbyes pack
        const goodbyesPackProduct = productList.inSkillProducts.find(item => item.referenceName === 'Goodbyes_Pack');
        const availableGoodbyes = parseInt(utils.getRemainingCredits(handlerInput, goodbyesPackProduct, 'goodbyesUsed', utils.GOODBYES_PER_ENTITLEMENT).availableCredits) || 0;
        let speechOutput = handlerInput.t('AVAILABLE_CREDITS_MSG', { count: availableGoodbyes });
        availableGoodbyes ? speechOutput += handlerInput.t('CREDITS_FOLLOWUP_STOCK') : speechOutput += handlerInput.t('CREDITS_FOLLOWUP_NO_STOCK');
        const repromptOutput = handlerInput.t('YES_NO_QUESTION');
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(repromptOutput)
            .getResponse();
    }
};

const RefundProductIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RefundProductIntent';
    },
    async handle(handlerInput) {
        console.log('Handler: RefundProductIntentHandler');
        const productReferenceName = Alexa.getSlot(handlerInput.requestEnvelope, 'product').resolutions.resolutionsPerAuthority[0].values[0].value.id;
        const locale = Alexa.getLocale(handlerInput.requestEnvelope);

        const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
        // productList contains the list of all ISP products for this skill.
        const productList = await monetizationClient.getInSkillProducts(locale);
        // In the list of products available for purchase find the product with a matching id
        const product = productList.inSkillProducts.find(item => item.referenceName === productReferenceName);
        return utils.cancelDirective(handlerInput, product);
    }
};

const CancelProductResponseHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'Connections.Response'
            && handlerInput.requestEnvelope.request.name === 'Cancel';
    },
    async handle(handlerInput) {
        console.log('Handler: CancelProductResponseHandler');
        const locale = Alexa.getLocale(handlerInput.requestEnvelope);
        const {request} = handlerInput.requestEnvelope;
        const {payload} = request;
        console.log('Cancel connections payload: ' + JSON.stringify(payload));
        const productId = payload.productId;
        let speechOutput;

        const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
        // productList contains the list of all ISP products for this skill.
        const productList = await monetizationClient.getInSkillProducts(locale);
        // In the list of products available for purchase find the product with a matching id
        const product = productList.inSkillProducts.find(item => item.productId === productId);
        console.log('Product in response: ' + JSON.stringify(product));
        if (request.status.code === '200') {
            // Alexa handles the speech response immediately following the cancellation request.
            // It then passes the control to our CancelProductResponseHandler() along with the status code (ACCEPTED, DECLINED, NOT_ENTITLED)
            // We use the status code to stitch additional speech at the end of Alexa's cancellation response.
            // Currently, we have the same additional speech for accepted, canceled, and not_entitled. You may edit these below, if you like.
            if (payload.purchaseResult === 'ACCEPTED') {
                // The cancellation confirmation response is handled by Alexa's Purchase Experience Flow.
                // Simply add to that with handlerInput.t('YES_NO_QUESTION');
                speechOutput = handlerInput.t('YES_NO_QUESTION');
            } else if (payload.purchaseResult === 'DECLINED') {
                // Not possible to cancel
                // Simply add to that with handlerInput.t('YES_NO_QUESTION');
                speechOutput = handlerInput.t('YES_NO_QUESTION');
            } else if (payload.purchaseResult === 'NOT_ENTITLED') {
                // No subscription to cancel.
                // The "No subscription to cancel" response is handled by Alexa's Purchase Experience Flow.
                // Simply add to that with handlerInput.t('YES_NO_QUESTION');
                speechOutput = handlerInput.t('YES_NO_QUESTION');
            }
            return handlerInput.responseBuilder
                .speak(speechOutput)
                .reprompt(speechOutput)
                .getResponse();
        }
        // Something failed.
        console.log(`Connections.Response indicated failure. error: ${request.status.message}`);

        return handlerInput.responseBuilder
            .speak(handlerInput.t('CANCEL_PRODUCT_ERROR_MSG'))
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        console.log('Handler: HelpIntentHandler');
        const speechOutput = handlerInput.t('HELP_MSG');

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(speechOutput)
            .withSimpleCard(handlerInput.t('SKILL_NAME'), speechOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent');
    },
    async handle(handlerInput) {
        console.log('Handler: CancelAndStopIntentHandler');
        const locale = Alexa.getLocale(handlerInput.requestEnvelope);
        const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
        const productList = await monetizationClient.getInSkillProducts(locale);
        return utils.getPremiumOrRandomGoodbye(handlerInput, productList.inSkillProducts);
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

        return handlerInput.responseBuilder.getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${JSON.stringify(error)}`);
        const speechOutput = handlerInput.t('ERROR_MSG');

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(speechOutput)
            .getResponse();
    }
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
    .addRequestHandlers(
        LaunchRequestHandler,
        GetAnotherHelloHandler,
        AvailableProductsIntentHandler,
        DescribeProductIntentHandler,
        BuyProductIntentHandler,
        UpsellOrBuyResponseHandler,
        PurchaseHistoryIntentHandler,
        InventoryIntentHandler,
        RefundProductIntentHandler,
        CancelProductResponseHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler)
    .addErrorHandlers(ErrorHandler)
    .addRequestInterceptors(
        utils.LogRequestInterceptor,
        utils.LoadAttributesRequestInterceptor,
        utils.LocalisationRequestInterceptor)
    .addResponseInterceptors(utils.SaveAttributesResponseInterceptor)
    .withPersistenceAdapter(utils.getPersistenceAdapter())
    .withApiClient(new Alexa.DefaultApiClient())
    .withCustomUserAgent('sample/premium-hello-world/v1.2')
    .lambda();
