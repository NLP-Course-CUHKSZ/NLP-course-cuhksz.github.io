import openai

OPENAI_API_KEY =  "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"
openai.api_key =  OPENAI_API_KEY
openai.api_base =  "https://openai.huatuogpt.cn/v1"
response = openai.ChatCompletion.create(
  model="gpt-3.5-turbo",
  messages=[
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Tell me a fun fact."},
    {"role": "assistant", "content": "Sure, here is an interesting fact:"}
  ],
  temperature=0.6,
  max_tokens=30,
  top_p=0.8,
  frequency_penalty=0.6,
  presence_penalty=0.8,
  n=3
)
print(response)
