# %%
import os
from langchain_community.document_loaders import TextLoader
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.tools.retriever import create_retriever_tool
import concurrent.futures
from typing import List, Any
import time

def process_chunk_batch(chunks_batch: List[Any], model_name: str = "text-embedding-3-small") -> FAISS:
    """处理一批文档块并返回对应的向量存储"""
    embeddings = OpenAIEmbeddings(model=model_name)
    return FAISS.from_documents(chunks_batch, embeddings)


def parallel_vectorize(chunks: List[Any], batch_size: int = 100, max_workers: int = 4, 
                       model_name: str = "text-embedding-3-small") -> FAISS:
    """
    并行处理文档块并生成向量存储
    
    参数:
        chunks: 文档块列表
        batch_size: 每批处理的文档块数量
        max_workers: 最大工作线程数
        model_name: 使用的嵌入模型名称
    
    返回:
        合并后的FAISS向量存储
    """
    start_time = time.time()
    print(f"开始处理 {len(chunks)} 个文档块，分 {max_workers} 个线程，每批 {batch_size} 个...")
    
    # 将chunks分成多个批次
    batches = [chunks[i:i+batch_size] for i in range(0, len(chunks), batch_size)]
    
    # 创建临时目录保存中间结果
    temp_dir = "temp_faiss_indexes"
    os.makedirs(temp_dir, exist_ok=True)
    
    # 使用线程池并行处理批次
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        # 提交所有批次的处理任务
        future_to_batch = {
            executor.submit(process_chunk_batch, batch, model_name): i 
            for i, batch in enumerate(batches)
        }
        
        # 收集结果
        vectorstores = []
        for future in concurrent.futures.as_completed(future_to_batch):
            batch_idx = future_to_batch[future]
            try:
                vectorstore = future.result()
                # 保存这个批次的向量存储
                temp_path = f"{temp_dir}/batch_{batch_idx}"
                vectorstore.save_local(temp_path)
                vectorstores.append(vectorstore)
                print(f"完成批次 {batch_idx+1}/{len(batches)}")
            except Exception as e:
                print(f"处理批次 {batch_idx} 时出错: {e}")
    
    # 合并所有向量存储
    print("合并所有向量存储...")
    if not vectorstores:
        raise ValueError("没有成功处理的批次")
    
    final_vectorstore = vectorstores[0]
    if len(vectorstores) > 1:
        for vs in vectorstores[1:]:
            final_vectorstore.merge_from(vs)
    
    elapsed_time = time.time() - start_time
    print(f"处理完成，耗时: {elapsed_time:.2f} 秒")
    
    return final_vectorstore

# %%
if __name__ == "__main__":
    # 设置环境变量
    os.environ["OPENAI_API_KEY"] = "your_openai_api_key"
    os.environ["OPENAI_BASE_URL"] = "https://apix.ai-gaochao.cn/v1"

    # 加载数据
    loader = TextLoader("data/ppl.json", encoding='utf-8')
    documents = loader.load()

    # 分割数据
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = text_splitter.split_documents(documents)
    print(len(chunks))

    # %%
    # 创建向量库
    # 并行处理文档
    vectorstore = parallel_vectorize(
        chunks=chunks,
        batch_size=100,    # 每批100个文档块
        max_workers=30,     # 使用4个线程
        model_name="text-embedding-3-small"
    )
    # 保存向量库
    vectorstore.save_local("faiss_index")


    # %%
    # 加载向量库
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    vectorstore = FAISS.load_local("faiss_index", embeddings, allow_dangerous_deserialization=True)

    # 创建检索工具
    retriever = vectorstore.as_retriever()



    # %%
    # 检索
    print(retriever.invoke("胃寒应该怎么办")[0])

