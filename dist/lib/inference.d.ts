import { z } from "zod";
import { ActCommandParams, ActCommandResult } from "../types/act";
import { VerifyActCompletionParams } from "../types/inference";
import { LogLine } from "../types/log";
import { LLMClient } from "./llm/LLMClient";
export declare function verifyActCompletion({ goal, steps, llmClient, screenshot, domElements, logger, requestId, }: VerifyActCompletionParams): Promise<boolean>;
export declare function fillInVariables(text: string, variables: Record<string, string>): string;
export declare function act({ action, domElements, steps, llmClient, screenshot, retries, logger, requestId, variables, userProvidedInstructions, }: ActCommandParams): Promise<ActCommandResult | null>;
export declare function extract({ instruction, previouslyExtractedContent, domElements, schema, llmClient, chunksSeen, chunksTotal, requestId, logger, isUsingTextExtract, userProvidedInstructions, }: {
    instruction: string;
    previouslyExtractedContent: object;
    domElements: string;
    schema: z.ZodObject<z.ZodRawShape>;
    llmClient: LLMClient;
    chunksSeen: number;
    chunksTotal: number;
    requestId: string;
    isUsingTextExtract?: boolean;
    userProvidedInstructions?: string;
    logger: (message: LogLine) => void;
}): Promise<{
    metadata: {
        progress?: string;
        completed?: boolean;
    };
}>;
export declare function observe({ instruction, domElements, llmClient, image, requestId, isUsingAccessibilityTree, userProvidedInstructions, logger, }: {
    instruction: string;
    domElements: string;
    llmClient: LLMClient;
    image?: Buffer;
    requestId: string;
    userProvidedInstructions?: string;
    logger: (message: LogLine) => void;
    isUsingAccessibilityTree?: boolean;
}): Promise<{
    elements: {
        elementId: number;
        description: string;
    }[];
}>;
