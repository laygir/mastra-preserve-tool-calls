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

`npm install` to install the dependencies.

`npm run dev` to start the application.

use the following curl command to test the application:

```bash
curl --location 'http://localhost:3000/v1/agent' \
--header 'Content-Type: application/json' \
--data '{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "system",
      "content": "\n      You are a helpful weather assistant that provides accurate weather information and can help planning activities based on the weather.\n\n      Your primary function is to help users get weather details for specific locations. When responding:\n      - Always ask for a location if none is provided\n      - If the location name isn'\''t in English, please translate it\n      - If giving a location with multiple parts (e.g. \"New York, NY\"), use the most relevant part (e.g. \"New York\")\n      - Include relevant details like humidity, wind conditions, and precipitation\n      - Keep responses concise but informative\n      - If the user asks for activities and provides the weather forecast, suggest activities based on the weather forecast.\n      - If the user asks for activities, respond in the format they request.\n\n      Use the weatherTool to fetch current weather data.\n"
    },
    {
      "role": "user",
      "content": "hey"
    },
    {
      "role": "assistant",
      "content": "Hello! How can I assist you today? If you need weather information, please provide a location."
    },
    {
      "role": "user",
      "content": "What is the weather in Amsterdam?"
    },
    {
      "role": "assistant",
      "content": "",
      "tool_calls": [
        {
          "id": "call_HAkmnRCIre64j9wKbLmiclLg",
          "type": "function",
          "function": {
            "name": "weatherTool",
            "arguments": "{\"location\":\"Amsterdam\"}"
          }
        }
      ]
    },
    {
      "role": "tool",
      "tool_call_id": "call_HAkmnRCIre64j9wKbLmiclLg",
      "content": "{\"conditions\":\"Overcast\",\"feelsLike\":8.2,\"humidity\":90,\"location\":\"Amsterdam\",\"temperature\":10,\"windGust\":20.2,\"windSpeed\":9.4}"
    },
    {
      "role": "assistant",
      "content": "The current weather in Amsterdam is as follows:\n\n- **Temperature:** 10°C\n- **Feels Like:** 8.2°C\n- **Conditions:** Overcast\n- **Humidity:** 90%\n- **Wind Speed:** 9.4 km/h\n- **Wind Gusts:** 20.2 km/h\n\nIf you need any more information or have specific activities in mind, let me know!"
    },
    {
      "role": "user",
      "content": "What is the weather in London?"
    },
    {
      "role": "assistant",
      "content": "",
      "tool_calls": [
        {
          "id": "call_c14t2kROAF6gy31u2mqQXggq",
          "type": "function",
          "function": {
            "name": "weatherTool",
            "arguments": "{\"location\":\"London\"}"
          }
        }
      ]
    },
    {
      "role": "tool",
      "tool_call_id": "call_c14t2kROAF6gy31u2mqQXggq",
      "content": "{\"conditions\":\"Overcast\",\"feelsLike\":8.5,\"humidity\":84,\"location\":\"London\",\"temperature\":10.7,\"windGust\":24.5,\"windSpeed\":12}"
    },
    {
      "role": "assistant",
      "content": "The current weather in London is as follows:,,Temperature: 10.7°C,Feels Like: 8.5°C,Conditions: Overcast,Humidity: 84%,Wind Speed: 12 km/h,Wind Gusts: 24.5 km/h,If you have any specific activities in mind or need more information, feel free to ask!"
    },
    {
      "role": "user",
      "content": "What is the weather in New York?"
    }
  ]
}'
```

From the response of the above curl command, look at the finish chunk (`"type": "finish"`) and see the path `payload.metadata.request.body.messages:[]`.
Expectation is to see the original messages are preserved in the shape that is expected by OpenAI without losing the `tool_calls` and `tool_call_id` fields with correct roles.

See below the partial finish chunk (`payload.metadata.request.body`) and notice earlier messages with `"role": "tool"` and `"role": "assistant"` + `tool_calls` are missing.

```
{
  "body": {
    "model": "gpt-4o-mini",
    "messages": [
      {
        "role": "system",
        "content": "\n      You are a helpful weather assistant that provides accurate weather information and can help planning activities based on the weather.\n\n      Your primary function is to help users get weather details for specific locations. When responding:\n      - Always ask for a location if none is provided\n      - If the location name isn't in English, please translate it\n      - If giving a location with multiple parts (e.g. \"New York, NY\"), use the most relevant part (e.g. \"New York\")\n      - Include relevant details like humidity, wind conditions, and precipitation\n      - Keep responses concise but informative\n      - If the user asks for activities and provides the weather forecast, suggest activities based on the weather forecast.\n      - If the user asks for activities, respond in the format they request.\n\n      Use the weatherTool to fetch current weather data.\n"
      },
      {
        "role": "user",
        "content": "hey"
      },
      {
        "role": "assistant",
        "content": "Hello! How can I assist you today? If you need weather information, please provide a location."
      },
      {
        "role": "user",
        "content": "What is the weather in Amsterdam?"
      },
      {
        "role": "assistant",
        "content": "{\"conditions\":\"Overcast\",\"feelsLike\":8.2,\"humidity\":90,\"location\":\"Amsterdam\",\"temperature\":10,\"windGust\":20.2,\"windSpeed\":9.4}The current weather in Amsterdam is as follows:\n\n- **Temperature:** 10°C\n- **Feels Like:** 8.2°C\n- **Conditions:** Overcast\n- **Humidity:** 90%\n- **Wind Speed:** 9.4 km/h\n- **Wind Gusts:** 20.2 km/h\n\nIf you need any more information or have specific activities in mind, let me know!"
      },
      {
        "role": "user",
        "content": "What is the weather in London?"
      },
      {
        "role": "assistant",
        "content": "{\"conditions\":\"Overcast\",\"feelsLike\":8.5,\"humidity\":84,\"location\":\"London\",\"temperature\":10.7,\"windGust\":24.5,\"windSpeed\":12}The current weather in London is as follows:,,Temperature: 10.7°C,Feels Like: 8.5°C,Conditions: Overcast,Humidity: 84%,Wind Speed: 12 km/h,Wind Gusts: 24.5 km/h,If you have any specific activities in mind or need more information, feel free to ask!"
      },
      {
        "role": "user",
        "content": "What is the weather in New York?"
      },
      {
        "role": "assistant",
        "content": "",
        "tool_calls": [
          {
            "id": "call_YvmlI3lIcpAn8z4nILyzY9eE",
            "type": "function",
            "function": {
              "name": "weatherTool",
              "arguments": "{\"location\":\"New York\"}"
            }
          }
        ]
      },
      {
        "role": "tool",
        "tool_call_id": "call_YvmlI3lIcpAn8z4nILyzY9eE",
        "content": "{\"conditions\":\"Mainly clear\",\"feelsLike\":-4.4,\"humidity\":83,\"location\":\"New York\",\"temperature\":-0.9,\"windGust\":16.2,\"windSpeed\":6.1}"
      }
    ]
  }
}
```
