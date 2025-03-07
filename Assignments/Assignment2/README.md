# LLM Assignment Repository

This repository contains assignments related to Large Language Models (LLMs), focusing on prompt engineering, retrieval-augmented generation, and agent development.

## Repository Structure

```
.
├── task1/                    # Medical exam question answering task
│   ├── data/                 # Contains medical exam questions
│   ├── 1.prepare_data.py     # Script to prepare data for LLM processing
│   ├── 2.run_gpt_datagen_multithread.sh # Script to generate answers using LangChain
│   └── 3.scorer.py           # Script to evaluate the model's performance
│
├── task2/                    # RLHF preference prediction task
│   ├── data/                 # Contains RLHF preference pairs
│   ├── 1.prepare_data.py     # Script to prepare data for LLM processing
│   ├── 2.run_gpt_datagen_multithread.sh # Script to generate predictions using LangChain
│   └── 3.scorer.py           # Script to evaluate the model's performance
│
├── langchain/                # LangChain implementation examples
│   ├── data/                 # Contains medical knowledge base
│   ├── faiss_index/          # Vector database for retrieval
│   ├── agent_get_start.py    # Agent implementation with tool calling
│   ├── langchain_get_start.py # Basic LangChain setup
│   ├── prepare_retrieval_data.py # Script for building retrieval system
│   └── tavily.py             # Example of using Tavily search API
│
└── langchain_datagen_multithread.py # LangChain-based data generation script
```

## Task 1: Medical Exam Question Answering

This task focuses on answering medical exam questions using prompt engineering techniques.

### Data
- 100 questions from the 2021 National Pharmacist Professional Qualification Examination
- Located in `task1/data/1.exam.json`

### Dependencies
```
pip install langchain langchain_openai langchain_core tqdm jsonlines
```

### Running Steps
1. Place your OpenAI API key in a file named `gpt3keys.txt` in the repository root
2. Run data preparation: `cd task1 && bash 1.run_prepare_data.sh`
3. Generate answers: `bash 2.run_gpt_datagen_multithread.sh`
4. Evaluate performance: `bash 3.scorer.sh`

### Customization Options
- Modify user prompts in the data preparation step
- Adjust system prompts in the generation step
- Implement multi-turn dialogue strategies
- Optimize answer extraction methods

## Task 2: RLHF Preference Prediction

This task involves predicting human preferences between pairs of AI responses.

### Data
- 100 answer pairs sampled from the Anthropic RLHF dataset
- Located in `task2/data/1.rlhf.json`

### Dependencies
```
pip install langchain langchain_openai langchain_core tqdm jsonlines
```

### Running Steps
1. Place your OpenAI API key in a file named `gpt3keys.txt` in the repository root
2. Run data preparation: `cd task2 && bash 1.run_prepare_data.sh`
3. Generate predictions: `bash 2.run_gpt_datagen_multithread.sh`
4. Evaluate performance: `bash 3.scorer.sh`

### Customization Options
- Modify user prompts and instructions
- Implement example-based learning
- Use system prompts to guide the model
- Implement multiple assessments with preference tallying

## LangChain Implementation

This section demonstrates how to use LangChain to build AI agents and retrieval systems.

### Components
- Basic LangChain setup with OpenAI or DeepSeek models
- Agent implementation with tool calling capabilities
- Retrieval system using FAISS vector database
- Web search integration with Tavily API
- Multi-threaded data generation with API key rotation

### Dependencies
```
pip install langchain langchain_openai langchain_deepseek langchain_community langchain_core faiss-cpu tqdm jsonlines
```

### Usage
1. Set up API keys for OpenAI, DeepSeek, and/or Tavily
2. Run the desired script:
   ```
   cd langchain
   python langchain_get_start.py  # For basic LangChain usage
   python agent_get_start.py      # For agent implementation
   python prepare_retrieval_data.py # To build the retrieval system
   ```
3. For data generation with LangChain:
   ```
   python langchain_datagen_multithread.py --keys_path gpt3keys.txt --input_path input.jsonl --output_path output.jsonl --max_workers 10
   ```

### Data and Resources
- Medical exam questions in `langchain/data/exam.json`
- Medical knowledge base in `langchain/data/ppl.json`
- FAISS vector database in `langchain/faiss_index/`

## LangChain Data Generation

The repository now uses LangChain for data generation instead of direct OpenAI API calls.

### Features
- Multi-threaded parallel processing
- API key rotation for error handling and load balancing
- Progress tracking with tqdm
- Resumable processing (skips already processed items)
- Compatible with the original data format

### Usage
```
python langchain_datagen_multithread.py --keys_path gpt3keys.txt --input_path input.jsonl --output_path output.jsonl --max_workers 10 --model_name gpt-3.5-turbo
```

### Parameters
- `--keys_path`: Path to file containing API keys (one per line)
- `--input_path`: Path to input JSONL file
- `--output_path`: Path to output JSONL file
- `--max_workers`: Maximum number of concurrent threads
- `--model_name`: Name of the OpenAI model to use (default: gpt-3.5-turbo)

## Notes
- The scripts now use LangChain instead of direct OpenAI API calls
- The retrieval system uses OpenAI's text-embedding-3-small model
- The agent can answer medical questions by combining knowledge base retrieval and web search
- API key rotation helps handle rate limits and errors 