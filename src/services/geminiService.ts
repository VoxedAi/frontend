// API endpoint
const API_URL = "https://voxed.aidanandrews.org/api/v1/query";

// Import types from types directory
import { type Message, type MessageRole } from "../types/gemini";
import { MODELS, DEFAULT_MODEL, type Model } from "../types/models";
import { getToggledFiles } from "./userService";

/**
 * Streams a chat response from the Gemini model
 * @param history Array of previous messages
 * @param onStreamUpdate Callback for streaming updates
 * @param userId User ID for tracking
 * @param isCodingQuestion Whether this is a coding-related question
 * @param isNoteQuestion Whether this is a note-related question
 * @param noteToggledFiles Optional array of note file IDs to use when isNoteQuestion is true
 * @param noteContent Optional note content to include when a note is open
 * @param modelName Optional model name to use (defaults to NORMAL model)
 */
export async function streamChatWithGemini(
  history: Message[],
  onStreamUpdate: (content: string) => void,
  userId: string | null,
  isCodingQuestion: boolean = false,
  isNoteQuestion: boolean = false,
  noteToggledFiles?: string[],
  noteContent?: string,
  modelName: Model = DEFAULT_MODEL,
): Promise<void> {
  try {
    console.log("Starting chat with history length:", history.length);
    console.log("Using model:", modelName);

    // Validate history array
    if (!history || history.length === 0) {
      throw new Error("Chat history is empty. Cannot send message.");
    }

    // Get the last user message
    const lastMessage = history[history.length - 1];
    if (!lastMessage || !lastMessage.content) {
      throw new Error("Last message is missing or has no content.");
    }

    // Check if the message content is already in SSE format
    // This would indicate we're trying to send a previously streamed response as a message
    if (lastMessage.content.includes('data: {"type":')) {
      console.error(
        "Message appears to be in SSE format. This is likely an error.",
      );
      throw new Error(
        "Invalid message format. Cannot send an SSE response as a message.",
      );
    }

    // Extract the exact user query text
    const exactUserQuery = lastMessage.content;
    console.log("Exact user query:", exactUserQuery);
    let toggledFilesIds: string[] | null = null;
    let queryRequest: any = null;

    // If isNoteQuestion is true and noteToggledFiles is provided, use those files
    // Otherwise, get the toggled files from the user service
    if (isNoteQuestion && noteToggledFiles && noteToggledFiles.length > 0) {
      toggledFilesIds = noteToggledFiles;
      console.log("Using note toggled files:", toggledFilesIds);
    } else if (userId) {
      toggledFilesIds = await getToggledFiles(userId);
      console.log("Toggled files IDs:", toggledFilesIds);
    }

    // Prepare the base query request
    const baseQueryRequest = {
      query: exactUserQuery,
      top_k: 5,
      model_name: modelName, // Use the provided model name
      use_rag: true,
      stream: true,
      user_id: userId,
      is_coding_question: isCodingQuestion,
    };

    // Add noteContent to the request if provided
    if (noteContent) {
      console.log("Including note content in query:", noteContent.substring(0, 100) + (noteContent.length > 100 ? "..." : ""));
      // Create the queryRequest with noteContent
      const notePrompt = "\n\nThe user is currently writing a note alongside this query. Note that the query may be irrelevant to the note content in such case ignore the note content; otherwise use it to help answer the query. Note content: " + noteContent;
      baseQueryRequest.query += notePrompt;
      
      queryRequest = baseQueryRequest;
    } else {
      queryRequest = baseQueryRequest;
    }

    // Add filter for toggled files if available
    if (toggledFilesIds) {
      queryRequest = {
        ...queryRequest,
        filter: { "file_id": { "$in": toggledFilesIds } },
      };
    }

    console.log("Sending query request:", queryRequest);

    // Make the API request with fetch to support streaming
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(queryRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    // Check if the response is a stream
    if (!response.body) {
      throw new Error("Response body is not available");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let actualResponse = "";
    let streamedContent = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        streamedContent += chunk;

        // Parse SSE format to extract actual response content
        const updatedContent = parseStreamingResponse(streamedContent);

        // Send the parsed content to the UI
        actualResponse = updatedContent;
        onStreamUpdate(actualResponse);
      }

      // Final decode to catch any remaining bytes
      const finalChunk = decoder.decode();
      if (finalChunk) {
        streamedContent += finalChunk;
        const finalContent = parseStreamingResponse(streamedContent);
        actualResponse = finalContent;
        onStreamUpdate(actualResponse);
      }

      console.log("Stream completed successfully");
    } catch (streamError) {
      console.error("Error during stream processing:", streamError);
      // If we have a partial response, still return it
      if (actualResponse) {
        onStreamUpdate(actualResponse);
      } else {
        throw streamError;
      }
    }
  } catch (error) {
    console.error("Error streaming chat:", error);
    throw error;
  }
}

/**
 * Parses the streaming response to extract actual text content
 * @param streamData Raw streaming data in SSE format
 * @returns Extracted text content
 */
function parseStreamingResponse(streamData: string): string {
  let extractedText = "";

  try {
    // Split the stream data into lines
    const lines = streamData.split("\n");

    for (const line of lines) {
      // Skip empty lines
      if (!line.trim()) continue;

      // Check if line is a data line
      if (line.startsWith("data:")) {
        try {
          // Extract the JSON part
          const jsonStr = line.substring(5).trim();
          const data = JSON.parse(jsonStr);

          // If it's a token, add it to the extracted text
          if (data.type === "token" && data.data) {
            extractedText += data.data;
          }
        } catch {
          // If JSON parsing fails, just ignore this line
          console.warn("Failed to parse JSON in stream data line:", line);
        }
      }
    }

    // Trim the text first
    extractedText = extractedText.trim();

    // List of prefixes to check and remove
    const prefixesToRemove = [
      "Answer:",
      "Answer :",
      "AI:",
      "AI :",
      "Assistant:",
      "Assistant :",
    ];

    // Check for each prefix and remove if found
    for (const prefix of prefixesToRemove) {
      if (extractedText.startsWith(prefix)) {
        extractedText = extractedText.substring(prefix.length).trim();
        break; // Exit after removing the first matching prefix
      }
    }

    return extractedText;
  } catch (error) {
    console.error("Error parsing streaming response:", error);
    return extractedText || streamData; // Return what we have if parsing fails
  }
}

/**
 * Formats chat messages for API
 * @param messages Array of chat messages from the database
 * @returns Formatted history for API
 */
export function formatMessagesForGemini(
  messages: { is_user: boolean; content: string }[],
): Message[] {
  if (!messages || messages.length === 0) {
    return [];
  }

  return messages.map((message) => ({
    role: message.is_user ? ("user" as MessageRole) : ("model" as MessageRole),
    content: message.content || "",
  }));
}
