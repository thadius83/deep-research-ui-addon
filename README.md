# Fork from Alvin De Cruz https://github.com/kellemar/deep-research-ui-addon

This is a fork of a fork ;) The changes include mostly tweaks to the prompting, the ability to use other models and endpoints

### Custom endpoints and models

There are 2 other optional env vars that lets you tweak the endpoint (for other OpenAI compatible APIs like OpenRouter or Gemini) as well as the model string.

```bash
OPENAI_ENDPOINT="custom_endpoint"
OPENAI_MODEL="custom_model"
```




# AI Research Assistant

This is a fork off David's great work at https://github.com/dzhng/deep-research. This includes a new UI/UX based on NextJS.

In short, it's a sophisticated research tool powered by AI that helps users explore topics deeply and comprehensively through multiple sources.

## Features

- **Intelligent Research**: Conducts comprehensive research across multiple sources based on user queries
- **Interactive Follow-up Questions**: Generates relevant follow-up questions to better understand research needs
- **Adjustable Research Parameters**:
  - Research Breadth (1-5): Controls the diversity of sources explored
  - Research Depth (1-5): Determines how deeply each source is analyzed
- **Real-time Progress Updates**: Visual feedback on research progress with loading animations
- **Export Options**:
  - Copy full report
  - Copy sources separately
  - Export to PDF with professional formatting
- **Source Attribution**: All research includes properly cited sources
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## Technology Stack

- **Frontend**:
  - Next.js 15.1.6
  - React 19
  - TypeScript
  - Tailwind CSS for styling
  - Lucide React for icons

- **UI Components**:
  - Custom Card components
  - Interactive Slider
  - Circular Progress indicator
  - Markdown renderer

- **AI Integration**:
  - OpenAI SDK for AI processing
  - Custom deep research implementation

## Getting Started

1. **Clone the repository**

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file with required API keys:
Get your Firecrawl API key from https://firecrawl.dev
```env
OPENAI_API_KEY=your_api_key_here
FIRECRAWL_KEY=your_api_key_here
```

4. **Set up custom Endpoint & model - optional **

To use local LLM, comment out `OPENAI_KEY` and instead uncomment `OPENAI_ENDPOINT` and `OPENAI_MODEL`:
- In .env.local
- Set `OPENAI_ENDPOINT` to the address of your local server (eg."http://localhost:1234/v1")
- Set `OPENAI_MODEL` to the name of the model loaded in your local server.



4. **Run the development server**
```bash
npm run dev
```

5. **Build for production**
```bash
npm run build
```

6. **Start the App**
```bash
npm start
```

## Usage

1. Enter your research topic in the main input field
2. Adjust research parameters if needed:
   - Breadth: Controls the variety of sources (1-5)
   - Depth: Controls the detail level (1-5)
3. Click "Begin Research"
4. Answer follow-up questions to refine the research
5. Review the generated report
6. Export or copy the results as needed

## Project Structure

```
src/
├── app/                 # Next.js app directory
├── components/         # React components
│   ├── ui/            # Reusable UI components
│   ├── ResearchForm.tsx
│   └── Markdown.tsx
├── lib/               # Utility functions
│   └── deep-research.ts
└── types/             # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Acknowledgments

- Built with Next.js and React
- Styled with Tailwind CSS
- AI powered by OpenAI
- Icons by Lucide React
