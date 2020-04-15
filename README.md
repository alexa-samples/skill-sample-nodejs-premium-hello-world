# Build An Alexa Skill with In-Skill Purchases - Premium Hello World
<img src="https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/fact/header._TTH_.png" />

Adding premium content to your skill is a way for you to monetize your skill.  This Alexa sample skill is a template for a basic ISP skill. It takes the hello world skill and adds greetings in a variety of languages as premium content. This premium content is accessed through a one-time purchase of the "Greetings Pack". It also includes a monthly "Premium Subscription", which greets the customer in multiple languages in a variety of voices using Amazon Polly. Finally, the third type of ISP product is also included (Consumables) as a "Goodbyes Pack" so you get goodbyes in different languages a limited number of times (note that the consumables are tracked in DynamoDB and you need to grant DynamoDB access to your skill Lambda role).

## What's covered
1. [Module 01](./01): Deployment of an ISP product of type Entitlement via the ASK-CLI
2. [Module 01](./01): Get a list of purchasable ISP products
3. [Module 01](./01): Upsell and Buy directives (both request and response)
4. [Module 02](./02): Deployment of an ISP product of type Subscription via the ASK-CLI
5. [Module 02](./02): Products collected via slots with automatic dialog delegation
6. [Module 02](./02): Refund of ISP products
7. [Module 03](./03): Deployment of an ISP product of type Consumable via the ASK-CLI
8. [Module 03](./03): Ask for purchase history
9. [Module 03](./03): Ask for inventory of consumables (DynamoDB based persistence adapter used for keeping track)

Each module is standalone and can be deployed independently but each builds on top of the previous one. Hence module 3 covers all topics.