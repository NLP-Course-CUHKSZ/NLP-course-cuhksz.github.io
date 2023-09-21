# ASSIGNMENT 1: PROMPT ENGINEERING FOR ESSAY POLISHING

## Dependency
json jsonlines tqdm

## Pipeline

### Data
- /data/chinese_essay.json: 15 chinese essays
- /data/english_essay.json: 15 english essays

### Prepare data for GPT(Change prompt here)

Change the template(Prompt) in prepare_data.py
```
cd code
python prepare_data.py
```

### Generate data

Change the input_file and output_file
```
python chatgpt_data_gen.py
```

### Self-evaluate

Evaluate the essay by yourself, maybe try another better prompt.
Fish your [report](https://www.overleaf.com/read/mndnznyqtcxj) in overleaf.

## Reference resource

- https://www.promptingguide.ai/zh
- https://www.youtube.com/watch?v=dOxUroR57xs&ab_channel=ElvisSaravia
- https://github.com/dair-ai/Prompt-Engineering-Guide



