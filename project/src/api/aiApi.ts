import axiosInstance from "../axios/axiosInstance";

export interface PanelContextResponse {
  panelId: string;
  panel: Record<string, unknown>;
  inspections: Array<Record<string, unknown>>;
  contextText: string;
}

export interface ChatResponse {
  answer: string;
  sessionId: string;
  panelId: string | null;
  context: PanelContextResponse | null;
}

export interface RepairPlanResponse {
  panelId: string;
  plan: string;
  context: PanelContextResponse | null;
}

export const getPanelContext = async (panelId: string) => {
  const response = await axiosInstance.get<PanelContextResponse>(
    `/api/ai/panels/${panelId}/context`,
  );

  return response.data;
};

export const sendChatMessage = async (payload: {
  message: string;
  panelId?: string;
  sessionId?: string;
}) => {
  const response = await axiosInstance.post<ChatResponse>(
    "/api/ai/chat",
    payload,
  );

  return response.data;
};

export const generateRepairPlan = async (payload: {
  panelId: string;
  requestType?: string;
}) => {
  const response = await axiosInstance.post<RepairPlanResponse>(
    "/api/ai/diagnosis-plan",
    payload,
  );

  return response.data;
};
