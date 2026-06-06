import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

// gemini-1.5-flash has been retired by Google; gemini-2.0-flash is its direct
// successor (fast, low-cost, supports JSON response mode). Change here to swap.
const MODEL = 'gemini-2.0-flash';

function getClient(): GoogleGenerativeAI {
  if (!env.GEMINI_API_KEY) {
    throw ApiError.badRequest(
      'AI features require a Google Gemini API key. Add GEMINI_API_KEY to your .env file.',
      'AI_NOT_CONFIGURED'
    );
  }
  return new GoogleGenerativeAI(env.GEMINI_API_KEY);
}

// Run a Gemini request and map provider failures to clean ApiErrors so callers
// get a meaningful status (429 for quota/rate limits) instead of a generic 500.
async function runGenerate(model: GenerativeModel, userMessage: string): Promise<string> {
  try {
    const result = await model.generateContent(userMessage);
    return result.response.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/\b429\b|quota|rate limit|too many requests/i.test(msg)) {
      throw new ApiError(
        429,
        'AI provider quota or rate limit exceeded. Check your Google AI plan and billing, then try again.',
        'AI_RATE_LIMITED'
      );
    }
    throw new ApiError(
      502,
      'The AI provider request failed. Please try again.',
      'AI_PROVIDER_ERROR'
    );
  }
}

async function complete(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 1500
): Promise<string> {
  const model = getClient().getGenerativeModel({
    model: MODEL,
    systemInstruction: systemPrompt,
    generationConfig: { maxOutputTokens: maxTokens },
  });
  const text = await runGenerate(model, userMessage);
  if (!text) throw ApiError.internal('Unexpected AI response type', 'AI_ERROR');
  return text;
}

async function completeJSON<T>(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 1500
): Promise<T> {
  const jsonSystemPrompt = `${systemPrompt}\n\nYou must respond with valid JSON only. No markdown, no backticks, no explanation — raw JSON that can be parsed directly with JSON.parse().`;
  const model = getClient().getGenerativeModel({
    model: MODEL,
    systemInstruction: jsonSystemPrompt,
    generationConfig: { maxOutputTokens: maxTokens, responseMimeType: 'application/json' },
  });
  const text = await runGenerate(model, userMessage);
  try {
    return JSON.parse(text) as T;
  } catch {
    // Try to extract JSON from the response if it has extra text
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]) as T;
    throw ApiError.internal('AI returned invalid JSON', 'AI_PARSE_ERROR');
  }
}

// ─────────────────────────────────────────────────────────────
// FEATURE 1: Care Plan Generator
// ─────────────────────────────────────────────────────────────

export interface CarePlanInput {
  recipient: {
    firstName: string;
    lastName: string;
    primaryDiagnosis: string | null;
    secondaryDiagnoses: string[];
    mobilityStatus: string | null;
    dietaryRestrictions: string[];
    notes: string | null;
  };
  medications: Array<{ name: string; frequency: string; isPRN: boolean }>;
  teamMembers: Array<{ firstName: string; role: string }>;
  caregiverSchedules: string; // Free text: "Maria works Mon-Fri 8am-4pm, Narrissa covers evenings and weekends"
  specificChallenges: string; // Free text: "sundowning at 3pm, refuses medications sometimes"
}

export interface CarePlanOutput {
  summary: string;
  dailySchedule: Array<{
    timeBlock: string;
    tasks: string[];
    responsibleRole: string;
    notes: string;
  }>;
  keyRecommendations: string[];
  redFlags: string[];
  suggestedTaskAssignments: Array<{
    task: string;
    assignTo: string;
    frequency: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export async function generateCarePlan(input: CarePlanInput): Promise<CarePlanOutput> {
  const systemPrompt = `You are an expert caregiving coordinator with 20 years of experience creating personalized care plans for families caring for loved ones with dementia, Parkinson's, stroke, and other complex conditions.

Your care plans are:
- Practical and immediately actionable
- Sensitive to family dynamics and caregiver capacity
- Grounded in evidence-based caregiving practices
- Specific to the patient's exact diagnoses and needs

You create plans that reduce chaos, prevent caregiver burnout, and improve outcomes for the care recipient.`;

  const userMessage = `Create a comprehensive care plan for ${input.recipient.firstName} ${input.recipient.lastName}.

PATIENT INFORMATION:
- Primary diagnosis: ${input.recipient.primaryDiagnosis || 'Not specified'}
- Additional conditions: ${input.recipient.secondaryDiagnoses.join(', ') || 'None'}
- Mobility: ${input.recipient.mobilityStatus || 'Not specified'}
- Dietary needs: ${input.recipient.dietaryRestrictions.join(', ') || 'None'}
- Care notes: ${input.recipient.notes || 'None'}

CURRENT MEDICATIONS:
${input.medications.map((m) => `- ${m.name} (${m.frequency}${m.isPRN ? ', PRN' : ''})`).join('\n') || 'None listed'}

CARE TEAM:
${input.teamMembers.map((m) => `- ${m.firstName}: ${m.role}`).join('\n')}

CAREGIVER SCHEDULES:
${input.caregiverSchedules}

SPECIFIC CHALLENGES:
${input.specificChallenges}

Generate a detailed, practical care plan in JSON format with: summary, dailySchedule (array of time blocks with tasks, responsible role, and notes), keyRecommendations (array of strings), redFlags (things to watch for, array of strings), and suggestedTaskAssignments (array with task, assignTo role, frequency, priority).`;

  return completeJSON<CarePlanOutput>(systemPrompt, userMessage, 2000);
}

// ─────────────────────────────────────────────────────────────
// FEATURE 2: AI Family Mediator
// ─────────────────────────────────────────────────────────────

export interface MediatorInput {
  situation: string;
  recipientName: string;
  teamMembers: Array<{ firstName: string; role: string }>;
  context?: string;
}

export interface MediatorOutput {
  summary: string;
  keyConsiderations: string[];
  perspectives: Array<{
    viewpoint: string;
    validPoints: string[];
    concerns: string[];
  }>;
  recommendation: string;
  suggestedNextSteps: string[];
  importantReminder: string;
}

export async function mediateDisagreement(input: MediatorInput): Promise<MediatorOutput> {
  const systemPrompt = `You are a compassionate, neutral family mediator specializing in caregiving decisions. You help families navigate difficult decisions with empathy, objectivity, and a focus on what's best for both the care recipient and the caregivers.

You:
- Acknowledge the emotional difficulty of caregiving situations
- Present multiple perspectives fairly without taking sides
- Ground recommendations in the wellbeing of the care recipient
- Recognize that caregiver wellbeing matters too — burnout helps no one
- Suggest practical next steps that move the family forward
- Never shame or blame family members for their positions

Your tone is warm, wise, and non-judgmental.`;

  const userMessage = `Our family is dealing with a difficult situation regarding care for ${input.recipientName}.

CARE TEAM: ${input.teamMembers.map((m) => `${m.firstName} (${m.role})`).join(', ')}

THE SITUATION:
${input.situation}

${input.context ? `ADDITIONAL CONTEXT:\n${input.context}` : ''}

Please help us work through this. Provide a structured analysis with: a summary of the core issue, key considerations everyone should think about, the different perspectives at play (with their valid points and concerns), your recommendation, suggested next steps, and an important reminder to keep in mind.`;

  return completeJSON<MediatorOutput>(systemPrompt, userMessage, 1500);
}

// ─────────────────────────────────────────────────────────────
// FEATURE 3: Daily Summary Generator
// ─────────────────────────────────────────────────────────────

export interface DailySummaryInput {
  recipientName: string;
  primaryDiagnosis: string | null;
  date: string;
  careLogs: Array<{
    type: string;
    occurredAt: string;
    notes?: string;
    mealDescription?: string;
    mealAmount?: string;
    waterOz?: number;
    moodRating?: number;
    painLevel?: number;
    fallLocation?: string;
    behaviorDescription?: string;
    loggedByUser: { firstName: string };
  }>;
  medicationLogs: Array<{
    medicationName: string;
    given: boolean;
    administeredAt: string;
    administeredByName: string;
  }>;
  vitalSigns?: Array<{
    recordedAt: string;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number;
    temperatureF?: number;
    oxygenSaturation?: number;
  }>;
}

export interface DailySummaryOutput {
  narrative: string;
  highlights: string[];
  concerns: string[];
  medicationSummary: string;
  recommendationsForTomorrow: string[];
}

export async function generateDailySummary(input: DailySummaryInput): Promise<DailySummaryOutput> {
  const systemPrompt = `You are a skilled care coordinator writing daily summaries for family caregiving teams. Your summaries are:
- Clear and easy for non-medical family members to understand
- Professional enough to share with healthcare providers
- Honest about concerns without being alarmist
- Warm and human — you're writing about a real person, not a clinical case
- Concise but complete`;

  const careLogSummary =
    input.careLogs
      .map((log) => {
        const parts = [
          `${log.type} at ${new Date(log.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (by ${log.loggedByUser.firstName})`,
        ];
        if (log.mealDescription)
          parts.push(`meal: ${log.mealDescription}, amount: ${log.mealAmount || 'unknown'}`);
        if (log.waterOz) parts.push(`water: ${log.waterOz}oz`);
        if (log.moodRating) parts.push(`mood: ${log.moodRating}/5`);
        if (log.painLevel !== undefined && log.painLevel !== null)
          parts.push(`pain: ${log.painLevel}/10`);
        if (log.fallLocation) parts.push(`FALL in ${log.fallLocation}`);
        if (log.behaviorDescription) parts.push(`behavior: ${log.behaviorDescription}`);
        if (log.notes) parts.push(`notes: ${log.notes}`);
        return parts.join(' — ');
      })
      .join('\n') || 'No care logs recorded today.';

  const medSummary =
    input.medicationLogs
      .map(
        (m) =>
          `${m.medicationName}: ${m.given ? '✓ given' : '✗ NOT given'} at ${new Date(m.administeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by ${m.administeredByName}`
      )
      .join('\n') || 'No medication logs recorded.';

  const vitalsSummary = input.vitalSigns?.length
    ? input.vitalSigns
        .map(
          (v) =>
            `BP: ${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}, HR: ${v.heartRate}, O2: ${v.oxygenSaturation}%, Temp: ${v.temperatureF}°F`
        )
        .join('\n')
    : 'No vitals recorded.';

  const userMessage = `Generate a daily care summary for ${input.recipientName} (${input.primaryDiagnosis || 'diagnosis not specified'}) for ${input.date}.

CARE LOG ENTRIES:
${careLogSummary}

MEDICATIONS:
${medSummary}

VITAL SIGNS:
${vitalsSummary}

Write a warm, professional narrative summary plus: highlights (positive things), concerns (anything to watch), a one-sentence medication summary, and recommendations for tomorrow.`;

  return completeJSON<DailySummaryOutput>(systemPrompt, userMessage, 1200);
}

// ─────────────────────────────────────────────────────────────
// FEATURE 4: Caregiver Burnout Assessment
// ─────────────────────────────────────────────────────────────

export interface BurnoutInput {
  caregiverName: string;
  role: string;
  daysAnalyzed: number;
  tasksAssigned: number;
  tasksCompleted: number;
  tasksMissed: number;
  careLogsCreated: number;
  activeDays: number;
  selfReportedStress?: string;
  recentChallenges?: string;
}

export interface BurnoutOutput {
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  riskScore: number;
  summary: string;
  warningSignsPresent: string[];
  protectiveFactorsPresent: string[];
  recommendations: string[];
  urgentActions: string[];
  affirmation: string;
}

export async function assessBurnoutRisk(input: BurnoutInput): Promise<BurnoutOutput> {
  const systemPrompt = `You are a compassionate caregiver wellness specialist. You analyze caregiver activity patterns to identify burnout risk early — before it becomes a crisis.

You understand that:
- Caregiver burnout is a medical reality, not a personal failure
- The best thing for a care recipient is a healthy, sustainable caregiver
- Burnout manifests in measurable patterns before people recognize it themselves
- Your job is to be honest but kind — never alarmist, never dismissive

Your assessments are evidence-based, compassionate, and actionable.`;

  const completionRate =
    input.tasksAssigned > 0 ? Math.round((input.tasksCompleted / input.tasksAssigned) * 100) : 100;
  const activityRate =
    input.daysAnalyzed > 0 ? Math.round((input.activeDays / input.daysAnalyzed) * 100) : 0;

  const userMessage = `Assess burnout risk for ${input.caregiverName}, who serves as ${input.role}.

ACTIVITY DATA (last ${input.daysAnalyzed} days):
- Tasks assigned: ${input.tasksAssigned}
- Tasks completed: ${input.tasksCompleted} (${completionRate}% completion rate)
- Tasks missed: ${input.tasksMissed}
- Care log entries created: ${input.careLogsCreated}
- Days active in the app: ${input.activeDays} of ${input.daysAnalyzed} (${activityRate}% activity rate)

${input.selfReportedStress ? `SELF-REPORTED STRESS LEVEL:\n${input.selfReportedStress}` : ''}
${input.recentChallenges ? `RECENT CHALLENGES:\n${input.recentChallenges}` : ''}

Provide a burnout risk assessment with: riskLevel (low/moderate/high/critical), riskScore (0-100), summary, warningSignsPresent (from the data), protectiveFactorsPresent, specific recommendations, urgentActions (empty array if risk is low/moderate), and an affirmation message that acknowledges their dedication.`;

  return completeJSON<BurnoutOutput>(systemPrompt, userMessage, 1000);
}

// ─────────────────────────────────────────────────────────────
// FEATURE 5: Care Q&A (Contextual Caregiving Advisor)
// ─────────────────────────────────────────────────────────────

export interface CareQAInput {
  question: string;
  recipientContext: {
    firstName: string;
    primaryDiagnosis: string | null;
    secondaryDiagnoses: string[];
    medications: string[];
    recentNotes?: string;
  };
}

export async function answerCareQuestion(input: CareQAInput): Promise<string> {
  const systemPrompt = `You are an expert caregiving advisor with deep knowledge of dementia, Parkinson's disease, Alzheimer's, stroke recovery, hospice care, and elder care generally.

You have context about a specific patient and provide:
- Practical, actionable guidance
- Evidence-based information families can actually use
- Honest answers even when the truth is difficult
- Appropriate caveats when professional medical advice is needed
- Compassionate tone that acknowledges how hard caregiving is

You never replace a doctor but you help families understand their situation and ask better questions.`;

  const userMessage = `I have a question about caring for ${input.recipientContext.firstName}, who has ${input.recipientContext.primaryDiagnosis || 'complex medical needs'}${input.recipientContext.secondaryDiagnoses.length ? ` and also ${input.recipientContext.secondaryDiagnoses.join(', ')}` : ''}.

Their current medications include: ${input.recipientContext.medications.join(', ') || 'not specified'}.

${input.recipientContext.recentNotes ? `Recent care notes: ${input.recipientContext.recentNotes}` : ''}

MY QUESTION:
${input.question}`;

  return complete(systemPrompt, userMessage, 800);
}
