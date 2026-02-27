const BOT_NAME = "HealthyLifeAI";

const DEFAULT_SCENARIOS = [
  {
    id: "collaborator",
    title: "Collaborator",
    description:
      "Collaborator role framing for sleep support.",
    roleFraming: "collaborator",
    disclosureCondition: "no-self-disclosure",
    opening:
      "Hi, I am HealthyLifeAI, your sleep support collaborator. We will work side by side to understand your sleep symptoms, timing, and severity, and co-create a practical plan that fits your life. I will contribute evidence-based insights, and you will contribute your lived experience so we can identify patterns and decide together what adjustments make the most sense. As we move forward, we will regularly reflect on what is working, refine strategies jointly, and adapt the plan based on your feedback and preferences. All conversations with HealthyLifeAI will be kept confidential and not shared with anyone else. Can you describe your symptoms related to sleep difficulties?",
    effortsQuestion:
      "Could you share any efforts you have already made to improve your sleep quality?",
    disclosureQuestion:
      "Could you share any concerns you have these days besides the sleeping issue, such as relationship, career, or other personal matters? Also, please let me know if you are drinking or smoking heavily these days.",
  },
  {
    id: "expert",
    title: "Expert",
    description:
      "Expert role framing for sleep support.",
    roleFraming: "expert",
    disclosureCondition: "no-self-disclosure",
    opening:
      "Hi, I am HealthyLifeAI, your sleep advisor. Based on the sleep symptoms, timing, and severity you describe, I will analyze patterns and provide evidence-based recommendations to guide your sleep management. I will synthesize the information and outline a structured, data-driven plan designed to address underlying issues. You can rely on my expertise to identify effective strategies, and I will explain the reasoning behind each recommendation so you can make informed decisions with confidence. All conversations with HealthyLifeAI will be kept confidential and not shared with anyone else. Can you describe your symptoms related to sleep difficulties?",
    effortsQuestion:
      "Could you share any efforts you have already made to improve your sleep quality?",
    disclosureQuestion:
      "Could you share any concerns you have these days besides the sleeping issue, such as relationship, career, or other personal matters? Also, please let me know if you are drinking or smoking heavily these days.",
  },
];

const CLOSING_LINE =
  "How do you think about the solution? Would you like to add this suggestion to your sleep management plan?";
const FINAL_LOCK_MESSAGE = "Thank you for sharing. Now please move to the next page.";

const BASE_EXPERIMENT_RULES = [
  "Topic is sleep issues only.",
  "Keep emotional tone constant across all conditions: warm, calm, and non-judgmental.",
  "Keep response quality and factual rigor constant across all conditions.",
  "Keep anthropomorphism level constant across all conditions.",
  "Do not diagnose. If severe or persistent symptoms are reported, suggest professional support.",
  "Keep language concise and practical.",
  "Do not mention condition assignment, experiment manipulation, or role framing labels.",
];

const STORAGE_KEY = "scenario-chatbot-hybrid-study1-state";
const SESSION_CONDITION_KEY = "study1_condition";

const state = {
  scenarios: clone(DEFAULT_SCENARIOS),
  activeScenarioId: DEFAULT_SCENARIOS[0].id,
  transcript: [],
  backend: {
    apiBaseUrl: "https://chatbot-marketing-experiment-study1.onrender.com",
    model: "gpt-5-mini",
  },
  flow: {
    stage: "awaiting_symptoms",
    symptomMessage: "",
    effortsMessage: "",
    disclosureMessage: "",
    finalResponseGenerated: false,
  },
  isSending: false,
  conversationLocked: false,
  forcedScenarioId: null,
  conditionSource: "manual",
};

const elements = {
  layout: document.querySelector(".layout"),
  controlsPanel: document.querySelector(".controls"),
  scenarioSelect: document.getElementById("scenarioSelect"),
  scenarioEditor: document.getElementById("scenarioEditor"),
  applyScenariosBtn: document.getElementById("applyScenariosBtn"),
  restoreDefaultsBtn: document.getElementById("restoreDefaultsBtn"),
  resetChatBtn: document.getElementById("resetChatBtn"),
  exportBtn: document.getElementById("exportBtn"),
  saveBackendBtn: document.getElementById("saveBackendBtn"),
  apiBaseUrl: document.getElementById("apiBaseUrl"),
  modelInput: document.getElementById("modelInput"),
  status: document.getElementById("status"),
  activeScenarioTitle: document.getElementById("activeScenarioTitle"),
  activeScenarioDescription: document.getElementById("activeScenarioDescription"),
  chatLog: document.getElementById("chatLog"),
  chatForm: document.getElementById("chatForm"),
  userInput: document.getElementById("userInput"),
  scenarioLabel: document.querySelector('label[for="scenarioSelect"]'),
  backendSection: document.getElementById("apiBaseUrl")?.closest(".editor-section"),
  scenarioEditorSection: document.getElementById("scenarioEditor")?.closest(".editor-section"),
  resetExportRow: document.getElementById("resetChatBtn")?.closest(".row"),
};

let thinkingIndicator = null;

init();

function init() {
  hydrateStateFromStorage();
  applyUrlConditionLock();
  renderScenarioOptions();
  syncEditor();
  syncBackendInputs();
  updateScenarioHeader();
  applyParticipantBlinding();
  resetChatWithOpening();
  wireEvents();
}

function wireEvents() {
  elements.scenarioSelect.addEventListener("change", (event) => {
    if (state.forcedScenarioId) {
      elements.scenarioSelect.value = state.forcedScenarioId;
      setStatus("Condition is locked by URL parameter.", "ok");
      return;
    }
    state.activeScenarioId = event.target.value;
    state.conditionSource = "manual";
    persistState();
    updateScenarioHeader();
    resetChatWithOpening();
    setStatus("Condition switched.", "ok");
  });

  elements.applyScenariosBtn.addEventListener("click", () => {
    try {
      const parsed = JSON.parse(elements.scenarioEditor.value);
      validateScenarioList(parsed);
      state.scenarios = parsed;
      state.activeScenarioId = parsed[0].id;
      applyUrlConditionLock();
      renderScenarioOptions();
      updateScenarioHeader();
      resetChatWithOpening();
      persistState();
      setStatus("Conditions applied successfully.", "ok");
    } catch (error) {
      setStatus(error.message, "error");
    }
  });

  elements.restoreDefaultsBtn.addEventListener("click", () => {
    state.scenarios = clone(DEFAULT_SCENARIOS);
    state.activeScenarioId = state.scenarios[0].id;
    applyUrlConditionLock();
    renderScenarioOptions();
    syncEditor();
    updateScenarioHeader();
    resetChatWithOpening();
    persistState();
    setStatus("Default conditions restored.", "ok");
  });

  elements.saveBackendBtn.addEventListener("click", () => {
    const apiBaseUrl = elements.apiBaseUrl.value.trim();
    const model = elements.modelInput.value.trim();
    if (!apiBaseUrl) {
      setStatus("Proxy URL is required.", "error");
      return;
    }
    if (!model) {
      setStatus("Model is required.", "error");
      return;
    }
    state.backend.apiBaseUrl = apiBaseUrl;
    state.backend.model = model;
    persistState();
    setStatus("Backend settings saved.", "ok");
  });

  elements.resetChatBtn.addEventListener("click", () => {
    resetChatWithOpening();
    setStatus("Chat reset.", "ok");
  });

  elements.exportBtn.addEventListener("click", exportTranscript);

  elements.chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.isSending || state.conversationLocked) {
      return;
    }
    const text = elements.userInput.value.trim();
    if (!text) {
      return;
    }
    appendMessage("user", text);
    elements.userInput.value = "";
    await handleParticipantTurn(text);
  });
}

async function handleParticipantTurn(userText) {
  if (state.conversationLocked) {
    return;
  }

  const scenario = getActiveScenario();

  if (state.flow.stage === "awaiting_symptoms") {
    state.flow.symptomMessage = userText;
    state.flow.stage = "awaiting_efforts";
    appendMessage("bot", scenario.effortsQuestion);
    return;
  }

  if (state.flow.stage === "awaiting_efforts") {
    state.flow.effortsMessage = userText;
    if (scenario.disclosureCondition === "self-disclosure") {
      state.flow.stage = "awaiting_disclosure";
      appendMessage("bot", scenario.disclosureQuestion);
      return;
    }
    state.flow.stage = "generating_final";
    await generateFinalResponse();
    return;
  }

  if (state.flow.stage === "awaiting_disclosure") {
    state.flow.disclosureMessage = userText;
    state.flow.stage = "generating_final";
    await generateFinalResponse();
    return;
  }

  if (state.flow.finalResponseGenerated) {
    return;
  }
}

function hydrateStateFromStorage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return;
  }

  try {
    const parsed = JSON.parse(stored);
    if (parsed.backend && typeof parsed.backend === "object") {
      if (typeof parsed.backend.apiBaseUrl === "string" && parsed.backend.apiBaseUrl.trim()) {
        state.backend.apiBaseUrl = parsed.backend.apiBaseUrl;
      }
      if (typeof parsed.backend.model === "string" && parsed.backend.model.trim()) {
        state.backend.model = parsed.backend.model;
      }
    }
    if (Array.isArray(parsed.scenarios)) {
      validateScenarioList(parsed.scenarios);
      state.scenarios = parsed.scenarios;
      const hasScenario = state.scenarios.some((x) => x.id === parsed.activeScenarioId);
      state.activeScenarioId = hasScenario ? parsed.activeScenarioId : state.scenarios[0].id;
    }
  } catch {
    state.scenarios = clone(DEFAULT_SCENARIOS);
    state.activeScenarioId = state.scenarios[0].id;
  }
}

function persistState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      scenarios: state.scenarios,
      activeScenarioId: state.activeScenarioId,
      backend: state.backend,
    })
  );
  syncEditor();
}

function syncBackendInputs() {
  elements.apiBaseUrl.value = state.backend.apiBaseUrl;
  elements.modelInput.value = state.backend.model;
}

function renderScenarioOptions() {
  elements.scenarioSelect.innerHTML = "";
  for (const scenario of state.scenarios) {
    const opt = document.createElement("option");
    opt.value = scenario.id;
    opt.textContent = scenario.title;
    elements.scenarioSelect.append(opt);
  }
  elements.scenarioSelect.value = state.activeScenarioId;
  elements.scenarioSelect.disabled = Boolean(state.forcedScenarioId);
  elements.scenarioSelect.title = state.forcedScenarioId
    ? "Condition locked by URL parameter"
    : "";
}

function syncEditor() {
  elements.scenarioEditor.value = JSON.stringify(state.scenarios, null, 2);
}

function updateScenarioHeader() {
  const active = getActiveScenario();
  if (isParticipantBlinded()) {
    elements.activeScenarioTitle.textContent = "HealthyLifeAI Sleep Management";
    elements.activeScenarioDescription.textContent = "Please describe your sleep issue.";
    return;
  }
  elements.activeScenarioTitle.textContent = active.title;
  elements.activeScenarioDescription.textContent = active.description;
}

function resetChatWithOpening() {
  hideThinkingIndicator();
  state.transcript = [];
  state.conversationLocked = false;
  state.flow = {
    stage: "awaiting_symptoms",
    symptomMessage: "",
    effortsMessage: "",
    disclosureMessage: "",
    finalResponseGenerated: false,
  };
  elements.chatLog.innerHTML = "";
  const opening = getActiveScenario().opening || "Condition started.";
  appendMessage("bot", opening);
  applyComposerState();
}

function appendMessage(role, text) {
  const entry = {
    role,
    text,
    at: new Date().toISOString(),
    scenarioId: state.activeScenarioId,
    stage: state.flow.stage,
  };
  state.transcript.push(entry);

  const bubble = document.createElement("article");
  bubble.className = `msg ${role}`;
  const roleLabel = role === "user" ? "Participant" : BOT_NAME;
  bubble.innerHTML = `<span class="meta">${roleLabel}</span>${escapeHtml(text)}`;
  elements.chatLog.append(bubble);
  elements.chatLog.scrollTop = elements.chatLog.scrollHeight;
}

async function generateFinalResponse() {
  const scenario = getActiveScenario();
  const apiUrl = `${state.backend.apiBaseUrl.replace(/\/$/, "")}/chat`;

  try {
    setSending(true);
    showThinkingIndicator();
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: state.backend.model,
        systemPrompt: buildFinalSystemPrompt(scenario),
        messages: [
          {
            role: "user",
            content: buildFinalUserPrompt(scenario),
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Backend error (${response.status}): ${text || "No response body"}`);
    }

    const payload = await response.json();
    if (!payload || typeof payload.outputText !== "string" || !payload.outputText.trim()) {
      throw new Error("Backend returned an empty reply.");
    }

    const combined = `${payload.outputText.trim()}\n\n${CLOSING_LINE}\n\n${FINAL_LOCK_MESSAGE}`;
    appendMessage("bot", combined);
    state.flow.stage = "completed";
    state.flow.finalResponseGenerated = true;
    lockConversation();
    postTranscriptToParent("conversation_completed");
    setStatus("Final recommendation generated.", "ok");
  } catch (error) {
    appendMessage(
      "bot",
      "I could not reach the LLM backend. Please confirm the local proxy server is running and OPENAI_API_KEY has available quota."
    );
    state.flow.stage = "completed";
    setStatus(error.message, "error");
  } finally {
    hideThinkingIndicator();
    setSending(false);
  }
}

function buildFinalSystemPrompt(scenario) {
  const roleFramingInstruction =
    scenario.roleFraming === "collaborator"
      ? "Role framing: collaborator. Use collaborative wording such as 'we can work together'."
      : "Role framing: expert. Use expert framing with confident professional guidance while keeping tone warm and non-judgmental.";

  const disclosureInstruction =
    scenario.disclosureCondition === "self-disclosure"
      ? "Disclosure condition: incorporate the user's optional personal context if provided, without changing tone or structure."
      : "Disclosure condition: focus only on sleep symptoms and behavior details; do not request extra personal context.";

  const constantRules = BASE_EXPERIMENT_RULES.map((x) => `- ${x}`).join("\n");

  return [
    `You are ${BOT_NAME}.`,
    "Generate one final response only for this conversation stage.",
    roleFramingInstruction,
    disclosureInstruction,
    "Constant constraints across all conditions:",
    constantRules,
    "Output format rules:",
    "1) One short empathy sentence.",
    "2) One short evidence-aligned explanation sentence.",
    "3) Exactly two practical sleep suggestions as numbered items.",
    "Keep the full response under 120 words.",
    "Do not include a closing question; that is added separately by the app.",
  ].join("\n");
}

function buildFinalUserPrompt(scenario) {
  const disclosureText =
    scenario.disclosureCondition === "self-disclosure"
      ? state.flow.disclosureMessage || "[No disclosure provided]"
      : "[Not applicable in this condition]";

  return [
    "Participant data for final recommendation:",
    `- Sleep symptom description: ${state.flow.symptomMessage}`,
    `- Efforts already made: ${state.flow.effortsMessage}`,
    `- Additional personal context: ${disclosureText}`,
    "Provide a concise response matching the required output format and word limit.",
  ].join("\n");
}

function isParticipantBlinded() {
  return Boolean(state.forcedScenarioId);
}

function applyParticipantBlinding() {
  const blinded = isParticipantBlinded();

  if (elements.controlsPanel) {
    elements.controlsPanel.style.display = blinded ? "none" : "";
  }
  if (elements.layout) {
    elements.layout.style.gridTemplateColumns = blinded ? "1fr" : "";
  }

  if (elements.scenarioLabel) {
    elements.scenarioLabel.style.display = blinded ? "none" : "";
  }
  if (elements.scenarioSelect) {
    elements.scenarioSelect.style.display = blinded ? "none" : "";
  }
  if (elements.resetExportRow) {
    elements.resetExportRow.style.display = blinded ? "none" : "";
  }
  if (elements.backendSection) {
    elements.backendSection.style.display = blinded ? "none" : "";
  }
  if (elements.scenarioEditorSection) {
    elements.scenarioEditorSection.style.display = blinded ? "none" : "";
  }
  if (elements.status) {
    elements.status.style.display = blinded ? "none" : "";
  }
}

function getRequestedConditionIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("condition");
  if (!raw) {
    return null;
  }
  return raw.trim();
}

function getRequestedConditionIdFromSession() {
  const raw = sessionStorage.getItem(SESSION_CONDITION_KEY);
  if (!raw) {
    return null;
  }
  return raw.trim();
}

function applyUrlConditionLock() {
  const fromUrl = getRequestedConditionIdFromUrl();
  const fromSession = getRequestedConditionIdFromSession();
  const requestedId = fromUrl || fromSession;

  if (!requestedId) {
    state.forcedScenarioId = null;
    state.conditionSource = "manual";
    return;
  }

  const match = state.scenarios.find((x) => x.id === requestedId);
  if (!match) {
    state.forcedScenarioId = null;
    state.conditionSource = "manual";
    if (fromUrl) {
      setStatus(`Invalid condition in URL: ${requestedId}`, "error");
    }
    return;
  }

  state.forcedScenarioId = requestedId;
  state.activeScenarioId = requestedId;
  state.conditionSource = fromUrl ? "url" : "session";
}

function validateScenarioList(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Scenario JSON must be a non-empty array.");
  }
  for (let i = 0; i < value.length; i += 1) {
    const scenario = value[i];
    const path = `Scenario index ${i}`;
    if (!scenario || typeof scenario !== "object") {
      throw new Error(`${path} must be an object.`);
    }
    for (const key of [
      "id",
      "title",
      "description",
      "opening",
      "effortsQuestion",
      "disclosureQuestion",
      "roleFraming",
      "disclosureCondition",
    ]) {
      if (typeof scenario[key] !== "string" || !scenario[key].trim()) {
        throw new Error(`${path} requires non-empty string \"${key}\".`);
      }
    }
    if (!["collaborator", "expert"].includes(scenario.roleFraming)) {
      throw new Error(`${path} \"roleFraming\" must be collaborator or expert.`);
    }
    if (!["self-disclosure", "no-self-disclosure"].includes(scenario.disclosureCondition)) {
      throw new Error(
        `${path} \"disclosureCondition\" must be self-disclosure or no-self-disclosure.`
      );
    }
  }

  const unique = new Set(value.map((x) => x.id));
  if (unique.size !== value.length) {
    throw new Error("Scenario ids must be unique.");
  }
}

function exportTranscript() {
  const payload = buildTranscriptPayload();
  const scenario = getActiveScenario();
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `transcript-${scenario.id}-${new Date().toISOString()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  setStatus("Transcript exported.", "ok");
}

function setSending(sending) {
  state.isSending = sending;
  applyComposerState();
}

function lockConversation() {
  state.conversationLocked = true;
  applyComposerState();
}

function applyComposerState() {
  const disabled = state.isSending || state.conversationLocked;
  elements.userInput.disabled = disabled;
  elements.chatForm.querySelector("button[type='submit']").disabled = disabled;
}

function buildTranscriptPayload() {
  const scenario = getActiveScenario();
  return {
    exportedAt: new Date().toISOString(),
    botName: BOT_NAME,
    scenarioId: state.activeScenarioId,
    scenarioTitle: scenario.title,
    roleFraming: scenario.roleFraming,
    disclosureCondition: scenario.disclosureCondition,
    flow: state.flow,
    model: state.backend.model,
    conditionSource: state.conditionSource,
    forcedScenarioId: state.forcedScenarioId,
    messages: state.transcript,
  };
}

function postTranscriptToParent(eventType) {
  if (window.parent === window) {
    return;
  }
  const payload = {
    type: "study1_chatbot_event",
    eventType,
    data: buildTranscriptPayload(),
  };
  try {
    window.parent.postMessage(payload, "*");
  } catch {
    // Ignore postMessage failures so chat completion isn't blocked.
  }
}

function setStatus(message, kind) {
  elements.status.textContent = message;
  elements.status.className = kind || "";
}

function getActiveScenario() {
  return state.scenarios.find((x) => x.id === state.activeScenarioId) || state.scenarios[0];
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function escapeHtml(input) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function showThinkingIndicator() {
  if (thinkingIndicator) {
    return;
  }
  const bubble = document.createElement("article");
  bubble.className = "msg bot";
  bubble.innerHTML = `<span class="meta">${BOT_NAME}</span>${BOT_NAME} is thinking...`;
  elements.chatLog.append(bubble);
  elements.chatLog.scrollTop = elements.chatLog.scrollHeight;
  thinkingIndicator = bubble;
}

function hideThinkingIndicator() {
  if (!thinkingIndicator) {
    return;
  }
  thinkingIndicator.remove();
  thinkingIndicator = null;
}
