import { StateGraph, Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, BaseMessage, AIMessage } from "@langchain/core/messages";
import Volunteer from "@/models/Volunteer";
import dbConnect from "@/lib/db";

// Define the Graph state shape
export const OnboardingState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => {
      if (y && y.length > 0 && y[0].additional_kwargs?.overwrite) {
        return y.map((m, i) => {
          if (i === 0) {
            const kwargs = { ...m.additional_kwargs };
            delete kwargs.overwrite;
            return new (m.constructor as any)({
              content: m.content,
              additional_kwargs: kwargs,
            });
          }
          return m;
        });
      }
      return x.concat(y);
    },
    default: () => [],
  }),
  volunteerId: Annotation<string>({
    reducer: (x, y) => (y && y.length > 0 ? y : x),
    default: () => "",
  }),
  onboardingComplete: Annotation<boolean>({
    reducer: (_, y) => y,
    default: () => false,
  }),
  extractedProfile: Annotation<any>({
    reducer: (_, y) => y,
    default: () => null,
  }),
  summary: Annotation<string>({
    reducer: (_, y) => y,
    default: () => "",
  }),
});

const SYSTEM_PROMPT = `You are the AI Onboarding Coordinator for NayePankh Foundation, a leading Indian NGO driving social impact in underprivileged education, menstrual hygiene, and animal welfare.
Your goal is to screen new volunteer applicants through a warm, engaging, and professional conversation.
Tone guideline: Brand-aligned (subtly inspired by chocolate and peach colors), encouraging, and polite.

Please collect the following information in a conversational manner:
1. Current location
2. Availability (hours per week they can commit)
3. Key skills (e.g., Teaching, Public Speaking, Animal Rescue, Event Management)
4. Preferred domain (Education, Hygiene, Animal Welfare)

Ask questions one at a time. Keep your messages concise.
Once you have gathered all four pieces of information:
1. Summarize their details, thank them, and explain that they are now registered.
2. End your message exactly with the tag: [ONBOARDING_COMPLETE]
3. Append a JSON payload below the tag representing the extracted profile:
{
  "location": "City Name",
  "availability": 10,
  "skills": ["Skill 1", "Skill 2"],
  "targetDomain": "Education / Hygiene / Animal Welfare",
  "screeningNotes": "A brief summary of their background and enthusiasm."
}`;
const GENERAL_ASSISTANT_PROMPT = `You are the NayePankh AI Assistant. You are here to help registered volunteers of NayePankh Foundation, a leading Indian NGO driving social impact in underprivileged education, menstrual hygiene, and animal welfare.
Your goal is to answer volunteer questions, provide information about our campaigns, and support them in their volunteering journey.
Tone guideline: Brand-aligned (subtly inspired by chocolate and peach colors), friendly, helpful, and polite.
Keep your responses concise and informative. Do not use any emojis in your response.`;



// Onboarding conversational node
async function screeningNode(state: typeof OnboardingState.State) {
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.startsWith("your_")) {
    throw new Error("System Error: The Groq API key is missing or invalid in .env.local.");
  }

  const model = new ChatOpenAI({
    apiKey: process.env.GROQ_API_KEY,
    configuration: {
      baseURL: "https://api.groq.com/openai/v1",
    },
    modelName: "llama-3.3-70b-versatile",
    temperature: 0.6,
  });

  const prompt = state.onboardingComplete ? GENERAL_ASSISTANT_PROMPT : SYSTEM_PROMPT;

  const fullMessages = [
    new SystemMessage(prompt),
    ...state.messages,
  ];

  try {
    const response = await model.invoke(fullMessages);
    return { messages: [response] };
  } catch (err: any) {
    const errMsg = String(err).toLowerCase();
    if (errMsg.includes("api_key") || errMsg.includes("401") || errMsg.includes("authentication") || errMsg.includes("credentials")) {
      throw new Error("System Error: Groq API authentication failed. Your API key might be invalid or expired.");
    }
    throw err;
  }
}

// Extraction node checking completion tag
async function extractionNode(state: typeof OnboardingState.State) {
  const lastMessage = state.messages[state.messages.length - 1];
  if (!lastMessage || !(lastMessage instanceof AIMessage)) {
    return { onboardingComplete: false };
  }

  const text = lastMessage.content as string;
  if (text.includes("[ONBOARDING_COMPLETE]")) {
    const jsonIndex = text.indexOf("{");
    if (jsonIndex !== -1) {
      try {
        const jsonText = text.substring(jsonIndex);
        const parsed = JSON.parse(jsonText.trim());
        return {
          onboardingComplete: true,
          extractedProfile: parsed,
        };
      } catch (err) {
        console.error("Failed to parse onboarding JSON block:", err);
      }
    }
  }

  return { onboardingComplete: false };
}

// Save profile database write node
async function saveProfileNode(state: typeof OnboardingState.State) {
  if (state.onboardingComplete && state.extractedProfile && state.volunteerId) {
    await dbConnect();
    const profile = state.extractedProfile;

    await Volunteer.findByIdAndUpdate(state.volunteerId, {
      $set: {
        location: profile.location || "",
        availability: typeof profile.availability === 'number' ? profile.availability : 0,
        skills: Array.isArray(profile.skills) ? profile.skills : [],
        targetDomain: profile.targetDomain || "",
        screeningNotes: profile.screeningNotes || "",
        onboardingComplete: true,
      },
    }, { new: true });
    console.log(`Successfully saved volunteer profile for ID: ${state.volunteerId}`);
  }
  return {};
}

// Conversational history summarization node
async function summarizerNode(state: typeof OnboardingState.State) {
  const messages = state.messages;
  if (messages.length <= 6) {
    return {};
  }

  console.log(`State message history length (${messages.length}) exceeds 6. Summarizing past conversation...`);

  // We want to summarize the older messages (all except the last 2)
  const toSummarize = messages.slice(0, -2);
  const keepMessages = messages.slice(-2);

  // Format conversation for the summarizer
  const formatted = toSummarize
    .map((m: any) => {
      // Messages may be plain objects after checkpoint deserialization (no prototype methods)
      const type = typeof m.getType === 'function'
        ? m.getType()
        : (m._type || m.type || 'unknown');
      const role = type === 'human' ? 'User' : 'Agent';
      const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
      return `${role}: ${content}`;
    })
    .join('\n');

  let summary = "";

  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.startsWith("your_")) {
    // Mock summary
    summary = `Volunteer expressed interest, available 6 hours per week, teaching and public speaking skills.`;
  } else {
    const model = new ChatOpenAI({
      apiKey: process.env.GROQ_API_KEY,
      configuration: {
        baseURL: "https://api.groq.com/openai/v1",
      },
      modelName: "llama-3.3-70b-versatile",
      temperature: 0.3,
    });

    const prompt = `Distill the following NayePankh volunteer onboarding chat history into a single paragraph summary of the key facts collected (location, availability, skills, target domain). Include any existing summary context.
Existing summary context: ${state.summary || "None"}

Chat history to summarize:
${formatted}`;

    try {
      const res = await model.invoke(prompt);
      summary = res.content as string;
    } catch (err) {
      console.error("Summarizer call failed, falling back to mock summary:", err);
      summary = `Volunteer expressed interest, available 6 hours per week, teaching and public speaking skills.`;
    }
  }

  // Create a new SystemMessage to replace the older messages, marked with overwrite flag
  const summaryMessage = new SystemMessage({
    content: `Here is a summary of the conversation so far: ${summary}`,
    additional_kwargs: { overwrite: true }
  });

  return {
    summary,
    messages: [summaryMessage, ...keepMessages]
  };
}

// Router condition edge function
function shouldContinue(state: typeof OnboardingState.State) {
  return state.onboardingComplete ? "save_profile" : "summarize";
}

// Build the compiled LangGraph workflow
export function createOnboardingGraph(checkpointer: any) {
  const workflow = new StateGraph(OnboardingState)
    .addNode("screening", screeningNode)
    .addNode("extraction", extractionNode)
    .addNode("summarize", summarizerNode)
    .addNode("save_profile", saveProfileNode)
    .addEdge("__start__", "screening")
    .addEdge("screening", "extraction")
    .addConditionalEdges("extraction", shouldContinue, {
      save_profile: "save_profile",
      summarize: "summarize",
    })
    .addEdge("summarize", "__end__")
    .addEdge("save_profile", "__end__");

  return workflow.compile({ checkpointer });
}
