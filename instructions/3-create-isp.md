# Build An Alexa Skill with In-Skill Purchases - Premium Hello World
<img src="https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/quiz-game/header._TTH_.png" />

# Create In-Skill Products

On [page #1](./1-setup-vui-alexa-hosted.md) of this guide, we created a voice user interface for the intents and utterances we expect from our users.  On [page #2](./2-create-alexa-hosted-function.md), we created the Alexa Hosted Lambda function that contains all of our logic for the skill. Now we will create the in-skill products that customers can purchase.

This sample implements a "One-Time Purchase" product called "Premium Greeting Pack", which provides greetings in a variety of languages as premium content.

1. Navigate to the Monetization Tool by clicking on the **In-Skill Products** section while on the **Build** tab of the Developer Console. 
    > If you cannot see the correct section in the left nav, click on the **Permissions** section, then click on **In-Skill Products**.
1. Click **Create in-skill product**.
1. Enter a Reference name.  This is code-friendly name you want to assign to your in-skill product.  For this sample, the code is expecting the reference name `Premium_Greeting`.
    > Be sure to enter all the reference names exactly as provided.  They are used in the sample code and it won't work properly if the name does not match exactly.
1. Choose **Subscription**.
1. Click **Create in-skill product**.
1. On the **Distribution** sub-section, enter the following details for the subscription:

    Field|Description|Value for Sample
    -----|-----------|------------------
    **Display Name**|The display name of the product.  Customers will see and hear this.  | Premium Greeting Pack
    **One sentence description**| Summary description of the product. Customers will hear this. | The Premium Greeting Pack says hello in a variety of languages like French, Spanish, Hindi, and more.
    **Detailed Description**|A full description explaining the product's functionality and any prerequisites to using it. Customers will see this.| The Premium Greeting Pack says hello in a variety of languages like French, Spanish, Hindi, and more.
    **Example Phrases**| Example phrases customers can use to access your in-skill products. You should populate all three examples. | give me the premium greeting, give me the special greeting, give me the secret greeting
    **Small Icon**| Small icon used with product when displayed in the skill store or Alexa app.  You can use this placeholder icon if you don't have an image you would like to use. | https://s3.amazonaws.com/ask-samples-resources/icons/moneyicon_108.png
    **Large Icon**| Large icon used with product when displayed in the skill store or Alexa app. You can use this placeholder icon if you don't have an image you would like to use. | https://s3.amazonaws.com/ask-samples-resources/icons/moneyicon_512.png
    **Keywords** | Keywords that will be used with search. | greetings
    **Purchase prompt description**| The description of the product a customer hears when making a purchase or when they cancel a subscription.| The Premium Greeting Pack says hello in a variety of languages like French, Spanish, Hindi, and more.
    **Purchase confirmation description**|A description of the product that displays on the skill card in the Alexa app. Customers will see this. | You now have the Premium Greeting pack, which says hello in a variety of languages like French, Spanish, Hindi, and more.
    **Privacy Policy URL**|A URL to the privacy policy for this locale. For this sample, we'll use a placeholder value. |https://localhost/privacy.html

    > Need help creating icons for your ISP or skill? Check out the [Alexa Skill Icon Builder](https://developer.amazon.com/docs/tools/icon-builder.html)

1. Click **Save and continue**.
1. On the **Pricing** sub-section, the default values (amazon.com, $0.99 USD, Monthly billing, 7 day trial, releasing "today") are fine for the sample, however you can change the values if you like.
1. Set the **Tax Category** to 'Information Services'.  This is suitable for this sample, however you should consult your tax professional for guidance on what to choose for this value.  The available options are listed [here](https://developer.amazon.com/docs/in-skill-purchase/3-create-isp-dev-console.html#tax-category)
1. Click **Save and continue**.
1. Normally you would provide testing instructions to help the certification team find and test your in-skill product.  (These testing instructions are specific to this in-skill product, and are in addition to the skill testing instructions you will provide on the **Certification** tab.)  We're going to leave them blank for now.
1. Click **Save and finish**.
1. If you've provided all the necessary information, you will be able to click **Link to skill** which will link this in-skill product with your skill.  If that's not an option, click **Continue** and then go back and fill in any missing information.
1. Congrats!  You have added a "One-time Purchase" product to your skill. Now you are ready to test!

> Before leaving the In-skill Products page, take a note of the links which say **Reset test purchases**.  During testing if you want to 'un-buy' one of your products so you can re-buy it, click on these links.

[![Next](https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/general/buttons/button_next_testing._TTH_.png)](./4-testing.md)
