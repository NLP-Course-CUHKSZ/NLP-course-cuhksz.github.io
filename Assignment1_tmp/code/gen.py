import openai

OPENAI_API_KEY =  ""
openai.api_key =  OPENAI_API_KEY
openai.api_base =  "https://openai.huatuogpt.cn/v1"
chat_completion = openai.ChatCompletion.create(model="gpt-3.5-turbo", messages=[{"role": "user", "content": "Hello world"}])
print(chat_completion)
