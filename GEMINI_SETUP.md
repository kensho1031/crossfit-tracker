# Gemini API Setup Guide

## 1. Get Your Free API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

## 2. Set Up Environment Variables

1. Create a `.env` file in the `crossfit-tracker` directory:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your API key:
   ```
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Important**: Never commit `.env` to git. It's already in `.gitignore`.

## 3. Free Tier Limits

The app uses `gemini-1.5-flash` which has generous free tier limits:
- **15 requests per minute (RPM)**
- **1 million tokens per minute (TPM)**
- **1,500 requests per day (RPD)**

For typical usage (analyzing 5-10 WOD photos per day), you'll stay well within the free tier.

## 4. Restart Development Server

After adding the API key, restart your dev server:
```bash
npm run dev
```

## 5. Test the Feature

1. Click the "SCAN WOD" button
2. Upload a whiteboard photo
3. Wait for AI analysis
4. Review the detected exercises
5. Save as draft or complete immediately

## Troubleshooting

### "Gemini API is not configured"
- Make sure `.env` file exists in the `crossfit-tracker` directory
- Check that the API key is correctly set as `VITE_GEMINI_API_KEY`
- Restart the dev server

### API Rate Limits
If you hit rate limits, wait a minute before trying again. The free tier resets every minute.

### Poor Analysis Results
- Ensure the whiteboard photo is clear and well-lit
- Make sure text is readable
- Try taking the photo from a straight angle
