# %%
import os
import re
import json
from langchain_core.output_parsers import StrOutputParser
from langchain import hub
from langchain.agents import create_tool_calling_agent
from langchain.agents import AgentExecutor
from langchain_deepseek import ChatDeepSeek
from langchain_openai import ChatOpenAI
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain.tools.retriever import create_retriever_tool
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings

def get_ans(ans):
    match = re.findall(r'.*?([A-E]+(?:[、, ]+[A-E]+)*)', ans)
    if match:
        last_match = match[-1]
        return ''.join(re.split(r'[、, ，]+', last_match))
    return ''

# %%
os.environ["TAVILY_API_KEY"] = "your_tavily_api_key"

os.environ["OPENAI_API_KEY"] = "your_openai_api_key"
os.environ["OPENAI_BASE_URL"] = "https://apix.ai-gaochao.cn/v1"
model = ChatOpenAI(model="gpt-4o", temperature=1)

# os.environ["DEEPSEEK_API_KEY"] = "your_deepseek_api_key"
# os.environ["DEEPSEEK_BASE_URL"] = "https://api.deepseek.com/v1"
# model = ChatDeepSeek(model="deepseek-chat", temperature=1)



# %%
# prepare the retrieval tool

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = FAISS.load_local("faiss_index", embeddings, allow_dangerous_deserialization=True)
retriever = vectorstore.as_retriever()

retrieval_tool = create_retriever_tool(
    retriever,
    "medical_document_retriever",
    "A tool for retrieving information from the medical document"
)

# %%
# prepare the search tool
search_tool = TavilySearchResults(max_results=4)

tools = [retrieval_tool, search_tool]

# %%
# prepare the agent
prompt = hub.pull("hwchase17/openai-functions-agent")
print(prompt.messages)

agent = create_tool_calling_agent(model, tools, prompt)

agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# %%
# execute the agent
if __name__ == "__main__":
    agent_executor.invoke({"input": "胃寒应该怎么办"})

    exam = json.load(open("data/exam.json", "r"))
    agent_executor.invoke({"input": f"请回答下面的多选题，请直接正确答案选项，不要输出其他内容。\n{exam[0]['question']}\n{exam[0]['option']}"})
    agent_answer = result.get('output', '')
    processed_answer = get_ans(agent_answer)
    print(processed_answer)
# %%
