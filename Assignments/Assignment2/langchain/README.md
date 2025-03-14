# LangChain Tool Calling Project

This repository demonstrates how to use LangChain to enable tool calling capabilities for Large Language Models (LLMs). It shows how to define tools, create retrieval systems, and set up agents that can autonomously use these tools to solve problems.

## Project Overview

This project focuses on:
1. Defining tools in LangChain
2. Creating a retrieval system for local documents
3. Setting up an agent that can use these tools to answer questions

## Tool Definition

The project demonstrates two main types of tools:

### 1. Search Tool (Tavily)

The `tavily.py` file shows how to integrate the Tavily search API with LangChain:
- Setting up API authentication
- Configuring search parameters
- Using the search results in a LangChain pipeline

You need to get a tavily api key from [here](https://tavily.com/)


### 2. Retrieval Tool

The project demonstrates how to create a retrieval tool for local documents:

1. **Preparing the Data**: The `prepare_retrieval_data.py` script shows how to:
   - Load text data from JSON files
   - Split documents into chunks
   - Create embeddings using OpenAI's embedding model
   - Build a FAISS vector store for efficient retrieval

### More Tools
You can find more tools in [here](https://python.langchain.com/docs/introduction/)

## Tool Initialization


1. **Creating the Search Tool**: In `agent_get_start.py`, you can see how the search tool is initialized:

```python
search_tool = TavilySearchResults(max_results=4)
```

In `agent_get_start.py`, you can see how the retrieval tool is initialized:

```python
retrieval_tool = create_retriever_tool(
    retriever,
    "medical_document_retriever",
    "A tool for retrieving information from the medical document"
)
```

2. **Creating the Retrieval Tool**: In `agent_get_start.py`, you can see how the retrieval tool is set up:

```python
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = FAISS.load_local("faiss_index", embeddings, allow_dangerous_deserialization=True)
retriever = vectorstore.as_retriever()

retrieval_tool = create_retriever_tool(
    retriever,
    "medical_document_retriever",
    "A tool for retrieving information from the medical document"
)
```


## Setting Up an Agent with Tool Calling Capabilities

The `agent_get_start.py` file demonstrates how to create an agent that can use the defined tools:

1. **Preparing the Tools**: Combining the search and retrieval tools into a list:
```python
tools = [retrieval_tool, search_tool]
```

2. **Creating the Agent**: Using LangChain's agent creation utilities:
```python
prompt = hub.pull("hwchase17/openai-functions-agent")
agent = create_tool_calling_agent(model, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
```

You can also check out other examples of prompts for agents in [here](https://smith.langchain.com/hub/)

3. **Executing the Agent**: The agent can now solve problems by autonomously deciding when to use which tool:
```python
agent_executor.invoke({"input": "胃寒应该怎么办"})
```

## Model Integration

The project supports multiple LLM providers:

- **OpenAI**:
```python
os.environ["OPENAI_API_KEY"] = "your_openai_api_key"
os.environ["OPENAI_BASE_URL"] = "https://apix.ai-gaochao.cn/v1"
model = ChatOpenAI(model="gpt-4o", temperature=1)
```

- **DeepSeek** (commented out in the code):
```python
os.environ["DEEPSEEK_API_KEY"] = "your_deepseek_api_key"
os.environ["DEEPSEEK_BASE_URL"] = "https://api.deepseek.com/v1"
model = ChatDeepSeek(model="deepseek-chat", temperature=1)
```

## Project Structure

```
langchain/
├── agent_get_start.py        # Main agent implementation with tool calling
├── data/                     # Data directory
│   ├── exam.json             # Medical exam questions dataset
│   └── ppl.json              # Medical knowledge base
├── faiss_index/              # Vector database for retrieval
│   ├── index.faiss           # FAISS index file
│   └── index.pkl             # Pickle file for the index
├── langchain_get_start.py    # Basic LangChain setup and usage
├── prepare_retrieval_data.py # Script to prepare data for retrieval
└── tavily.py                 # Example of using Tavily search API
```

## Getting Started

To use these scripts, you'll need to:

1. Set up API keys for the services you want to use (OpenAI, DeepSeek, Tavily)
2. Install the required dependencies:
   ```
   pip install langchain langchain_openai langchain_deepseek langchain_community faiss-cpu
   ```
3. Prepare your retrieval data (if using the retrieval tool)
4. Run the agent script:
   ```
   python agent_get_start.py
   ```

## Use Cases

The agent can handle various tasks, such as:
- Answering medical questions by retrieving information from local documents
- Searching the web for up-to-date information
- Solving multiple-choice questions by combining knowledge from different sources 