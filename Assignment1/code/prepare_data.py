import json

data = []
# 读取上传的JSON文件
with open("../data/english_essay.json", "r", encoding="utf-8") as file:
    data = json.load(file)
    
print(len(data))

# 根据要求转换
jsonl_data = []


for item in data:
    jsonl_data.append(
        {
            "input": f"Please modify the article to make its language more beautiful, logic clearer, structure more reasonable, and the center more prominent. Article:{item['pre_edit']} After modification:",
            "output": "",
        }
    )

# Baseline:
# Chinese: 请修改文章，使其语言更加优美，逻辑更加清晰，结构更加合理，中心更加突出。 文章: {} 修改后:
# English: Please modify the article to make its language more beautiful, logic clearer, structure more reasonable, and the center more prominent. Article:{} After modification:

# 将转换后的数据保存为JSONL文件
with open("../data/english_essay_baseline.jsonl", "w", encoding="utf-8") as file:
    for entry in jsonl_data:
        file.write(json.dumps(entry, ensure_ascii=False) + "\n")
