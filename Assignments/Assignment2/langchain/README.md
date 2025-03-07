# LangChain Project

This repository contains a collection of scripts and tools for working with LangChain, focusing on building AI agents, retrieval systems, and integrating with various LLM providers.

## Project Structure

```
langchain/
├── agent_get_start.py        # Agent implementation with tool calling
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

## Components

### LangChain Basics

The `langchain_get_start.py` file demonstrates how to set up a basic LangChain pipeline using either OpenAI or DeepSeek models. It shows:
- How to configure API keys and endpoints
- Creating a simple prompt template
- Building a chain with a model and output parser

### Agent Implementation

The `agent_get_start.py` file implements an agent that can use multiple tools:
- Medical document retrieval tool (using FAISS vector database)
- Web search tool (using Tavily API)
- The agent can answer medical questions and process multiple-choice exams

### Retrieval System

The `prepare_retrieval_data.py` script builds a retrieval system:
- Loads text data from JSON files
- Splits documents into chunks
- Creates embeddings using OpenAI's embedding model
- Builds a FAISS vector store for efficient retrieval
- Implements parallel processing for handling large datasets

### Search Integration

The `tavily.py` file demonstrates how to use the Tavily search API with LangChain to perform web searches.

## Data

The project includes two main data files:
- `exam.json`: A collection of medical exam questions with options, answers, and explanations
- `ppl.json`: A comprehensive medical knowledge base used for retrieval

## Vector Database

The `faiss_index` directory contains the FAISS vector database files:
- `index.faiss`: The FAISS index file containing vector embeddings
- `index.pkl`: A pickle file with metadata for the index

## Usage

To use these scripts, you'll need to:

1. Set up API keys for the services you want to use (OpenAI, DeepSeek, Tavily)
2. Install the required dependencies:
   ```
   pip install langchain langchain_openai langchain_deepseek langchain_community faiss-cpu
   ```
3. Run the desired script, for example:
   ```
   python langchain_get_start.py
   ```

## Notes

- The scripts are designed to work with either OpenAI or DeepSeek models (commented sections show how to switch between them)
- The retrieval system uses OpenAI's text-embedding-3-small model for creating embeddings
- The agent implementation can answer medical questions by combining retrieval from the knowledge base and web search 