const db = require("../config/db");

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const CHAT_MODEL = process.env.GROQ_CHAT_MODEL || "llama-3.1-8b-instant";
const DIAGNOSIS_MODEL = process.env.GROQ_DIAGNOSIS_MODEL || CHAT_MODEL;

const sessionMemory = new Map();

function sessionKey(userId, sessionId) {
  return `${userId}:${sessionId || "default"}`;
}

function trimHistory(history = []) {
  return history.slice(-6);
}

function buildPanelContextText(panel, inspections) {
  const currentOutput = Number(panel.current_output || 0);
  const maxOutput = Number(panel.max_output || 0);
  const efficiency =
    maxOutput > 0 ? Math.round((currentOutput / maxOutput) * 100) : 0;

  const inspectionLines = inspections.length
    ? inspections
        .map((item, index) => {
          return `${index + 1}. ${new Date(item.inspected_at).toLocaleString()} | ${item.fault_level || "none"} | ${item.description || "No issues detected"} | ${item.inspector || "AI Detection System"}`;
        })
        .join("\n")
    : "No recent inspection history found.";

  return [
    `Panel ID: ${panel.panel_id}`,
    `Company: ${panel.company_name || "Unknown"}`,
    `Priority: ${panel.priority || "low"}`,
    `Current Fault: ${panel.current_fault_description || "No issues detected"}`,
    `Fault Level: ${panel.current_fault_level || "none"}`,
    `Current Output: ${currentOutput}`,
    `Max Output: ${maxOutput}`,
    `Estimated Efficiency: ${efficiency}%`,
    `Maintenance Suggestion: ${panel.maintenance_suggestion || "No maintenance suggestion available"}`,
    `Image Available: ${Boolean(panel.image) ? "Yes" : "No"}`,
    `Recent Inspection History:\n${inspectionLines}`,
  ].join("\n");
}

async function loadPanelContext(userId, panelId) {
  if (!panelId) {
    return null;
  }

  const [panelRows] = await db.query(
    `SELECT * FROM panels WHERE user_id = ? AND panel_id = ? LIMIT 1`,
    [userId, panelId],
  );

  if (panelRows.length === 0) {
    return null;
  }

  const panel = panelRows[0];

  const [inspectionRows] = await db.query(
    `SELECT inspected_at, description, fault_level, inspector, image
     FROM panel_inspections
     WHERE user_id = ? AND panel_id = ?
     ORDER BY inspected_at DESC
     LIMIT 3`,
    [userId, panelId],
  );

  return {
    panel,
    inspections: inspectionRows,
    contextText: buildPanelContextText(panel, inspectionRows),
  };
}

async function callGroq({
  model,
  messages,
  temperature = 0.4,
  maxTokens = 1200,
}) {
  if (!GROQ_API_KEY) {
    const error = new Error("Missing GROQ_API_KEY");
    error.statusCode = 500;
    throw error;
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: 1,
      stream: false,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data?.error?.message || "Failed to generate AI response",
    );
    error.statusCode = response.status;
    throw error;
  }

  return data?.choices?.[0]?.message?.content || "";
}

exports.getPanelContext = async (req, res) => {
  try {
    const userId = req.user.id;
    const { panelId } = req.params;

    const context = await loadPanelContext(userId, panelId);

    if (!context) {
      return res.status(404).json({ message: "Panel not found" });
    }

    return res.json({
      panelId: context.panel.panel_id,
      panel: context.panel,
      inspections: context.inspections,
      contextText: context.contextText,
    });
  } catch (err) {
    console.error("AI panel context error:", err);
    return res.status(500).json({ message: "Could not fetch panel context" });
  }
};

exports.chatWithContext = async (req, res) => {
  try {
    const userId = req.user.id;
    const { message, panelId, sessionId } = req.body || {};

    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: "message is required" });
    }

    const memoryKey = sessionKey(userId, sessionId);
    const previousSession = sessionMemory.get(memoryKey) || {
      panelId: null,
      history: [],
    };

    const effectivePanelId = panelId || previousSession.panelId || null;
    const context = effectivePanelId
      ? await loadPanelContext(userId, effectivePanelId)
      : null;

    const conversationHistory = trimHistory(previousSession.history)
      .map((entry) => `${entry.role.toUpperCase()}: ${entry.content}`)
      .join("\n");

    const systemPrompt = [
      "You are a context-aware solar panel operations assistant.",
      "Answer clearly, practically, and with panel-specific advice when panel context is provided.",
      "If no panel context is available, ask a focused follow-up question before guessing.",
      "Keep responses concise but useful for a field technician or operator.",
    ].join(" ");

    const userPrompt = [
      context
        ? `Panel Context:\n${context.contextText}`
        : "Panel Context: none selected.",
      conversationHistory
        ? `Conversation History:\n${conversationHistory}`
        : "Conversation History: none.",
      `User Question:\n${message}`,
      "Provide the answer in short sections when helpful, and reference the panel status, fault level, history, or maintenance suggestion directly.",
    ].join("\n\n");

    const answer = await callGroq({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      maxTokens: 1200,
    });

    const nextHistory = trimHistory([
      ...previousSession.history,
      { role: "user", content: String(message) },
      { role: "assistant", content: answer },
    ]);

    sessionMemory.set(memoryKey, {
      panelId: effectivePanelId,
      history: nextHistory,
      updatedAt: Date.now(),
    });

    return res.json({
      answer,
      sessionId: sessionId || memoryKey,
      panelId: effectivePanelId,
      context: context
        ? {
            panelId: context.panel.panel_id,
            panel: context.panel,
            inspections: context.inspections,
          }
        : null,
    });
  } catch (err) {
    console.error("AI chat error:", err);

    const statusCode = err.statusCode || 500;
    if (statusCode === 401) {
      return res.status(401).json({ message: "Invalid Groq API key" });
    }

    return res.status(statusCode).json({
      message: "Could not generate chat response",
    });
  }
};

exports.generateRepairPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { panelId, requestType } = req.body || {};

    if (!panelId) {
      return res.status(400).json({ message: "panelId is required" });
    }

    const context = await loadPanelContext(userId, panelId);

    if (!context) {
      return res.status(404).json({ message: "Panel not found" });
    }

    const prompt = [
      `Panel Context:\n${context.contextText}`,
      "Create a practical repair plan for a solar maintenance technician.",
      "Return the answer with the following sections exactly:",
      "1. Diagnosis Summary",
      "2. Likely Root Cause",
      "3. Step-by-Step Repair Plan",
      "4. Tools and Materials",
      "5. Safety Precautions",
      "6. Estimated Repair Time",
      "7. Preventive Maintenance Advice",
      requestType
        ? `Request Focus: ${requestType}`
        : "Request Focus: general repair planning",
      "Keep the response concise, field-ready, and specific to the panel fault level and inspection history.",
    ].join("\n\n");

    const plan = await callGroq({
      model: DIAGNOSIS_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an expert solar panel fault diagnosis and repair planning assistant.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.35,
      maxTokens: 1400,
    });

    return res.json({
      panelId,
      plan,
      context: {
        panelId: context.panel.panel_id,
        panel: context.panel,
        inspections: context.inspections,
      },
    });
  } catch (err) {
    console.error("AI repair plan error:", err);

    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      message: "Could not generate repair plan",
    });
  }
};
