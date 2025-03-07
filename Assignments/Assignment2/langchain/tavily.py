import os
from langchain_community.tools.tavily_search import TavilySearchResults

os.environ["TAVILY_API_KEY"] = "your_tavily_api_key"

search = TavilySearchResults(max_results=2)

print(search.invoke("今天深圳天气怎么样"))