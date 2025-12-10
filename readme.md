# README

This is a sample application to test the version `0.0.0-fix-10386-preserve-tool-calls-in-convert-aisdk-20251201210222` in regards to [PR 10736](https://github.com/mastra-ai/mastra/pull/10736)

### Problem Description:

It seems that when Mastra receives a list of OpenAI messages that include messages with `tool_calls` and `tool_call_id` fields, it does not preserve the tool calls in the converted messages.

Example messages payload sent to Mastra

```json
{
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "text": "Tell me about xyz",
          "type": "text"
        }
      ]
    },
    {
      "role": "assistant",
      "content": "",
      "tool_calls": [
        {
          "id": "call_ZgjQ5HRiLUttzf4NFeTWYJd5",
          "type": "function",
          "function": {
            "arguments": "{\"query\":\"xyz\"}",
            "name": "wikiSearchTool"
          }
        }
      ]
    },
    {
      "role": "tool",
      "content": "[{\"content\":\"No content was found\",\"page\":{\"title\":\"\",\"url\":\"https://example.com\"},\"space\":{\"name\":\"John Doe\",\"url\":\"https://example.com\"}}]",
      "tool_call_id": "call_ZgjQ5HRiLUttzf4NFeTWYJd5"
    }
  ]
}
```

Example of what above payload is converted to by Mastra and sent to the model:

```json
{
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Tell me about xyz"
        }
      ]
    },
    {
      "role": "assistant",
      "content": [
        {
          "type": "text",
          "text": ""
        }
      ]
    },
    {
      "role": "assistant",
      "content": [
        {
          "type": "text",
          "text": "[{\"content\":\"No content was found\",\"page\":{\"title\":\"\",\"url\":\"https://example.com\"},\"space\":{\"name\":\"John Doe\",\"url\":\"https://example.com\"}}]"
        }
      ]
    }
  ]
}
```

- Notice the `tool_calls` field is not preserved in the assistant message and instead an empty assistant message is sent.

- Notice the `tool_call_id` field is not preserved in the tool message and instead an assistant message is sent without the `tool_call_id` field.

---

### Steps to reproduce:

do `npm install --legacy-peer-deps` to install the dependencies with the patch applied. (see package.json `@mastra/core` version)

do `npm run dev` to start the application.

use the following curl command to test the application:

```bash
curl --location 'http://localhost:3000/v1/agent' \
--header 'Content-Type: application/json' \
--data '{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "user",
      "content": "How is weather in Amsterdam?"
    }
  ]
}'
```

From the response of the above curl command, look at the finish chunk (`"type": "finish"`) and see the path `payload.metadata.request.body.messages:[]`.
Expectation is to see the original messages are preserved in the shape that is expected by OpenAI without losing the `tool_calls` and `tool_call_id` fields with correct roles.

As of 10th of December:
When using the patched version `0.0.0-fix-10386-preserve-tool-calls-in-convert-aisdk-20251201210222`, the tool calls are failing due to multiple tool calls being made.
