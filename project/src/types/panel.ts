export interface Panel {
  id: string;
  currentFault?: {
    description: string;
    level: string;
  };
  image?: string;
  // Add other panel properties as needed
}
