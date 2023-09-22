import requests
import json

from requests.packages.urllib3.exceptions import InsecureRequestWarning

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
# from gpt import GPT

class GPT35:
    def __init__(self,api_key,organization = None) -> None:
        self.api_key = api_key
        self.organization = organization

    def call(self, content, args = {}):
        # url = "https://api.openai.com/v1/chat/completions"
        url = "https://43.153.20.180/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
            "OpenAI-Organization": self.organization,
        }
        parameters = {
            "model": 'gpt-3.5-turbo',
            "messages": [{'role': 'user', 'content': content}],
            **args,
        }
        response = requests.post(
            url,
            headers=headers,
            json=parameters,
            verify=False
        )
        response = json.loads(response.content.decode("utf-8"))
        if 'error' in response:
            assert False, str(response)
        # print(response)
        return response['choices'][0]['message']['content']
    
    
if __name__=="__main__":
    gpt=GPT35('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')
    response=gpt.call('hello')
    print(response)