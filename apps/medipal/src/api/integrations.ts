import { appClient } from './appClient';
import { executeAgentWorkflow, getIndiaAgentDeploymentProfile, listSpecialties } from './agentRouter';

export const Core = appClient.integrations.Core;
export const InvokeLLM = appClient.integrations.Core.InvokeLLM;
export const SendEmail = appClient.integrations.Core.SendEmail;
export const SendSMS = appClient.integrations.Core.SendSMS;
export const UploadFile = appClient.integrations.Core.UploadFile;
export const GenerateImage = appClient.integrations.Core.GenerateImage;
export const ExtractDataFromUploadedFile = appClient.integrations.Core.ExtractDataFromUploadedFile;

export const AgentRouter = {
  listSpecialties,
  getIndiaAgentDeploymentProfile,
  executeAgentWorkflow,
};
