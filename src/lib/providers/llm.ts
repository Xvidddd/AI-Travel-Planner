import "server-only";

type PlannerLLMDay = {
  day: number;
  focus: string;
  items: string[];
};

export type PlannerPayload = {
  destination: string;
  days: number;
  budget: number;
  personas: string[];
  preferences: string[];
};

type PlannerLLMResponse = {
  summary: string;
  days: PlannerLLMDay[];
};

const DEFAULT_PROVIDER = process.env.LLM_PROVIDER ?? "mock";

export async function generateItinerary(payload: PlannerPayload): Promise<PlannerLLMResponse> {
  if (DEFAULT_PROVIDER === "deepseek") {
    return callDeepseek(payload);
  }

  // Fallback mock 结果，方便在未配置 LLM 时开发 UI
  return {
    summary: `${payload.personas.join("/")} 的 ${payload.destination} ${payload.days} 天行程`,
    days: Array.from({ length: payload.days }).map((_, index) => ({
      day: index + 1,
      focus: "探索城市 + 亲子活动",
      items: ["AI 生成内容占位"],
    })),
  };
}

async function callDeepseek(payload: PlannerPayload): Promise<PlannerLLMResponse> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const endpoint = process.env.DEEPSEEK_API_ENDPOINT ?? "https://api.deepseek.com/v1";
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  if (!apiKey) {
    throw new Error("缺少 DEEPSEEK_API_KEY，无法调用 DeepSeek API");
  }

  const userPrompt = `目的地：${payload.destination}\n出行天数：${payload.days}\n预算：${payload.budget}\n同行角色：${payload.personas.join(", ")}\n偏好：${payload.preferences.join(", ")}`;
  const systemPrompt = "你是 AuroraVoyage 的 AI 旅行规划师，请使用自然中文，用 JSON 描述每天的行程。";

  const body = {
    model,
    temperature: 0.35,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system" as const,
        content: `${systemPrompt} 返回格式：{"summary": string, "days": [{"day": number, "focus": string, "items": string[]}]}。不要输出额外文本。`,
      },
      { role: "user" as const, content: userPrompt },
    ],
  };

  const response = await fetch(`${endpoint}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API 调用失败：${response.status} ${errorText}`);
  }

  const completion = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = completion.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("DeepSeek API 未返回内容");
  }

  try {
    const parsed = JSON.parse(content) as PlannerLLMResponse;
    return {
      summary: parsed.summary,
      days: parsed.days.map((day, index) => ({
        day: day.day ?? index + 1,
        focus: day.focus ?? "AI 行程亮点",
        items: day.items?.length ? day.items : ["AI 生成内容"],
      })),
    };
  } catch (error) {
    throw new Error(`DeepSeek 响应解析失败：${(error as Error).message}`);
  }
}
