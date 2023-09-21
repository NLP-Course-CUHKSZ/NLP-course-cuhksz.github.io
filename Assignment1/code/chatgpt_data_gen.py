import json
import requests
import jsonlines
from concurrent.futures import ThreadPoolExecutor
from tqdm import tqdm
import os


class GPT:
    def __init__(self, model_name="gpt-3.5-turbo", api_key=None):
        self.model_name = model_name
        self.api_key = api_key

    def request_bot(self, input_message=None, api_key=None, parameters={}):
        url = "http://43.153.20.180:8000/chatgpt"
        temp_message = [{"role": "user", "content": input_message}]
        parameters["model"] = "gpt-3.5-turbo"
        parameters["messages"] = temp_message

        headers = {"Content-Type": "application/json"}
        message = {"openai_key": api_key, "parameters": parameters}

        raw_response = requests.post(url, headers=headers, json=message)
        response = json.loads(raw_response.content.decode("utf-8"))

        try:
            flag = response["flag"]
            content = response["content"]
        except:
            content = (
                "Error:" + response["error"] + "status code:" + str(response["status"])
            )
            flag = False
        return flag, content

    def call(self, new_message=None, args=None):
        empty_string = ""
        if self.api_key is not None and self.api_key is not empty_string:
            if args is not None:
                for key in args.keys():
                    parameters = {}
                    parameters[key] = args[key]
            if new_message is not None and new_message is not empty_string:
                flag, response = self.request_bot(
                    input_message=new_message,
                    api_key=self.api_key,
                    parameters=parameters,
                )
            else:
                flag = False
                response = "Your input is empty."

        else:
            flag = False
            response = "API_KEY is None."
        return [flag, response]


# Example Usage
# gpt = GPT(api_key="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")
gpt = GPT(api_key="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")
gen_args = {"temperature": 0}


# 定义调用函数
def process_item(item):
    response = gpt.call(new_message=item["input"], args=gen_args)
    item["output"] = response[1]
    return item


def process_jsonl_concurrently(input_file, output_file, max_workers=10):
    processed_count = 0

    # 检查输出文件中已处理的项数
    if os.path.exists(output_file):
        with jsonlines.open(output_file, "r") as f:
            processed_count = sum(1 for _ in f)

    items_to_process = []
    with jsonlines.open(input_file, "r") as reader:
        for idx, item in enumerate(reader):
            if idx >= processed_count:
                items_to_process.append(item)

    with jsonlines.open(output_file, "a" if processed_count > 0 else "w") as writer:
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {
                executor.submit(process_item, item): item for item in items_to_process
            }

            # 使用 tqdm 显示进度
            for future in tqdm(
                futures, total=len(items_to_process), desc="Processing items"
            ):
                try:
                    writer.write(future.result())
                except Exception as e:
                    print(
                        f"Error processing item: {futures[future]['input']}. Error: {e}"
                    )


process_jsonl_concurrently(
    input_file="../data/chinese_essay_baseline.jsonl",
    output_file="../data/chinese_essaygpt_baseline.jsonl",
    max_workers=3,
)
