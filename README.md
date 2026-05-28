# MBiR Builder

Standalone Vite React app for generating monthly BI leadership review draft cards from Monday.com initiatives with Claude.

## Local Development

```powershell
npm install
npm run dev
```

Open the local URL Vite prints in the terminal.

## Notes

- The app asks for Monday and Claude API keys in the browser.
- Claude calls use Anthropic's direct browser access header because this is a standalone client-side prototype.
- Do not commit API keys or `.env` files.
