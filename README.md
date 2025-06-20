<p align="center">
  <img src="https://i.imgur.com/1nS2usJ.png" alt="Screenshot of Aiki" />
</p>

# Aiki - T3 Chat Clone

This is a real-time, AI-powered chat app built during the **T3 Chat Cloneathon** by **xDestino** and **TimeTheDev**. It’s designed as a feature-rich clone of modern AI chat interfaces, including voice, image generation, PDF reading, web search, custom agents, and more.

## 🚀 How to Run It Locally

Follow these steps to run the project locally:

### 1. Clone the repository

```bash
git clone https://github.com/xDestinoJS/opensource-chat-client
cd opensource-chat-client
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up local enviroment variables

```
NEXT_PUBLIC_CONVEX_URL=

# Deployment used by `npx convex dev`
CONVEX_DEPLOYMENT=

# Same as NEXT_PUBLIC_CONVEX_URL but ends in .site
NEXT_PUBLIC_CONVEX_SITE_URL=

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

AWS_BUCKET_NAME=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_ENDPOINT_URL_S3=
AWS_ENDPOINT_URL_IAM=
AWS_REGION=auto
```

### 3. Set up Convex environment variables

Create a `.env` file in the root directory and add the following environment variables:

```
AWS_ACCESS_KEY_ID=
AWS_BUCKET_NAME=
AWS_ENDPOINT_URL_IAM=
AWS_ENDPOINT_URL_S3=
AWS_REGION=
AWS_SECRET_ACCESS_KEY=
BETTER_AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_GENERATIVE_AI_API_KEY=
JWKS=
JWT_PRIVATE_KEY=
MISTRAL_API_KEY=
OPENAI_API_KEY=
OPENROUTER_API_KEY=
SITE_URL=http://localhost:3000
TOGETHER_AI_API_KEY=
```

> ⚠️ Be sure to replace each value with your actual API keys and credentials. Some features won't work if any of these are missing.

### 4. Run the development server

```bash
npm run dev
```

Once running, open [http://localhost:3000](http://localhost:3000) in your browser.

## ✅ Things Done
  - [x] Create sidebar menu
  - [x] Rename chat
  - [x] Add voice feature (https://developer.puter.com/tutorials/free-unlimited-text-to-speech-api/)
  - [x] Sort sidebar by: Today / Yesterday / Last 7 Days / Last 30 Days / Older
  - [x] Add additional chat features
    - [x] Pin chat
    - [x] Delete chat
  - [x] Add Openrouter support
  - [x] Add quoting system
    - [x] Make quoting appear
    - [x] Make quoting function
    - [x] Change icon
  - [x] Remake model selector
  - [x] Added back streaming component
    - [x] Make branching work again
    - [x] Make edits work again
    - [x] Make retries work again
  - [x] Make retry button allow user to retry with different model (or with shift, no modal)
  - [x] Add Better-Auth
  - [ ] Add features
    - [x] Add vision
      - [x] Add Tigris File Uploads
    - [x] Add PDF reading
    - [x] Add Image Generation -> Imagen/OpenAI? (https://ai-sdk.dev/docs/ai-sdk-core/image-generation) //openai, togetherai
    - [x] Add web search for Gemini (include sources) -> (just add frontend: halfway done) https://ai-sdk.dev/cookbook/node/web-search-agent#gemini
      - [x] Add to backend
      - [x] Add to frontend
      - [x] Add reasoning
        - [x] effort control dropdown (high, medium, low)
  - [x] Add Thread Seaching
  - [x] Add Spotlight-like feature
  - [x] Add auth, ratelimiting (watch theo's vid)
    - [x] Link threads to accounts
  - [x] Add Thread Sharing
  - [x] Add Settings (50%) **TODO**
  - [x] Do UI
  - [x] Add dark theme
  - [x] Add Custom Agents (GPTs)
  - [x] Add color theme changing

## 🛠️ Still To-Do:
- [ ] Pending -> threads
- [ ] Create Basic Canvas (Document/Code)
