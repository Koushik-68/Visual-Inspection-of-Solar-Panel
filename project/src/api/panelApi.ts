import { Panel } from '../types/panel';

const API_BASE_URL = 'http://localhost:3000/api';

export const updatePanel = async (detectionData: {
  panelId: string;
  faults: string;
  level: string;
  image: string;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/update-panel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(detectionData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update panel');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating panel:', error);
    throw error;
  }
};
